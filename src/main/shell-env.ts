/**
 * Shell Environment Loader
 *
 * macOS の Finder/Dock から Electron アプリを起動した場合、
 * PATH は launchd の最小セット（/usr/bin:/bin:/usr/sbin:/sbin）しか持たない。
 * nvm, Homebrew, pyenv 等でインストールした node が見つからず
 * "spawn node ENOENT" エラーが発生する。
 *
 * このモジュールはユーザーのログインシェルを起動して環境変数を取り込み、
 * process.env にマージすることで問題を解消する。
 * シェル読み込みが失敗した場合でも、ファイルシステムを直接検索して
 * node バイナリのパスを追加するフォールバックを持つ。
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

// 開発サーバー起動時に使われる VITE_* 変数はインポートしない
// （パッケージ済みアプリが localhost を参照してしまうのを防ぐ）
const shouldSkipEnvVar = (key: string): boolean => {
  return key.startsWith('VITE_')
}

/**
 * node バイナリが PATH に含まれているか確認し、なければ追加する。
 * nvm / Homebrew / volta など一般的な node マネージャのパスを検索する。
 */
function ensureNodeInPath(): void {
  const pathDirs = (process.env.PATH || '').split(':')
  const hasNode = pathDirs.some(dir => existsSync(join(dir, 'node')))
  if (hasNode) return

  const home = process.env.HOME || ''
  const additionalPaths: string[] = []

  // nvm: バージョンディレクトリを最新順にソートして最初のものを使う
  const nvmVersionsDir = join(home, '.nvm', 'versions', 'node')
  if (existsSync(nvmVersionsDir)) {
    try {
      const versions = readdirSync(nvmVersionsDir)
        .filter(v => /^v\d/.test(v))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      if (versions.length > 0) {
        additionalPaths.push(join(nvmVersionsDir, versions[0], 'bin'))
      }
    } catch {
      // readdirSync が失敗しても続行
    }
  }

  // volta
  const voltaBin = join(home, '.volta', 'bin')
  if (existsSync(join(voltaBin, 'node'))) {
    additionalPaths.push(voltaBin)
  }

  // fnm
  for (const fnmBase of [join(home, '.fnm', 'node-versions'), join(home, 'Library', 'Application Support', 'fnm', 'node-versions')]) {
    if (existsSync(fnmBase)) {
      try {
        const versions = readdirSync(fnmBase)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        if (versions.length > 0) {
          // fnm のバイナリは installation/node/bin 以下
          const candidate = join(fnmBase, versions[0], 'installation', 'bin')
          if (existsSync(join(candidate, 'node'))) {
            additionalPaths.push(candidate)
            break
          }
        }
      } catch {
        // 続行
      }
    }
  }

  // Homebrew node（Apple Silicon / Intel）
  for (const p of [
    '/opt/homebrew/opt/node/bin',
    '/opt/homebrew/bin',
    '/usr/local/opt/node/bin',
    '/usr/local/bin',
  ]) {
    if (existsSync(join(p, 'node'))) {
      additionalPaths.push(p)
      break
    }
  }

  if (additionalPaths.length > 0) {
    process.env.PATH = [
      ...additionalPaths,
      ...pathDirs,
    ]
      .filter((p, i, arr) => p && arr.indexOf(p) === i)
      .join(':')
  }
}

/**
 * ユーザーのシェル環境を読み込んで process.env にマージする
 *
 * アプリ起動の最初（他のモジュールより前）に呼び出すこと。
 */
export function loadShellEnv(): void {
  // macOS 以外では不要（Windows/Linux はターミナルから起動されることが多い）
  if (process.platform !== 'darwin') {
    return
  }

  // 開発モードはターミナル起動なのでスキップ
  if (process.env.ELECTRON_RENDERER_URL) {
    return
  }

  const shell = process.env.SHELL || '/bin/zsh'

  try {
    // ログインシェル(-l)で起動して env を取得
    // -l: .zprofile / .bash_profile 等のプロファイルを読む
    // 注意: -i (interactive) は非TTY環境で問題が起きやすいため使わない。
    //       nvm 等 .zshrc にしかない設定は後段の ensureNodeInPath() でカバーする。
    // マーカーで起動ログと env 出力を分離する
    const output = execSync(`${shell} -l -c 'echo __ENV_START__ && env'`, {
      encoding: 'utf-8',
      timeout: 5000,
      env: {
        HOME: process.env.HOME,
        USER: process.env.USER,
        SHELL: shell,
        TERM: 'dumb',
        TMPDIR: process.env.TMPDIR,
        // Xcode CLI Tools が未インストールの場合にダイアログが出るのを抑制
        APPLE_SUPPRESS_DEVELOPER_TOOL_POPUP: '1',
        GIT_TERMINAL_PROMPT: '0',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // マーカー以降の部分だけを解析して process.env に反映
    const envSection = output.split('__ENV_START__')[1] || ''
    for (const line of envSection.trim().split('\n')) {
      const eq = line.indexOf('=')
      if (eq > 0) {
        const key = line.substring(0, eq)
        if (shouldSkipEnvVar(key)) continue
        process.env[key] = line.substring(eq + 1)
      }
    }
  } catch {
    // シェル環境の読み込みに失敗してもアプリ起動は続行する
    // Homebrew のパスを追加する（ログインシェル相当）
    const currentPath = process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin'
    process.env.PATH = [
      '/opt/homebrew/bin',    // Homebrew (Apple Silicon)
      '/opt/homebrew/sbin',
      '/usr/local/bin',        // Homebrew (Intel) / 手動インストール
      `${process.env.HOME}/.local/bin`,
      `${process.env.HOME}/.bun/bin`,
      `${process.env.HOME}/.cargo/bin`,
      ...currentPath.split(':'),
    ]
      .filter((p, i, arr) => p && arr.indexOf(p) === i)
      .join(':')
  }

  // シェル読み込みの成否にかかわらず、node が PATH になければ追加する
  // (.zshrc にしか書かれていない nvm 等はシェル読み込みでは取得できない場合がある)
  ensureNodeInPath()
}

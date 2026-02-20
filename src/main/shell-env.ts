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
 */

import { execSync } from 'child_process'

// 開発サーバー起動時に使われる VITE_* 変数はインポートしない
// （パッケージ済みアプリが localhost を参照してしまうのを防ぐ）
const shouldSkipEnvVar = (key: string): boolean => {
  return key.startsWith('VITE_')
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
    // ログインシェル(-l)かつインタラクティブ(-i)で起動して env を取得
    // -l: .zprofile 等のプロファイルを読む
    // -i: .zshrc 等の RC ファイルを読む
    // マーカーで起動ログと env 出力を分離する
    const output = execSync(`${shell} -l -i -c 'echo __ENV_START__ && env'`, {
      encoding: 'utf-8',
      timeout: 5000,
      env: {
        HOME: process.env.HOME,
        USER: process.env.USER,
        SHELL: shell,
        TERM: 'xterm-256color',
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
    // よく使われるパスをフォールバックとして追加する
    const fallbackPaths = [
      '/opt/homebrew/bin',      // Homebrew (Apple Silicon)
      '/usr/local/bin',          // Homebrew (Intel) / 手動インストール
      `${process.env.HOME}/.nvm/versions/node/$(ls ${process.env.HOME}/.nvm/versions/node 2>/dev/null | tail -1)/bin`,
      `${process.env.HOME}/.local/bin`,
      `${process.env.HOME}/.bun/bin`,
      `${process.env.HOME}/.cargo/bin`,
    ]

    const currentPath = process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin'
    process.env.PATH = [
      ...fallbackPaths,
      ...currentPath.split(':'),
    ]
      .filter((p, i, arr) => p && arr.indexOf(p) === i) // 空文字・重複を除去
      .join(':')
  }
}

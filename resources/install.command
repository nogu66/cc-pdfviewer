#!/bin/bash
# CC PDF Viewer - Gatekeeper バイパス インストーラー
# このスクリプトをダブルクリックすると Terminal が開き、
# macOS の隔離属性を削除して CC PDF Viewer を起動可能にします。

APP_NAME="CC PDF Viewer"
APP_PATH="/Applications/${APP_NAME}.app"

echo "========================================"
echo "  CC PDF Viewer - インストール補助"
echo "========================================"
echo ""

if [ ! -d "$APP_PATH" ]; then
    echo "⚠️  ${APP_NAME}.app が /Applications に見つかりません。"
    echo ""
    echo "手順："
    echo "  1. この DMG ウィンドウで CC PDF Viewer.app を"
    echo "     Applications フォルダにドラッグしてください。"
    echo "  2. その後、このスクリプトをもう一度実行してください。"
    echo ""
    read -p "Enterキーを押して終了..."
    exit 1
fi

echo "Gatekeeper の隔離属性を削除しています..."
xattr -dr com.apple.quarantine "$APP_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 完了！CC PDF Viewer を通常通り起動できます。"
    echo ""
    echo "Launchpad または /Applications から起動してください。"
else
    echo ""
    echo "❌ エラーが発生しました。管理者権限で再試行します..."
    sudo xattr -dr com.apple.quarantine "$APP_PATH"
fi

echo ""
read -p "Enterキーを押して終了..."

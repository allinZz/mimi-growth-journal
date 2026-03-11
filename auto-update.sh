#!/bin/bash
# 咪咪成长网站自动更新脚本
# 每天凌晨 3 点自动更新网站数据并推送到 GitHub

set -e

# 加载 nvm 环境变量（cron 需要）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 使用绝对路径确保 cron 环境能找到 node
NODE_BIN="/root/.nvm/versions/node/v22.22.1/bin/node"

WORKSPACE="/root/.openclaw/workspace"
WEBSITE_DIR="$WORKSPACE/website"
MEMORY_DIR="$WORKSPACE/memory"

echo "🦞 开始更新成长网站数据..."
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"

# 1. 更新 stats.json
echo "📊 更新统计数据..."
TODAY=$(date '+%Y-%m-%d')
MEMORY_COUNT=$(ls "$MEMORY_DIR"/*.md 2>/dev/null | grep -c "$TODAY" 2>/dev/null || echo "0")
MEMORY_COUNT=$(echo "$MEMORY_COUNT" | tr -d '[:space:]' | head -c 5)

if [ "$MEMORY_COUNT" -gt 0 ]; then
    # 检查今天是否已在 stats.json 中
    if ! grep -q "$TODAY" "$WEBSITE_DIR/stats.json"; then
        echo "  → 添加今天日期：$TODAY"
        # 使用 node 更新 JSON
        "$NODE_BIN" -e "
const fs = require('fs');
const stats = JSON.parse(fs.readFileSync('$WEBSITE_DIR/stats.json', 'utf-8'));
if (!stats.memory_dates.includes('$TODAY')) {
    stats.memory_dates.push('$TODAY');
    stats.memory_days = stats.memory_dates.length;
    stats.learning_days = stats.memory_dates.length;
    stats.generated_at = new Date().toISOString();
    fs.writeFileSync('$WEBSITE_DIR/stats.json', JSON.stringify(stats, null, 2));
    console.log('✅ stats.json 已更新');
}
"
    fi
fi

# 2. 生成日记数据
echo "📝 生成日记数据..."
cd "$WEBSITE_DIR" && "$NODE_BIN" generate-diary-data.js

# 3. 导出数据
echo "💾 导出数据..."
cd "$WEBSITE_DIR" && "$NODE_BIN" export-data.js all

# 4. 推送到 GitHub
echo "🚀 推送到 GitHub..."
cd "$WEBSITE_DIR"
if git status --porcelain | grep -q .; then
    git add -A
    git commit -m "自动更新：$(date '+%Y-%m-%d')"
    git push
    echo "✅ 网站已更新并推送"
else
    echo "ℹ️  无变更，跳过推送"
fi

echo "🦞 更新完成！"

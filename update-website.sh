#!/bin/bash

# 咪咪网站数据更新脚本
# 每次记忆文件或技能更新后运行

set -e

WORKSPACE="/root/.openclaw/workspace"
WEBSITE_DIR="$WORKSPACE/website"

echo "🦞 开始更新网站数据..."

# 1. 生成统计数据
echo "📊 生成统计数据..."
node "$WEBSITE_DIR/generate-stats.js"

# 2. 生成导出文件
echo "📥 生成导出文件..."
cd "$WEBSITE_DIR"
node export-data.js all

# 3. 同步到 GitHub Pages (如果配置了)
if [ -d "$WEBSITE_DIR/.git" ]; then
    echo "🚀 同步到 GitHub Pages..."
    cd "$WEBSITE_DIR"
    git add stats.json mimi-growth-export.json mimi-growth-export.md
    git commit -m "chore: auto-update stats $(date '+%Y-%m-%d %H:%M')" || true
    git push || true
fi

echo "✅ 网站数据更新完成！"
echo ""
echo "📊 当前统计:"
cat "$WEBSITE_DIR/stats.json" | grep -E "(skills_count|learning_days|task_count)"

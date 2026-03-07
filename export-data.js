#!/usr/bin/env node

/**
 * 咪咪成长数据导出脚本
 * 导出为 JSON 或 Markdown 格式
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const WEBSITE_DIR = path.join(WORKSPACE, 'website');

function exportJSON() {
  const stats = require('./stats.json');
  const memoryDates = stats.memory_dates;
  
  const exportData = {
    ...stats,
    memory_files: {}
  };
  
  for (const date of memoryDates) {
    const filePath = path.join(MEMORY_DIR, `${date}.md`);
    if (fs.existsSync(filePath)) {
      exportData.memory_files[date] = fs.readFileSync(filePath, 'utf-8');
    }
  }
  
  const outputPath = path.join(WEBSITE_DIR, 'mimi-growth-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ JSON 导出完成：${outputPath}`);
  return outputPath;
}

function exportMarkdown() {
  const stats = require('./stats.json');
  const memoryDates = stats.memory_dates;
  
  let markdown = `# 🦞 咪咪成长记录完整导出\n\n`;
  markdown += `**导出时间：** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
  markdown += `**学习周期：** ${stats.start_date} 至今 (共 ${stats.learning_days} 天)\n\n`;
  
  markdown += `## 📊 数据统计\n\n`;
  markdown += `- 掌握技能：${stats.skills_count} 个\n`;
  markdown += `- 记忆天数：${stats.memory_days} 天\n`;
  markdown += `- 完成任务：${stats.task_count} 个\n`;
  markdown += `- 长期记忆：${stats.memory_entries} 条\n\n`;
  
  markdown += `---\n\n`;
  
  for (const date of memoryDates) {
    const filePath = path.join(MEMORY_DIR, `${date}.md`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      markdown += content + '\n\n---\n\n';
    }
  }
  
  // 添加 MEMORY.md
  const memoryFile = path.join(WORKSPACE, 'MEMORY.md');
  if (fs.existsSync(memoryFile)) {
    markdown += `## 🧠 长期记忆 (MEMORY.md)\n\n`;
    markdown += fs.readFileSync(memoryFile, 'utf-8') + '\n';
  }
  
  const outputPath = path.join(WEBSITE_DIR, 'mimi-growth-export.md');
  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Markdown 导出完成：${outputPath}`);
  return outputPath;
}

// 主函数
const format = process.argv[2] || 'json';

if (format === 'json') {
  exportJSON();
} else if (format === 'md' || format === 'markdown') {
  exportMarkdown();
} else if (format === 'all') {
  exportJSON();
  exportMarkdown();
} else {
  console.log('用法：node export-data.js [json|md|all]');
  console.log('默认导出 JSON 格式');
}

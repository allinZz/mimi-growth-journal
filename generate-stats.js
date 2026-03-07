#!/usr/bin/env node

/**
 * 咪咪成长数据统计脚本
 * 自动扫描 memory/ 和 skills/ 目录，生成 stats.json
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');
const OUTPUT_FILE = path.join(WORKSPACE, 'website', 'stats.json');

function countSkills() {
  try {
    const files = fs.readdirSync(SKILLS_DIR);
    return files.filter(f => !f.startsWith('.')).length;
  } catch (e) {
    console.error('Error counting skills:', e.message);
    return 0;
  }
}

function countMemoryDays() {
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    // 匹配 YYYY-MM-DD.md 格式的文件
    const dateFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    return dateFiles.length;
  } catch (e) {
    console.error('Error counting memory days:', e.message);
    return 0;
  }
}

function getMemoryDates() {
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    const dateFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    return dateFiles.map(f => f.replace('.md', '')).sort();
  } catch (e) {
    return [];
  }
}

function calculateLearningDays() {
  const dates = getMemoryDates();
  if (dates.length === 0) return 0;
  
  // 学习天数 = 有记忆文件的天数 - 1（今天不算完整的一天）
  // 除非今天是过去的日期（记录补录）
  const today = new Date().toISOString().split('T')[0];
  const hasToday = dates.includes(today);
  
  // 如果今天有记录，说明是当天更新，学习天数 = 总天数 - 1
  // 否则学习天数 = 总天数
  return hasToday ? dates.length - 1 : dates.length;
}

function countTasks() {
  // 从记忆文件中统计已完成任务数
  let taskCount = 0;
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    const dateFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    
    for (const file of dateFiles) {
      const content = fs.readFileSync(path.join(MEMORY_DIR, file), 'utf-8');
      // 统计 "✅" 标记的任务
      const matches = content.match(/✅/g);
      if (matches) {
        taskCount += matches.length;
      }
    }
  } catch (e) {
    console.error('Error counting tasks:', e.message);
  }
  
  return taskCount;
}

function countMemoryEntries() {
  // 统计 MEMORY.md 中的记忆条目数
  const memoryFile = path.join(WORKSPACE, 'MEMORY.md');
  try {
    const content = fs.readFileSync(memoryFile, 'utf-8');
    // 统计 "### " 或 "## " 标题下的条目
    const sections = content.match(/### .* - /g);
    return sections ? sections.length : 0;
  } catch (e) {
    return 0;
  }
}

function getStartDate() {
  const dates = getMemoryDates();
  return dates.length > 0 ? dates[0] : '2026-03-05';
}

function generateStats() {
  const stats = {
    generated_at: new Date().toISOString(),
    skills_count: countSkills(),
    memory_days: countMemoryDays(),
    learning_days: calculateLearningDays(),
    task_count: countTasks(),
    memory_entries: countMemoryEntries(),
    start_date: getStartDate(),
    memory_dates: getMemoryDates()
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2));
  console.log('✅ Stats generated:', stats);
  return stats;
}

// 如果直接运行脚本
if (require.main === module) {
  generateStats();
}

module.exports = { generateStats };

#!/usr/bin/env node

/**
 * 生成日记页面数据
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const WEBSITE_DIR = path.join(WORKSPACE, 'website');

function daysSinceStart(dateStr, startStr) {
    const start = new Date(startStr);
    const date = new Date(dateStr);
    const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    return diff + 1;
}

function getWeekday(dateStr) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[new Date(dateStr).getDay()];
}

function generateDiaryData() {
    const stats = require('./stats.json');
    const diaryData = [];
    
    for (const date of stats.memory_dates.slice().reverse()) {
        const filePath = path.join(MEMORY_DIR, `${date}.md`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const dayNum = daysSinceStart(date, stats.start_date);
            
            diaryData.push({
                date: date,
                title: `Day ${dayNum} - ${getWeekday(date)}`,
                summary: content.split('\n').slice(0, 10).join('\n'),
                fullContent: content,
                stats: {
                    skills: stats.skills_count,
                    tasks: stats.task_count,
                    articles: stats.article_count
                }
            });
        }
    }
    
    const outputPath = path.join(WEBSITE_DIR, 'diary-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(diaryData, null, 2));
    console.log(`✅ 日记数据生成完成：${outputPath} (${diaryData.length} 条记录)`);
    return outputPath;
}

generateDiaryData();

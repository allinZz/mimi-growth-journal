#!/usr/bin/env node

/**
 * 咪咪网站后端 API
 * 提供动态数据生成和导出功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEBSITE_DIR = '/root/.openclaw/workspace/website';
const MEMORY_DIR = '/root/.openclaw/workspace/memory';
const WORKSPACE = '/root/.openclaw/workspace';

// 生成统计数据
function generateStats() {
  const { generateStats: genStats } = require('./generate-stats.js');
  return genStats();
}

// 读取 stats.json
function getStats() {
  try {
    const statsPath = path.join(WEBSITE_DIR, 'stats.json');
    return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
  } catch (e) {
    return generateStats();
  }
}

// 生成导出文件
function generateExport(format) {
  const exec = require('child_process').execSync;
  try {
    exec(`node ${WEBSITE_DIR}/export-data.js ${format}`, { cwd: WEBSITE_DIR });
    return { success: true, message: `Export generated: ${format}` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 读取导出文件
function readExportFile(format) {
  const filename = format === 'json' ? 'mimi-growth-export.json' : 'mimi-growth-export.md';
  const filepath = path.join(WEBSITE_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    generateExport(format);
  }
  
  return fs.readFileSync(filepath, 'utf-8');
}

// 获取记忆文件列表
function getMemoryFiles() {
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    return files.filter(f => f.endsWith('.md'));
  } catch (e) {
    return [];
  }
}

// 读取单个记忆文件
function readMemoryFile(filename) {
  const filepath = path.join(MEMORY_DIR, filename);
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath, 'utf-8');
  }
  return null;
}

// HTTP 服务器
const server = http.createServer((req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // API 路由
  if (pathname === '/api/stats') {
    const stats = getStats();
    res.end(JSON.stringify(stats));
  }
  else if (pathname === '/api/export/json') {
    const content = readExportFile('json');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="mimi-growth-export.json"');
    res.end(content);
  }
  else if (pathname === '/api/export/md') {
    const content = readExportFile('md');
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="mimi-growth-export.md"');
    res.end(content);
  }
  else if (pathname === '/api/memory') {
    const files = getMemoryFiles();
    res.end(JSON.stringify(files));
  }
  else if (pathname.startsWith('/api/memory/')) {
    const filename = pathname.replace('/api/memory/', '');
    const content = readMemoryFile(filename);
    if (content) {
      res.setHeader('Content-Type', 'text/markdown');
      res.end(content);
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'File not found' }));
    }
  }
  else if (pathname === '/api/regenerate') {
    const stats = generateStats();
    generateExport('all');
    res.end(JSON.stringify({ success: true, stats }));
  }
  // 静态文件服务
  else if (pathname === '/') {
    const indexPath = path.join(WEBSITE_DIR, 'index.html');
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(indexPath, 'utf-8'));
  }
  else {
    const filepath = path.join(WEBSITE_DIR, pathname);
    if (fs.existsSync(filepath)) {
      const ext = path.extname(filepath);
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.md': 'text/markdown',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
      }[ext] || 'text/plain';
      
      res.setHeader('Content-Type', contentType);
      res.end(fs.readFileSync(filepath));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦞 咪咪网站服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📊 API 端点:`);
  console.log(`  GET  /api/stats          - 获取统计数据`);
  console.log(`  GET  /api/export/json    - 导出 JSON`);
  console.log(`  GET  /api/export/md      - 导出 Markdown`);
  console.log(`  GET  /api/memory         - 记忆文件列表`);
  console.log(`  GET  /api/memory/:file   - 读取记忆文件`);
  console.log(`  GET  /api/regenerate     - 重新生成数据`);
});

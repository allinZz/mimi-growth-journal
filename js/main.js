/**
 * 咪咪网站主 JavaScript
 * 动态数据加载 + 交互功能
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('🦞 咪咪网站已加载');
    
    // 加载动态数据
    loadStats();
    
    // 导航栏滚动效果
    setupNavbarScroll();
    
    // 平滑滚动
    setupSmoothScroll();
    
    // 导出功能
    setupExportButtons();
    
    // 动画效果
    setupAnimations();
});

// 加载统计数据
async function loadStats() {
    try {
        const response = await fetch('stats.json');
        const stats = await response.json();
        
        // 更新 Hero 区域数据
        updateStatElement('skill-count', stats.skills_count);
        updateStatElement('task-count', stats.task_count);
        updateStatElement('day-count', stats.learning_days);
        updateStatElement('memory-count', stats.memory_entries);
        
        // 更新故事中的技能数
        const storySkillEl = document.getElementById('story-skill-count');
        if (storySkillEl) {
            storySkillEl.textContent = stats.skills_count;
        }
        
        // 更新页面标题
        document.title = `咪咪 Mimi - ${stats.skills_count} 个技能的 AI 助手 🦞`;
        
        // 更新时间线
        if (stats.memory_dates) {
            loadTimeline(stats.memory_dates);
        }
        
        console.log('✅ 数据已更新:', stats);
    } catch (e) {
        console.warn('⚠️ 无法加载 stats.json:', e.message);
    }
}

// 更新单个统计元素
function updateStatElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        // 数字滚动动画
        animateNumber(el, parseInt(el.textContent) || 0, value);
    }
}

// 数字滚动动画
function animateNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 导航栏滚动效果
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// 平滑滚动
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 导出功能
function setupExportButtons() {
    // JSON 导出
    const jsonBtn = document.getElementById('export-json');
    if (jsonBtn) {
        jsonBtn.addEventListener('click', () => exportData('json'));
    }
    
    // Markdown 导出
    const mdBtn = document.getElementById('export-md');
    if (mdBtn) {
        mdBtn.addEventListener('click', () => exportData('md'));
    }
}

// 导出数据
async function exportData(format) {
    try {
        const url = format === 'json' 
            ? 'mimi-growth-export.json' 
            : 'mimi-growth-export.md';
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = `mimi-growth-${new Date().toISOString().split('T')[0]}.${format}`;
        link.target = '_blank';
        link.click();
        
        showNotification('✅ 导出成功！', 'success');
    } catch (e) {
        showNotification('⚠️ 导出失败，请稍后再试', 'error');
        console.error('Export error:', e);
    }
}

// 加载时间线
async function loadTimeline(dates) {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        let html = '';
        
        for (const date of dates.reverse()) {
            const response = await fetch(`memory/${date}.md`);
            if (response.ok) {
                const content = await response.text();
                const excerpt = extractExcerpt(content);
                
                html += `
                    <div class="timeline-item">
                        <div class="timeline-content">
                            <div class="timeline-dot"></div>
                            <div class="timeline-date">${formatDate(date)}</div>
                            <div class="timeline-title">${excerpt.title}</div>
                            <div class="timeline-desc">${excerpt.text}</div>
                        </div>
                    </div>
                `;
            }
        }
        
        timelineContainer.innerHTML = html;
    } catch (e) {
        console.error('Timeline load error:', e);
        timelineContainer.innerHTML = '<p>时间线加载失败</p>';
    }
}

// 提取记忆文件摘要
function extractExcerpt(content) {
    const lines = content.split('\n');
    let title = '成长记录';
    let text = '';
    
    for (const line of lines) {
        if (line.startsWith('## ') || line.startsWith('### ')) {
            title = line.replace(/^#+ /, '');
            break;
        }
    }
    
    // 提取前 100 字
    const plainText = content.replace(/[#*`\[\]]/g, '').trim();
    text = plainText.substring(0, 150) + '...';
    
    return { title, text };
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('zh-CN', options);
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 30px;
        background: ${type === 'success' ? '#4ECDC4' : type === 'error' ? '#FF6B6B' : '#FFE66D'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 动画效果
function setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.stat-card, .feature-card, .timeline-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// CSS 动画类
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

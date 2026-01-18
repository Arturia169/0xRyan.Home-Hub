import React, { useState, useEffect } from 'react';
import {
  Search,
  Github,
  Activity,
  Zap,
  Cpu,
  Database,
  Globe,
  ArrowUpRight,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlipClock } from './components/FlipClock';

// 已移除过时模拟数据

const DOCKER_CONTAINERS = [
  { name: 'wallet-monitor', status: 'running' },
  { name: 'cloudflared', status: 'running' },
  { name: 'postgres', status: 'running' },
  { name: 'redis', status: 'stopped' },
];

const GITHUB_ACTIVITY = Array.from({ length: 28 }, () => Math.floor(Math.random() * 5));

const API_KEY = 'ryan_cyberhome_secret_key_2026';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // 真实数据状态
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [githubData, setGithubData] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'LOADING' | 'ONLINE' | 'OFFLINE'>('LOADING');

  // 动态获取 API 基础路径
  const getApiBase = () => {
    // 如果是域名访问，可以考虑映射，目前默认同主机 3000 端口
    const host = window.location.hostname;
    return `http://${host}:3000`;
  };

  // 1. 获取后端数据与 GitHub 数据
  useEffect(() => {
    const fetchData = async () => {
      const API_BASE = getApiBase();
      try {
        // 后端数据 (包含资产 + 系统监控)
        const res = await fetch(`${API_BASE}/api/home-dashboard`, {
          headers: { 'x-api-key': API_KEY }
        });
        if (!res.ok) throw new Error('Auth failed');
        const data = await res.json();
        setDashboardData(data);
        setApiStatus('ONLINE');
      } catch (err) {
        console.error('API Fetch failed:', err);
        setApiStatus('OFFLINE');
      }

      try {
        // GitHub 数据 (Arturia169)
        const ghRes = await fetch('https://github-contributions-api.deno.dev/Arturia169.json');
        const ghData = await ghRes.json();

        // 获取最近 28 天数据
        const contributions = ghData.contributions || [];
        const flattened = contributions.flat() || [];
        const last7x4 = (flattened.length > 0 ? flattened.slice(-28) : GITHUB_ACTIVITY).map((c: any) =>
          typeof c === 'number' ? c : (c.contributionCount || 0)
        );

        // 尝试获取总数
        const total = ghData.totalContributions || flattened.reduce((sum: number, c: any) => sum + (c.contributionCount || 0), 0);

        // 手动计算当前连续天数 (Streak)
        let streak = 0;
        for (let i = flattened.length - 1; i >= 0; i--) {
          if ((flattened[i].contributionCount || 0) > 0) {
            streak++;
          } else if (streak > 0) {
            // 如果已经有记录了，遇到 0 就断掉
            break;
          }
          // 如果最近一天就是 0，允许往前回溯一天（考虑到时差，GitHub 统计可能有延迟）
          if (i === flattened.length - 1 && (flattened[i].contributionCount || 0) === 0) continue;
        }

        setGithubData({
          grid: last7x4,
          total: total,
          streak: streak
        });
      } catch (err) {
        console.error('GitHub Fetch failed:', err);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 30000); // 30秒刷新一次
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    if (searchQuery.startsWith('/gh ')) {
      window.location.href = `https://github.com/search?q=${encodeURIComponent(searchQuery.slice(4))}`;
    } else if (searchQuery.startsWith('/gpt')) {
      window.location.href = 'https://chat.openai.com';
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // 数据映射
  const intelligence = dashboardData?.intelligence || [];

  return (
    <div className="main-container">
      {/* 顶部状态栏 - 翻页时钟 + 用户名 */}
      <header className="top-bar">
        <FlipClock />
        <div className="center-divider"></div>
        <div className="status-item">
          <Circle
            size={8}
            fill={apiStatus === 'ONLINE' ? '#00ff87' : apiStatus === 'OFFLINE' ? '#ff4d4d' : '#ffea00'}
            className="status-indicator"
            style={{ filter: `drop-shadow(0 0 5px ${apiStatus === 'ONLINE' ? '#00ff87' : '#ff4d4d'})` }}
          />
          <span className="user-badge" style={{ color: apiStatus === 'ONLINE' ? 'white' : '#ff4d4d' }}>
            {apiStatus === 'ONLINE' ? '基地链路已建立' : '后端连接中断'}
          </span>
        </div>
      </header>

      <main className="content">
        {/* 1. 搜索中心 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`search-section ${isFocused ? 'focused' : ''}`}
        >
          <div className="search-outer">
            <form onSubmit={handleSearch} className="search-inner">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="premium-input"
              />
              <motion.div
                animate={{ opacity: isFocused ? 1 : 0 }}
                className="search-shortcut"
              >
                <span>回车</span>
              </motion.div>
            </form>
          </div>

          <AnimatePresence>
            {searchQuery.startsWith('/') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="command-overlay"
              >
                <div className="command-item">
                  <Zap size={12} /> <span><b>/gh</b> 代码搜索</span>
                </div>
                <div className="command-item">
                  <Globe size={12} /> <span><b>/gpt</b> 启动 AI</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 2. 数据看板 - 增强外发光 */}
        <div className="premium-grid">
          {/* 情报看板 - 实时订阅流 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="cyber-card p-card card-glow-cyan"
          >
            <div className="p-card-header">
              <Zap size={16} className="text-cyan" />
              <h4>实时情报 / INTELLIGENCE</h4>
              <ArrowUpRight size={14} className="text-muted ms-auto" />
            </div>
            <div className="p-card-body">
              <div className="intelligence-list">
                {(dashboardData?.intelligence || []).length > 0 ? (
                  dashboardData.intelligence.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="intelligence-row"
                      onClick={() => window.open(item.url, '_blank')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="intell-platform">
                        {item.platform === 'bilibili' && <div className="bili-dot" />}
                        <span>{item.platform.toUpperCase()}</span>
                      </div>
                      <div className="intell-content">
                        <span className="intell-title">{item.title}</span>
                        <div className="intell-meta">
                          <span className="intell-author">@{item.author}</span>
                          <span className={`intell-status ${item.status}`}>
                            {item.status === 'online' ? '● LIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">暂无实时情报</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* GitHub 看板 - 统一色彩为青色系 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-card card-glow-cyan"
          >
            <div className="p-card-header">
              <Github size={16} className="text-cyan" />
              <h4>认知活动 / CONTRIBUTIONS</h4>
            </div>
            <div className="p-card-body">
              <div className="activity-grid-large">
                {(githubData?.grid || GITHUB_ACTIVITY).map((val: number, i: number) => (
                  <div
                    key={i}
                    className="a-dot"
                    style={{
                      background: val > 0 ? `rgba(0, 229, 255, ${0.2 + Math.min(val / 5, 1) * 0.8})` : 'rgba(255,255,255,0.05)',
                      boxShadow: val > 2 ? '0 0 10px rgba(0, 229, 255, 0.6)' : 'none'
                    }}
                  />
                ))}
              </div>
              <div className="github-stats">
                <div className="stat-item">
                  <span className="stat-label">年度活动</span>
                  <span className="stat-value">{githubData?.total || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">连续提交</span>
                  <span className="stat-value">{githubData?.streak || 0}天</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 系统看板 - Docker 容器监控 (完全体版) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="cyber-card p-card card-glow-cyan"
          >
            <div className="p-card-header">
              <Activity size={16} className="text-cyan" />
              <h4>系统核心指标 / HEALTH</h4>
              <div className="live-tag">实时</div>
            </div>
            <div className="p-card-body">
              {/* Docker 实时容器状态 - 修正逻辑：如果后端没有返回容器，显示示例容器 */}
              <div className="container-status">
                {(dashboardData?.system?.containers && dashboardData.system.containers.length > 0
                  ? dashboardData.system.containers
                  : DOCKER_CONTAINERS).map((container: any, i: number) => (
                    <div key={i} className="container-row">
                      <Circle
                        size={8}
                        fill={container.status === 'running' || container.status === 'up' ? '#00ff87' : '#ff4d4d'}
                        className="status-indicator"
                        style={{ filter: `drop-shadow(0 0 3px ${container.status === 'running' || container.status === 'up' ? '#00ff87' : '#ff4d4d'})` }}
                      />
                      <span className="container-name">{container.name}</span>
                    </div>
                  ))}
              </div>

              {/* 系统真实指标 */}
              <div className="p-metric">
                <div className="p-metric-label">
                  <Cpu size={12} /> <span>处理器负载 / CPU</span>
                  <span className="p-metric-val">{dashboardData?.system?.cpu?.load || 0}%</span>
                </div>
                <div className="p-progress-track">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardData?.system?.cpu?.load || 0}%` }}
                    className="p-progress-fill cyan-bg"
                  />
                </div>
              </div>
              <div className="p-metric">
                <div className="p-metric-label">
                  <Database size={12} /> <span>内存同步 / MEM</span>
                  <span className="p-metric-val">{dashboardData?.system?.memory?.usedPercent || 0}%</span>
                </div>
                <div className="p-progress-track">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardData?.system?.memory?.usedPercent || 0}%` }}
                    className="p-progress-fill cyan-bg"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <style>{`
        .main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          z-index: 10;
          position: relative;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 60px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--text-secondary);
        }

        .user-badge {
          font-weight: 600;
          color: var(--text-primary);
        }

        .center-divider {
          width: 1px;
          height: 20px;
          background: var(--border-glass);
        }

        .icon-glow-cyan { filter: drop-shadow(0 0 5px var(--neon-cyan)); color: var(--neon-cyan); }
        .icon-glow-purple { filter: drop-shadow(0 0 5px var(--neon-purple)); color: var(--neon-purple); }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 100px;
          margin-top: -10vh;
        }

        .search-section {
          width: 100%;
          max-width: 720px;
          position: relative;
        }

        .search-outer {
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          border-radius: 30px;
        }

        .search-inner {
          display: flex;
          align-items: center;
          background: #0d0d12;
          border-radius: 29px;
          padding: 12px 24px;
          gap: 20px;
        }

        .focused .search-outer {
          background: var(--grad-cyan);
          box-shadow: 0 0 40px rgba(0, 229, 255, 0.2);
        }

        .search-icon { color: var(--text-muted); }

        .premium-input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          font-weight: 300;
          letter-spacing: 2px;
          outline: none;
        }

        .search-shortcut {
          font-size: 10px;
          padding: 4px 8px;
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          border-radius: 6px;
        }

        .command-overlay {
          position: absolute;
          top: 100%;
          left: 30px;
          right: 30px;
          margin-top: 20px;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass);
          border-radius: 16px;
          padding: 10px;
          display: flex;
          gap: 20px;
        }

        .command-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .premium-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          width: 100%;
        }

        /* 增强外发光效果 */
        .card-glow-cyan {
          box-shadow: 
            inset 0 0 0 1px rgba(255, 255, 255, 0.03),
            0 10px 40px -10px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(0, 229, 255, 0.15);
        }

        .card-glow-cyan:hover {
          box-shadow: 
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            0 20px 60px -15px rgba(0, 0, 0, 0.7),
            0 0 50px rgba(0, 229, 255, 0.25);
        }

        .p-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .p-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .p-card-header h4 {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: var(--text-muted);
        }

        .text-cyan { color: var(--neon-cyan); }
        .text-muted { color: var(--text-muted); }
        .ms-auto { margin-left: auto; }

        /* 情报流专属样式 */
        .intelligence-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .intelligence-row {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s;
        }

        .intelligence-row:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--neon-cyan);
          transform: translateX(5px);
        }

        .intell-platform {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          color: var(--neon-cyan);
          margin-bottom: 8px;
        }

        .bili-dot {
          width: 8px;
          height: 8px;
          background: #ff6699;
          border-radius: 50%;
          box-shadow: 0 0 10px #ff6699;
        }

        .intell-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .intell-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .intell-author {
          font-size: 12px;
          color: var(--text-muted);
        }

        .intell-status {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .intell-status.online {
          background: rgba(0, 255, 135, 0.1);
          color: var(--neon-green);
        }

        .intell-status.offline {
          color: var(--text-muted);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 12px;
          font-style: italic;
        }

        /* GitHub 活动网格 */
        .activity-grid-large {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 16px;
        }

        .a-dot { 
          width: 100%; 
          aspect-ratio: 1;
          border-radius: 3px; 
          transition: all 0.2s;
        }

        .github-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--neon-cyan);
        }

        /* Docker 容器状态 */
        .container-status {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .container-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.02);
          border-radius: 6px;
        }

        .status-indicator {
          flex-shrink: 0;
        }

        .container-name {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-secondary);
        }

        .p-metric { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
        }

        .p-metric-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .p-metric-val { 
          margin-left: auto; 
          font-weight: 800; 
          color: white; 
        }

        .p-progress-track {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }

        .p-progress-fill { 
          height: 100%; 
          border-radius: 3px; 
        }

        .cyan-bg { 
          background: var(--grad-cyan); 
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); 
        }

        .live-tag {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(0, 255, 135, 0.1);
          color: var(--neon-green);
          border: 1px solid rgba(0, 255, 135, 0.2);
          border-radius: 4px;
          margin-left: auto;
        }

        @media (max-width: 1024px) {
          .premium-grid { grid-template-columns: 1fr; }
          .main-container { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

export default App;

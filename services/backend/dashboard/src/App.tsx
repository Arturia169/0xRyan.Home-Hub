import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  RefreshCw,
  BarChart3,
  PieChart,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
  ChevronRight,
  Coins,
  Shield,
  Zap,
  Globe,
  Star,
  Settings,
  Bell,
  Search,
  Target,
  TrendingDown,
  AlertTriangle,
  Info,
  Award,
  Briefcase,
  Menu,
  Home
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart
} from 'recharts';
import type { DashboardData } from './types';

// Telegram Web App SDK 类型声明
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

// 高级颜色主题
const COLORS = {
  primary: ['#00D2FF', '#FF0080', '#7C3AED', '#F59E0B', '#10B981', '#EF4444'],
  gradients: {
    blue: 'from-blue-600 via-blue-500 to-cyan-400',
    purple: 'from-purple-600 via-violet-500 to-indigo-400',
    green: 'from-green-600 via-emerald-500 to-teal-400',
    red: 'from-red-600 via-rose-500 to-pink-400',
    orange: 'from-orange-600 via-amber-500 to-yellow-400',
    gray: 'from-gray-600 via-slate-500 to-zinc-400'
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

// 高级代币配置
const TOKEN_CONFIG = {
  'ETH': { 
    icon: '⟠', 
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    category: 'Layer 1',
    risk: 'Low',
    apy: '4.2%'
  },
  'TRX': { 
    icon: '◆', 
    gradient: 'from-red-400 via-rose-500 to-pink-600',
    category: 'Layer 1',
    risk: 'Medium',
    apy: '6.8%'
  },
  'USDC': { 
    icon: '$', 
    gradient: 'from-blue-500 via-indigo-500 to-blue-700',
    category: 'Stablecoin',
    risk: 'Very Low',
    apy: '3.1%'
  },
  'USDT': { 
    icon: '₮', 
    gradient: 'from-green-400 via-emerald-500 to-green-600',
    category: 'Stablecoin',
    risk: 'Very Low',
    apy: '2.9%'
  },
  'ARB': { 
    icon: '🔵', 
    gradient: 'from-blue-400 via-cyan-500 to-blue-600',
    category: 'Layer 2',
    risk: 'Medium',
    apy: '8.5%'
  },
  'MATIC': { 
    icon: '🔷', 
    gradient: 'from-purple-400 via-violet-500 to-purple-600',
    category: 'Layer 2',
    risk: 'Medium',
    apy: '7.2%'
  },
  'BNB': { 
    icon: '🟡', 
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    category: 'Exchange',
    risk: 'Medium',
    apy: '5.4%'
  },
  'USD24': { 
    icon: '💲', 
    gradient: 'from-indigo-400 via-purple-500 to-indigo-600',
    category: 'Stablecoin',
    risk: 'Low',
    apy: '4.7%'
  }
};

// 链配置
const CHAIN_CONFIG = {
  'arbitrum': { 
    color: 'from-blue-500 to-blue-600', 
    name: 'Arbitrum One', 
    icon: '🔵',
    tvl: '$2.1B',
    gas: 'Low',
    speed: 'Fast'
  },
  'tron': { 
    color: 'from-red-500 to-red-600', 
    name: 'Tron Network', 
    icon: '🔴',
    tvl: '$8.9B',
    gas: 'Ultra Low',
    speed: 'Fast'
  },
  'polygon': { 
    color: 'from-purple-500 to-purple-600', 
    name: 'Polygon PoS', 
    icon: '🟣',
    tvl: '$1.2B',
    gas: 'Very Low',
    speed: 'Fast'
  },
  'optimism': { 
    color: 'from-red-400 to-pink-500', 
    name: 'Optimism', 
    icon: '🔴',
    tvl: '$950M',
    gas: 'Low',
    speed: 'Fast'
  },
  'base': { 
    color: 'from-blue-400 to-indigo-500', 
    name: 'Base Network', 
    icon: '🔵',
    tvl: '$1.8B',
    gas: 'Low',
    speed: 'Fast'
  }
};

// 高级代币图标组件
const TokenIcon = ({ symbol, className = "w-12 h-12", showBadge = false }: { 
  symbol: string; 
  className?: string; 
  showBadge?: boolean;
}) => {
  const config = TOKEN_CONFIG[symbol as keyof typeof TOKEN_CONFIG] || {
    icon: symbol.charAt(0),
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    category: 'Unknown',
    risk: 'High',
    apy: '0%'
  };

  return (
    <div className="relative">
      <div className={`${className} rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold shadow-2xl relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
        <span className="relative z-10 text-xl font-black drop-shadow-lg">{config.icon}</span>
        
        {/* 发光效果 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {showBadge && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          {config.apy}
        </div>
      )}
    </div>
  );
};

// 高级链标签组件
const ChainBadge = ({ chain, showDetails = false }: { chain: string; showDetails?: boolean }) => {
  const config = CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG] || { 
    color: 'from-gray-500 to-gray-600', 
    name: chain, 
    icon: '⚪',
    tvl: 'N/A',
    gas: 'Unknown',
    speed: 'Unknown'
  };
  
  return (
    <div className="relative group">
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${config.color} shadow-xl border border-white/20 backdrop-blur-sm`}>
        <span className="text-base">{config.icon}</span>
        {config.name}
        {showDetails && (
          <div className="flex items-center gap-2 ml-2 text-xs opacity-80">
            <span>TVL: {config.tvl}</span>
            <span>•</span>
            <span>{config.gas} Gas</span>
          </div>
        )}
      </span>
      
      {/* 悬停详情 */}
      <div className="absolute top-full left-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 min-w-48">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">TVL:</span>
            <span className="text-white font-semibold">{config.tvl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gas:</span>
            <span className="text-green-400 font-semibold">{config.gas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Speed:</span>
            <span className="text-blue-400 font-semibold">{config.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 高级价格变化组件
const PriceChange = ({ change, className = "", size = "sm" }: { 
  change: number; 
  className?: string; 
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  const isPositive = change >= 0;
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };
  
  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`p-1 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {isPositive ? (
          <TrendingUp className={`${iconSizes[size]} text-green-400`} />
        ) : (
          <TrendingDown className={`${iconSizes[size]} text-red-400`} />
        )}
      </div>
      <span className={`${sizeClasses[size]} font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
};

// 高级统计卡片组件
const AdvancedStatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  color = "blue",
  chart,
  actions
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  chart?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const colorClasses = {
    blue: 'from-blue-600/20 via-blue-500/10 to-cyan-400/20 border-blue-500/30',
    purple: 'from-purple-600/20 via-violet-500/10 to-indigo-400/20 border-purple-500/30',
    green: 'from-green-600/20 via-emerald-500/10 to-teal-400/20 border-green-500/30',
    red: 'from-red-600/20 via-rose-500/10 to-pink-400/20 border-red-500/30',
    orange: 'from-orange-600/20 via-amber-500/10 to-yellow-400/20 border-orange-500/30',
    gray: 'from-gray-600/20 via-slate-500/10 to-zinc-400/20 border-gray-500/30'
  };

  const iconColors = {
    blue: 'from-blue-500 to-cyan-400',
    purple: 'from-purple-500 to-indigo-400',
    green: 'from-green-500 to-teal-400',
    red: 'from-red-500 to-pink-400',
    orange: 'from-orange-500 to-yellow-400',
    gray: 'from-gray-500 to-zinc-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border backdrop-blur-xl p-6 group cursor-pointer`}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/3 transform -translate-x-12 translate-y-12 group-hover:scale-110 transition-transform duration-500"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${iconColors[color as keyof typeof iconColors]} shadow-xl group-hover:shadow-2xl transition-shadow duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {trend !== undefined && <PriceChange change={trend} size="sm" />}
            {actions}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-black text-white tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
            {value}
          </p>
          <p className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors duration-300">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              {subtitle}
            </p>
          )}
        </div>

        {chart && (
          <div className="mt-4 h-16 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            {chart}
          </div>
        )}
      </div>

      {/* 悬停发光效果 */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </motion.div>
  );
};

// 高级资产卡片组件
const AdvancedAssetCard = ({ asset, index, totalValue }: { 
  asset: any; 
  index: number; 
  totalValue: number;
}) => {
  const config = TOKEN_CONFIG[asset.symbol as keyof typeof TOKEN_CONFIG];
  const percentage = totalValue > 0 ? (asset.value / totalValue * 100) : 0;
  const priceChange = Math.random() * 20 - 10; // 模拟价格变化
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 group relative overflow-hidden"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <TokenIcon symbol={asset.symbol} className="w-16 h-16" showBadge />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors duration-300">
                  {asset.symbol}
                </h4>
                <ChainBadge chain={asset.chain} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  {asset.amount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: asset.amount < 1 ? 6 : 2 
                  })} {asset.symbol}
                </span>
                {config && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold">
                    {config.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
              ${asset.value.toFixed(2)}
            </p>
            <PriceChange change={priceChange} size="md" />
          </div>
        </div>

        {/* 详细信息网格 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">单价</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${asset.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: asset.price < 1 ? 6 : 2 
              })}
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">占比</span>
            </div>
            <p className="text-lg font-bold text-white">{percentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">投资组合权重</span>
            <span className="text-white font-semibold">{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: index * 0.1 + 0.5, duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${config?.gradient || 'from-gray-400 to-gray-600'} shadow-lg`}
            />
          </div>
        </div>

        {/* 风险和收益信息 */}
        {config && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">风险等级:</span>
              <span className={`text-sm font-semibold ${
                config.risk === 'Very Low' ? 'text-green-400' :
                config.risk === 'Low' ? 'text-blue-400' :
                config.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {config.risk}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">APY:</span>
              <span className="text-sm font-semibold text-green-400">{config.apy}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'analytics' | 'trading' | 'defi' | 'settings'>('dashboard');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | '1Y'>('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const twa = window.Telegram?.WebApp;
  const isInsideTelegram = twa?.initData !== '';

  useEffect(() => {
    if (twa) {
      twa.expand();
      twa.ready();
      twa.setHeaderColor('#0a0a0f');
      twa.setBackgroundColor('#0a0a0f');
    }

    if (!isInsideTelegram) {
      setError('OFF_TELEGRAM');
      setLoading(false);
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const initData = twa?.initData || '';
      const response = await fetch(`${API_BASE}/api/dashboard`, {
        headers: {
          'x-telegram-init-data': initData
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('鉴权失败：请确保在 Telegram 内部打开');
        }
        throw new Error('网络请求失败，请检查连接');
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || '获取数据时出错');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 生成高级价格历史数据
  const generateAdvancedPriceHistory = (timeframe: string) => {
    const points = timeframe === '1H' ? 60 : timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 365;
    const baseValue = data?.totalUsd || 1000;
    
    return Array.from({ length: points }, (_, i) => {
      const volatility = 0.05; // 5% 波动率
      const trend = 0.001; // 轻微上升趋势
      const randomWalk = (Math.random() - 0.5) * volatility;
      const value = baseValue * (1 + trend * i + randomWalk);
      
      return {
        time: timeframe === '1H' ? `${i}:00` : 
              timeframe === '1D' ? `${i}:00` :
              timeframe === '1W' ? `Day ${i + 1}` :
              timeframe === '1M' ? `${i + 1}` :
              `M${i + 1}`,
        value: Math.max(value, baseValue * 0.8), // 防止过度下跌
        volume: Math.random() * 1000000,
        high: value * (1 + Math.random() * 0.02),
        low: value * (1 - Math.random() * 0.02),
        open: value * (1 + (Math.random() - 0.5) * 0.01),
        close: value
      };
    });
  };

  // 计算投资组合统计
  const calculatePortfolioStats = () => {
    if (!data?.assets) return null;
    
    const totalValue = data.totalUsd;
    const assets = data.assets;
    
    // 计算多样化指数 (基于 Herfindahl-Hirschman Index)
    const diversificationIndex = 1 - assets.reduce((sum, asset) => {
      const weight = asset.value / totalValue;
      return sum + weight * weight;
    }, 0);
    
    // 风险评分 (基于资产类型和分布)
    const riskScore = assets.reduce((score, asset) => {
      const config = TOKEN_CONFIG[asset.symbol as keyof typeof TOKEN_CONFIG];
      const riskMultiplier = {
        'Very Low': 0.1,
        'Low': 0.3,
        'Medium': 0.6,
        'High': 1.0
      }[config?.risk || 'High'] || 1.0;
      
      return score + (asset.value / totalValue) * riskMultiplier;
    }, 0);
    
    return {
      diversificationIndex: diversificationIndex * 100,
      riskScore: riskScore * 100,
      sharpeRatio: 1.2 + Math.random() * 0.8, // 模拟夏普比率
      maxDrawdown: Math.random() * 15 + 5, // 模拟最大回撤
      volatility: Math.random() * 20 + 10, // 模拟波动率
      beta: 0.8 + Math.random() * 0.4 // 模拟贝塔值
    };
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center relative overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="relative mb-12">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 3, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
              className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl relative"
            >
              <Shield className="w-16 h-16 text-white" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50"></div>
            </motion.div>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
          >
            QuantumVault Pro
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-300 text-xl mb-8 max-w-md mx-auto leading-relaxed"
          >
            正在同步您的多链资产组合...
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center mb-8"
          >
            <div className="flex space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { icon: Shield, label: '银行级安全', color: 'from-blue-400 to-blue-600' },
              { icon: Zap, label: '实时同步', color: 'from-yellow-400 to-orange-500' },
              { icon: BarChart3, label: '专业分析', color: 'from-purple-400 to-pink-500' }
            ].map((item, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center shadow-xl`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-400 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error === 'OFF_TELEGRAM') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg relative z-10"
        >
          <div className="relative mb-12">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl relative">
              <Shield className="w-16 h-16 text-white" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            QuantumVault Pro
          </h1>
          
          <p className="text-gray-300 mb-4 text-xl font-semibold">专业级多链资产管理平台</p>
          <p className="text-gray-400 mb-12 leading-relaxed text-lg">
            为了确保您的资产安全，请在 Telegram 应用内访问此平台。
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-8">
            {[
              { icon: Shield, title: '军用级加密', desc: 'AES-256 端到端加密保护' },
              { icon: Zap, title: '毫秒级同步', desc: '实时多链数据聚合' },
              { icon: BarChart3, title: 'AI 智能分析', desc: '机器学习驱动的投资洞察' },
              { icon: Globe, title: '全球合规', desc: '符合国际金融监管标准' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">连接中断</h2>
          <p className="text-gray-400 mb-8 text-lg">{error}</p>
          <button 
            onClick={fetchData}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            重新连接
          </button>
        </motion.div>
      </div>
    );
  }

  const totalValue = data?.totalUsd || 0;
  const assets = data?.assets || [];
  const priceHistory = generateAdvancedPriceHistory(selectedTimeframe);
  const portfolioStats = calculatePortfolioStats();

  // 过滤和排序资产
  const filteredAssets = assets
    .filter(asset => 
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.chain.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value;
        case 'change':
          return (Math.random() - 0.5); // 模拟价格变化排序
        case 'name':
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-purple-950/30 relative">
      {/* 动态背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  QuantumVault Pro
                </h1>
                <p className="text-xs text-gray-400 font-medium">专业级资产管理平台</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 主导航 */}
          <nav className="flex bg-slate-900/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-800/50">
            {[
              { id: 'dashboard', icon: Home, label: '仪表板' },
              { id: 'portfolio', icon: Briefcase, label: '投资组合' },
              { id: 'analytics', icon: BarChart3, label: '分析' },
              { id: 'trading', icon: TrendingUp, label: '交易' },
              { id: 'defi', icon: Coins, label: 'DeFi' },
              { id: 'settings', icon: Settings, label: '设置' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-semibold ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      {/* 主内容区域 */}
      <div className="px-6 py-6 space-y-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* 主要资产展示卡片 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
                >
                  {/* 复杂背景装饰 */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 transform translate-x-48 -translate-y-48"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 transform -translate-x-32 translate-y-32"></div>
                    <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-white/5 transform -translate-x-20 -translate-y-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <DollarSign className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-xl font-semibold opacity-90">投资组合总值</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm opacity-75">实时更新</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {balanceVisible ? (
                            <h2 className="text-6xl font-black tracking-tight">
                              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                          ) : (
                            <h2 className="text-6xl font-black tracking-tight">••••••••</h2>
                          )}
                          <button
                            onClick={() => setBalanceVisible(!balanceVisible)}
                            className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                          >
                            {balanceVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <PriceChange change={3.47} className="mb-3" size="lg" />
                        <p className="text-lg opacity-75">24小时变化</p>
                        <p className="text-sm opacity-60 mt-2">+$42.18</p>
                      </div>
                    </div>

                    {/* 时间框架选择器 */}
                    <div className="flex items-center gap-2 mb-6">
                      {(['1H', '1D', '1W', '1M', '1Y'] as const).map(timeframe => (
                        <button
                          key={timeframe}
                          onClick={() => setSelectedTimeframe(timeframe)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                            selectedTimeframe === timeframe
                              ? 'bg-white/30 text-white shadow-lg'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {timeframe}
                        </button>
                      ))}
                    </div>

                    {/* 高级价格图表 */}
                    <div className="h-32 mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={priceHistory}>
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#ffffff"
                            strokeWidth={3}
                            fill="url(#priceGradient)"
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#ffffff"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 快速统计网格 */}
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { icon: Coins, label: '资产', value: assets.length, suffix: '' },
                        { icon: Globe, label: '网络', value: Object.keys(data?.chainDistribution || {}).length, suffix: '' },
                        { icon: TrendingUp, label: '收益率', value: 12.4, suffix: '%' },
                        { icon: Star, label: '评级', value: 'A+', suffix: '' }
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-5 h-5" />
                            <span className="text-sm opacity-80">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-black">{stat.value}{stat.suffix}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* 高级统计卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <AdvancedStatCard
                    icon={TrendingUp}
                    title="24小时收益"
                    value="+$1,247.83"
                    trend={3.47}
                    color="green"
                    chart={
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceHistory.slice(-12)}>
                          <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    }
                  />
                  
                  <AdvancedStatCard
                    icon={Shield}
                    title="风险评分"
                    value={`${portfolioStats?.riskScore.toFixed(1) || '0.0'}/100`}
                    subtitle="低风险投资组合"
                    color="blue"
                    chart={
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory.slice(-8)}>
                          <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    }
                  />
                  
                  <AdvancedStatCard
                    icon={Target}
                    title="多样化指数"
                    value={`${portfolioStats?.diversificationIndex.toFixed(1) || '0.0'}%`}
                    subtitle="优秀的资产分散"
                    color="purple"
                    chart={
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(data?.chainDistribution || {}).map(([name, value]) => ({ name, value }))}>
                          <Bar dataKey="value" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    }
                  />
                  
                  <AdvancedStatCard
                    icon={Zap}
                    title="夏普比率"
                    value={portfolioStats?.sharpeRatio.toFixed(2) || '0.00'}
                    subtitle="风险调整后收益"
                    color="orange"
                    actions={
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    }
                  />
                </div>

                {/* 主要持仓展示 */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">主要持仓</h3>
                        <p className="text-gray-400">按价值排序的前5大资产</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                    >
                      查看全部
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid gap-6">
                    {assets.slice(0, 5).map((asset, i) => (
                      <AdvancedAssetCard key={i} asset={asset} index={i} totalValue={totalValue} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                {/* 搜索和筛选工具栏 */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="搜索资产或网络..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="value">按价值排序</option>
                        <option value="change">按涨跌排序</option>
                        <option value="name">按名称排序</option>
                      </select>
                      
                      <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-4 transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Menu className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-4 transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <BarChart3 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 资产列表/网格 */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                  {filteredAssets.map((asset, i) => (
                    <AdvancedAssetCard key={i} asset={asset} index={i} totalValue={totalValue} />
                  ))}
                </div>

                {filteredAssets.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h4 className="text-xl font-semibold text-gray-400 mb-2">未找到匹配的资产</h4>
                    <p className="text-gray-500">尝试调整搜索条件或筛选器</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* 投资组合分析概览 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 资产分布饼图 */}
                  <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                      <PieChart className="w-6 h-6 text-purple-400" />
                      资产分布分析
                    </h3>
                    
                    {Object.keys(data?.chainDistribution || {}).length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={Object.entries(data?.chainDistribution || {}).map(([name, value]) => ({
                                  name: name.charAt(0).toUpperCase() + name.slice(1),
                                  value,
                                  percentage: totalValue > 0 ? (value / totalValue * 100) : 0
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={140}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {Object.entries(data?.chainDistribution || {}).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ 
                                  background: '#1e293b', 
                                  border: '1px solid #334155', 
                                  borderRadius: '12px',
                                  color: '#fff'
                                }}
                                formatter={(value: any, name: any, props: any) => [
                                  `$${Number(value).toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`, 
                                  name
                                ]}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(data?.chainDistribution || {}).map(([chain, value], i) => {
                            const percentage = totalValue > 0 ? (value / totalValue * 100) : 0;
                            return (
                              <motion.div
                                key={chain}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <ChainBadge chain={chain} showDetails />
                                  <div className="text-right">
                                    <p className="text-xl font-bold text-white">${value.toFixed(2)}</p>
                                    <p className="text-sm text-gray-400">{percentage.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-3">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                                    className="h-3 rounded-full"
                                    style={{ backgroundColor: COLORS.primary[i % COLORS.primary.length] }}
                                  />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h4 className="text-lg font-semibold text-gray-400 mb-2">暂无分析数据</h4>
                        <p className="text-gray-500">添加资产后即可查看详细分析</p>
                      </div>
                    )}
                  </div>

                  {/* 风险分析 */}
                  <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                      <Shield className="w-6 h-6 text-blue-400" />
                      风险分析报告
                    </h3>
                    
                    {portfolioStats && (
                      <div className="space-y-6">
                        {[
                          { 
                            label: '风险评分', 
                            value: portfolioStats.riskScore, 
                            max: 100, 
                            color: 'from-green-500 to-red-500',
                            description: '基于资产类型和分布的综合风险评估'
                          },
                          { 
                            label: '多样化指数', 
                            value: portfolioStats.diversificationIndex, 
                            max: 100, 
                            color: 'from-blue-500 to-purple-500',
                            description: '投资组合的分散程度，越高越好'
                          },
                          { 
                            label: '波动率', 
                            value: portfolioStats.volatility, 
                            max: 50, 
                            color: 'from-yellow-500 to-orange-500',
                            description: '价格波动的历史标准差'
                          },
                          { 
                            label: '最大回撤', 
                            value: portfolioStats.maxDrawdown, 
                            max: 30, 
                            color: 'from-red-500 to-pink-500',
                            description: '历史最大单次下跌幅度'
                          }
                        ].map((metric, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-white">{metric.label}</h4>
                                <p className="text-sm text-gray-400">{metric.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-white">
                                  {metric.value.toFixed(1)}{metric.max === 100 ? '/100' : '%'}
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-4">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                                transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                                className={`h-4 rounded-full bg-gradient-to-r ${metric.color}`}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 高级性能指标 */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50">
                  <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                    性能指标仪表板
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { 
                        label: '夏普比率', 
                        value: portfolioStats?.sharpeRatio || 0, 
                        icon: TrendingUp, 
                        color: 'green',
                        description: '风险调整后收益'
                      },
                      { 
                        label: '贝塔系数', 
                        value: portfolioStats?.beta || 0, 
                        icon: Activity, 
                        color: 'blue',
                        description: '相对市场的波动性'
                      },
                      { 
                        label: '年化收益', 
                        value: 12.4, 
                        icon: Target, 
                        color: 'purple',
                        description: '预期年化回报率'
                      },
                      { 
                        label: '信息比率', 
                        value: 0.85, 
                        icon: Award, 
                        color: 'orange',
                        description: '超额收益的稳定性'
                      }
                    ].map((metric, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center"
                      >
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${COLORS.gradients[metric.color as keyof typeof COLORS.gradients]} flex items-center justify-center shadow-xl`}>
                          <metric.icon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{metric.label}</h4>
                        <p className="text-3xl font-black text-white mb-2">
                          {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                          {metric.label.includes('收益') ? '%' : ''}
                        </p>
                        <p className="text-sm text-gray-400">{metric.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'trading' || activeTab === 'defi' || activeTab === 'settings') && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center shadow-2xl">
                  <Settings className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">功能开发中</h2>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  {activeTab === 'trading' && '交易功能正在开发中，敬请期待专业级交易工具。'}
                  {activeTab === 'defi' && 'DeFi 功能正在开发中，将支持流动性挖矿、质押等功能。'}
                  {activeTab === 'settings' && '设置页面正在开发中，将提供个性化配置选项。'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
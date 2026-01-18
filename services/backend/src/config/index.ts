/**
 * 配置管理模块
 * 负责加载和验证环境变量配置
 */

import 'dotenv/config';

/**
 * 支持的区块链网络
 */
export type ChainType = 'arbitrum' | 'tron' | 'base' | 'polygon' | 'optimism';

/**
 * 代币配置接口
 */
export interface TokenConfig {
    symbol: string;      // 代币符号
    name: string;        // 代币名称
    address: string;     // 合约地址（原生代币为空）
    decimals: number;    // 精度
    coingeckoId: string; // CoinGecko API ID
}

/**
 * 链配置接口
 */
export interface ChainConfig {
    name: string;           // 链名称
    chainId: number;        // 链 ID
    rpcUrl: string;         // RPC 地址
    explorer: string;       // 区块浏览器 URL
    explorerApi?: string;   // 区块浏览器 API
    nativeToken: TokenConfig; // 原生代币
    tokens: TokenConfig[];  // 支持的代币列表
}

/**
 * Arbitrum One 链配置
 */
const arbitrumConfig: ChainConfig = {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    explorerApi: 'https://api.arbiscan.io/api',
    nativeToken: {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '',
        decimals: 18,
        coingeckoId: 'ethereum',
    },
    tokens: [
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            decimals: 6,
            coingeckoId: 'usd-coin',
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6,
            coingeckoId: 'tether',
        },
        {
            symbol: 'ARB',
            name: 'Arbitrum',
            address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            decimals: 18,
            coingeckoId: 'arbitrum',
        },
        {
            symbol: 'USD24',
            name: 'Fiat24 USD',
            address: '0xbe00f3db78688d9704bcb4e0a827aea3a9cc0d62',
            decimals: 2,
            coingeckoId: 'fiat24-usd',
        },
    ],
};

/**
 * Tron 链配置
 */
const tronConfig: ChainConfig = {
    name: 'Tron',
    chainId: 728126428,
    rpcUrl: 'https://api.trongrid.io',
    explorer: 'https://tronscan.org',
    nativeToken: {
        symbol: 'TRX',
        name: 'Tron',
        address: '',
        decimals: 6,
        coingeckoId: 'tron',
    },
    tokens: [
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            decimals: 6,
            coingeckoId: 'tether',
        },
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
            decimals: 6,
            coingeckoId: 'usd-coin',
        },
    ],
};

/**
 * Base 链配置
 */
const baseConfig: ChainConfig = {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    explorerApi: 'https://api.basescan.org/api',
    nativeToken: {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '',
        decimals: 18,
        coingeckoId: 'ethereum',
    },
    tokens: [
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
            coingeckoId: 'usd-coin',
        },
        {
            symbol: 'USDbC',
            name: 'Bridged USD Coin',
            address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
            decimals: 6,
            coingeckoId: 'bridged-usd-coin-base',
        },
    ],
};

/**
 * Polygon 链配置
 */
const polygonConfig: ChainConfig = {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    explorerApi: 'https://api.polygonscan.com/api',
    nativeToken: {
        symbol: 'MATIC',
        name: 'Polygon',
        address: '',
        decimals: 18,
        coingeckoId: 'matic-network',
    },
    tokens: [
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            decimals: 6,
            coingeckoId: 'usd-coin',
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            decimals: 6,
            coingeckoId: 'tether',
        },
    ],
};

/**
 * Optimism 链配置
 */
const optimismConfig: ChainConfig = {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    explorerApi: 'https://api-optimistic.etherscan.io/api',
    nativeToken: {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '',
        decimals: 18,
        coingeckoId: 'ethereum',
    },
    tokens: [
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            decimals: 6,
            coingeckoId: 'usd-coin',
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            decimals: 6,
            coingeckoId: 'tether',
        },
    ],
};

/**
 * 所有链配置的映射
 */
export const chainConfigs: Record<ChainType, ChainConfig> = {
    arbitrum: arbitrumConfig,
    tron: tronConfig,
    base: baseConfig,
    polygon: polygonConfig,
    optimism: optimismConfig,
};

/**
 * 应用配置
 */
export const config = {
    // Telegram 配置
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        allowedUserIds: process.env.ALLOWED_USER_IDS
            ? process.env.ALLOWED_USER_IDS.split(',').map((id) => parseInt(id.trim(), 10))
            : [],
        webappUrl: process.env.WEBAPP_URL || '',
    },

    // 监控配置
    monitor: {
        interval: parseInt(process.env.MONITOR_INTERVAL || '30', 10) * 1000, // 转换为毫秒
        priceUpdateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL || '60', 10) * 1000,
    },

    // Tron API Key
    tronApiKey: process.env.TRON_API_KEY || '',

    // Etherscan API Key（适用于 Etherscan 系列：Etherscan, Arbiscan 等）
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',

    // 日志级别
    logLevel: process.env.LOG_LEVEL || 'info',

    // Cyber Home 配置
    homeDashboardApiKey: process.env.HOME_DASHBOARD_API_KEY || '',

    // 链配置
    chains: chainConfigs,
};

/**
 * 验证必要的配置是否存在
 */
export function validateConfig(): void {
    const errors: string[] = [];

    if (!config.telegram.botToken) {
        errors.push('缺少 TELEGRAM_BOT_TOKEN 环境变量');
    }

    if (!config.tronApiKey) {
        errors.push('缺少 TRON_API_KEY 环境变量（Tron 链功能将受限）');
        // 这不是致命错误，只是警告
        console.warn('⚠️ 警告: 缺少 TRON_API_KEY，Tron 链监控功能可能受限');
    }

    if (errors.length > 0) {
        throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
}

export default config;

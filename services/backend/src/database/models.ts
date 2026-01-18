/**
 * 数据模型类型定义
 */

import type { ChainType } from '../config/index.js';

/**
 * 用户模型
 */
export interface User {
    id: number;
    telegram_id: number;
    username?: string;
    first_name?: string;
    created_at: string;
    updated_at: string;
}

/**
 * 钱包模型
 */
export interface Wallet {
    id: number;
    user_id: number;
    chain: ChainType;
    address: string;
    label?: string;
    created_at: string;
}

/**
 * 钱包余额信息（运行时使用）
 */
export interface WalletBalance {
    wallet: Wallet;
    balances: TokenBalance[];
    totalValueUsd: number;
}

/**
 * 代币余额
 */
export interface TokenBalance {
    symbol: string;
    balance: string;        // 原始余额（字符串以保持精度）
    balanceFormatted: string; // 格式化后的余额
    priceUsd?: number;      // 代币价格
    valueUsd?: number;      // 价值（USD）
}

/**
 * 告警配置
 */
export interface Alert {
    id: number;
    wallet_id: number;
    token_symbol: string;
    threshold: number;
    alert_type: 'below' | 'above'; // 低于或高于阈值时触发
    enabled: boolean;
    last_triggered_at?: string;
    created_at: string;
}

/**
 * 余额快照
 */
export interface BalanceSnapshot {
    id: number;
    wallet_id: number;
    token_symbol: string;
    balance: string;
    balance_usd?: number;
    recorded_at: string;
}

/**
 * 交易通知信息
 */
export interface TransactionNotification {
    chain: ChainType;
    walletAddress: string;
    walletLabel?: string;
    txHash: string;
    type: 'in' | 'out';       // 转入或转出
    tokenSymbol: string;
    amount: string;
    amountFormatted: string;
    valueUsd?: number;
    from: string;
    to: string;
    timestamp: number;
}

/**
 * 创建钱包的参数
 */
export interface CreateWalletParams {
    userId: number;
    chain: ChainType;
    address: string;
    label?: string;
}

/**
 * 创建告警的参数
 */
export interface CreateAlertParams {
    walletId: number;
    tokenSymbol: string;
    threshold: number;
    alertType?: 'below' | 'above';
}

/**
 * Bilibili 主播
 */
export interface BilibiliStreamer {
    id: number;
    user_id: number;
    room_id: string;
    uid?: string;
    name?: string;
    is_live: number;
    last_title?: string;
    last_cover?: string;
    created_at: string;
}

/**
 * YouTube 频道
 */
export interface YoutubeChannel {
    id: number;
    user_id: number;
    channel_id: string;
    name?: string;
    last_video_id?: string;
    last_video_title?: string;
    created_at: string;
}

/**
 * Twitter/X 用户
 */
export interface TwitterUser {
    id: number;
    user_id: number;
    username: string; // 这里的 username 是 handle (e.g. @elonmusk)
    name?: string;
    last_tweet_id?: string;
    created_at: string;
}

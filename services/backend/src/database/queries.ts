/**
 * 数据库查询函数
 * 封装常用的 CRUD 操作
 */

import { getDatabase } from './index.js';
import type {
  User,
  Wallet,
  Alert,
  BalanceSnapshot,
  CreateWalletParams,
  CreateAlertParams,
  BilibiliStreamer,
} from './models.js';
import type { ChainType } from '../config/index.js';

// ==================== 用户相关操作 ====================

/**
 * 获取或创建用户
 */
export function getOrCreateUser(
  telegramId: number,
  username?: string,
  firstName?: string
): User {
  const db = getDatabase();

  // 尝试获取现有用户
  let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as User | undefined;

  if (user) {
    // 更新用户信息
    db.prepare(`
      UPDATE users SET username = ?, first_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = ?
    `).run(username || null, firstName || null, telegramId);

    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as User;
  } else {
    // 创建新用户
    const result = db.prepare(`
      INSERT INTO users (telegram_id, username, first_name)
      VALUES (?, ?, ?)
    `).run(telegramId, username || null, firstName || null);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  }

  return user;
}

/**
 * 根据 Telegram ID 获取用户
 */
export function getUserByTelegramId(telegramId: number): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as User | undefined;
}

// ==================== 钱包相关操作 ====================

/**
 * 添加监控钱包
 */
export function addWallet(params: CreateWalletParams): Wallet {
  const db = getDatabase();

  try {
    const result = db.prepare(`
      INSERT INTO wallets (user_id, chain, address, label)
      VALUES (?, ?, ?, ?)
    `).run(params.userId, params.chain, params.address, params.label || null);

    return db.prepare('SELECT * FROM wallets WHERE id = ?').get(result.lastInsertRowid) as Wallet;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('该钱包地址已在监控列表中');
    }
    throw error;
  }
}

/**
 * 移除监控钱包
 */
export function removeWallet(userId: number, address: string, chain: ChainType): boolean {
  const db = getDatabase();

  // 根据链类型进行规范化匹配
  const searchAddress = chain === 'arbitrum' ? address.toLowerCase() : address;

  const result = db.prepare(`
    DELETE FROM wallets WHERE user_id = ? AND address = ? AND chain = ?
  `).run(userId, searchAddress, chain);

  return result.changes > 0;
}

/**
 * 获取用户的所有钱包
 */
export function getWalletsByUser(userId: number): Wallet[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Wallet[];
}

/**
 * 根据地址获取钱包
 */
export function getWalletByAddress(userId: number, address: string, chain?: ChainType): Wallet | undefined {
  const db = getDatabase();

  if (chain) {
    const searchAddress = chain === 'arbitrum' ? address.toLowerCase() : address;
    return db.prepare(`
            SELECT * FROM wallets WHERE user_id = ? AND address = ? AND chain = ?
        `).get(userId, searchAddress, chain) as Wallet | undefined;
  }

  // 如果未指定链，由于 Tron 大小写敏感，
  // 我们先尝试精确匹配，如果找不到且看起来像以太坊地址，再尝试不区分大小写匹配（针对 Arbitrum）

  // 1. 精确匹配
  let wallet = db.prepare(`
        SELECT * FROM wallets WHERE user_id = ? AND address = ?
    `).get(userId, address) as Wallet | undefined;

  if (wallet) return wallet;

  // 2. 如果地址以 0x 开头，尝试不区分大小写匹配（Arbitrum）
  if (address.startsWith('0x')) {
    return db.prepare(`
            SELECT * FROM wallets WHERE user_id = ? AND LOWER(address) = LOWER(?) AND chain = 'arbitrum'
        `).get(userId, address) as Wallet | undefined;
  }

  return undefined;
}

/**
 * 获取所有用户
 */
export function getAllUsers(): User[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users').all() as User[];
}

/**
 * 获取所有需要监控的钱包
 */
export function getAllWallets(): (Wallet & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT w.*, u.telegram_id
    FROM wallets w
    JOIN users u ON w.user_id = u.id
  `).all() as (Wallet & { telegram_id: number })[];
}

/**
 * 获取指定链的所有钱包
 */
export function getWalletsByChain(chain: ChainType): (Wallet & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT w.*, u.telegram_id
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE w.chain = ?
  `).all(chain) as (Wallet & { telegram_id: number })[];
}

/**
 * 更新钱包标签
 */
export function updateWalletLabel(walletId: number, label: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE wallets SET label = ? WHERE id = ?').run(label, walletId);
  return result.changes > 0;
}

// ==================== 告警相关操作 ====================

/**
 * 创建告警
 */
export function createAlert(params: CreateAlertParams): Alert {
  const db = getDatabase();

  const result = db.prepare(`
    INSERT INTO alerts (wallet_id, token_symbol, threshold, alert_type)
    VALUES (?, ?, ?, ?)
  `).run(
    params.walletId,
    params.tokenSymbol.toUpperCase(),
    params.threshold,
    params.alertType || 'below'
  );

  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid) as Alert;
}

/**
 * 删除告警
 */
export function deleteAlert(alertId: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM alerts WHERE id = ?').run(alertId);
  return result.changes > 0;
}

/**
 * 获取钱包的所有告警
 */
export function getAlertsByWallet(walletId: number): Alert[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM alerts WHERE wallet_id = ? AND enabled = 1').all(walletId) as Alert[];
}

/**
 * 获取所有启用的告警
 */
export function getAllEnabledAlerts(): (Alert & { chain: ChainType; address: string; telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT a.*, w.chain, w.address, u.telegram_id
    FROM alerts a
    JOIN wallets w ON a.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    WHERE a.enabled = 1
  `).all() as (Alert & { chain: ChainType; address: string; telegram_id: number })[];
}

/**
 * 更新告警触发时间
 */
export function updateAlertTriggeredTime(alertId: number): void {
  const db = getDatabase();
  db.prepare('UPDATE alerts SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?').run(alertId);
}

/**
 * 切换告警启用状态
 */
export function toggleAlert(alertId: number, enabled: boolean): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE alerts SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, alertId);
  return result.changes > 0;
}

// ==================== 余额快照相关操作 ====================

/**
 * 保存余额快照
 */
export function saveBalanceSnapshot(
  walletId: number,
  tokenSymbol: string,
  balance: string,
  balanceUsd?: number
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO balance_snapshots (wallet_id, token_symbol, balance, balance_usd)
    VALUES (?, ?, ?, ?)
  `).run(walletId, tokenSymbol.toUpperCase(), balance, balanceUsd || null);
}

/**
 * 获取最新的余额快照
 */
export function getLatestSnapshot(
  walletId: number,
  tokenSymbol: string
): BalanceSnapshot | undefined {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM balance_snapshots
    WHERE wallet_id = ? AND token_symbol = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `).get(walletId, tokenSymbol.toUpperCase()) as BalanceSnapshot | undefined;
}

/**
 * 清理旧的余额快照（保留最近24小时）
 */
export function cleanOldSnapshots(): number {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM balance_snapshots
    WHERE recorded_at < datetime('now', '-24 hours')
  `).run();
  return result.changes;
}

// ==================== 统计相关操作 ====================

/**
 * 获取用户统计信息
 */
export function getUserStats(userId: number): {
  walletCount: number;
  alertCount: number;
  chains: string[];
} {
  const db = getDatabase();

  const walletCount = (db.prepare(`
    SELECT COUNT(*) as count FROM wallets WHERE user_id = ?
  `).get(userId) as { count: number }).count;

  const alertCount = (db.prepare(`
    SELECT COUNT(*) as count FROM alerts a
    JOIN wallets w ON a.wallet_id = w.id
    WHERE w.user_id = ? AND a.enabled = 1
  `).get(userId) as { count: number }).count;

  const chains = (db.prepare(`
    SELECT DISTINCT chain FROM wallets WHERE user_id = ?
  `).all(userId) as { chain: string }[]).map(r => r.chain);

  return { walletCount, alertCount, chains };
}

// ==================== 自定义代币操作 ====================

export interface CustomToken {
  id: number;
  chain: string;
  symbol: string;
  name?: string;
  address: string;
  decimals: number;
  coingecko_id?: string;
  created_at: string;
}

/**
 * 添加自定义代币
 */
export function addCustomToken(params: Omit<CustomToken, 'id' | 'created_at'>): CustomToken {
  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO custom_tokens (chain, symbol, name, address, decimals, coingecko_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    params.chain,
    params.symbol.toUpperCase(),
    params.name || null,
    params.address,
    params.decimals,
    params.coingecko_id || null
  );

  return db.prepare('SELECT * FROM custom_tokens WHERE id = ?').get(result.lastInsertRowid) as CustomToken;
}

/**
 * 获取所有自定义代币
 */
export function getCustomTokens(): CustomToken[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM custom_tokens').all() as CustomToken[];
}

/**
 * 根据链获取自定义代币
 */
export function getCustomTokensByChain(chain: string): CustomToken[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM custom_tokens WHERE chain = ?').all(chain) as CustomToken[];
}

/**
 * 移除自定义代币
 */
export function removeCustomToken(chain: string, symbol: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM custom_tokens WHERE chain = ? AND symbol = ? COLLATE NOCASE').run(chain, symbol);
  return result.changes > 0;
}

// ==================== Bilibili 主播操作 ====================

/**
 * 添加监控主播
 */
export function addBilibiliStreamer(
  telegramId: number,
  roomId: string,
  uid?: string,
  name?: string
): BilibiliStreamer {
  const db = getDatabase();

  // 先通过 telegram_id 获取真实的 user.id
  const user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramId) as { id: number } | undefined;
  if (!user) {
    throw new Error('用户不存在，请先发送 /start 初始化');
  }

  // 如果该用户已关注该房间，则先删除旧记录
  db.prepare('DELETE FROM bilibili_streamers WHERE user_id = ? AND room_id = ?').run(user.id, roomId);

  const result = db.prepare(`
        INSERT INTO bilibili_streamers (user_id, room_id, uid, name)
        VALUES (?, ?, ?, ?)
    `).run(user.id, roomId, uid || null, name || null);

  return db.prepare('SELECT * FROM bilibili_streamers WHERE id = ?').get(result.lastInsertRowid) as BilibiliStreamer;
}

/**
 * 移除监控主播
 */
export function removeBilibiliStreamer(userId: number, roomId: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM bilibili_streamers WHERE user_id = ? AND room_id = ?').run(userId, roomId);
  return result.changes > 0;
}

/**
 * 获取用户监控的所有主播
 */
export function getBilibiliStreamersByUser(userId: number): BilibiliStreamer[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM bilibili_streamers WHERE user_id = ? ORDER BY created_at DESC').all(userId) as BilibiliStreamer[];
}

/**
 * 获取所有被监控的主播（用于后台轮询）
 * 包含用户信息以便发送通知
 */
export function getAllBilibiliStreamers(): (BilibiliStreamer & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
        SELECT s.*, u.telegram_id 
        FROM bilibili_streamers s
        JOIN users u ON s.user_id = u.id
    `).all() as (BilibiliStreamer & { telegram_id: number })[];
}

/**
 * 更新主播状态
 */
export function updateBilibiliStreamerStatus(
  id: number,
  isLive: number,
  lastTitle?: string,
  lastCover?: string
): void {
  const db = getDatabase();
  db.prepare(`
        UPDATE bilibili_streamers 
        SET is_live = ?, last_title = ?, last_cover = ?
        WHERE id = ?
    `).run(isLive, lastTitle || null, lastCover || null, id);
}

// ==================== YouTube 频道操作 ====================

import type { YoutubeChannel } from './models.js';

/**
 * 添加 YouTube 订阅
 */
export function addYoutubeChannel(
  telegramId: number,
  channelId: string,
  name?: string
): YoutubeChannel {
  const db = getDatabase();

  // 先通过 telegram_id 获取真实的 user.id
  const user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramId) as { id: number } | undefined;
  if (!user) {
    throw new Error('用户不存在，请先发送 /start 初始化');
  }

  const result = db.prepare(`
        INSERT INTO youtube_channels (user_id, channel_id, name)
        VALUES (?, ?, ?)
    `).run(user.id, channelId, name || null);
  return db.prepare('SELECT * FROM youtube_channels WHERE id = ?').get(result.lastInsertRowid) as YoutubeChannel;
}

/**
 * 移除 YouTube 订阅
 */
export function removeYoutubeChannel(userId: number, channelId: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM youtube_channels WHERE user_id = ? AND channel_id = ?').run(userId, channelId);
  return result.changes > 0;
}

/**
 * 获取所有 YouTube 订阅
 */
export function getAllYoutubeChannels(): (YoutubeChannel & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
        SELECT c.*, u.telegram_id 
        FROM youtube_channels c
        JOIN users u ON c.user_id = u.id
    `).all() as (YoutubeChannel & { telegram_id: number })[];
}

/**
 * 更新 YouTube 频道状态
 */
export function updateYoutubeChannelStatus(
  id: number,
  lastVideoId: string,
  lastVideoTitle: string
): void {
  const db = getDatabase();
  db.prepare(`
        UPDATE youtube_channels 
        SET last_video_id = ?, last_video_title = ?
        WHERE id = ?
    `).run(lastVideoId, lastVideoTitle, id);
}

// ==================== Twitter 用户操作 ====================

import type { TwitterUser } from './models.js';

/**
 * 添加 Twitter 订阅
 */
export function addTwitterUser(
  telegramId: number,
  username: string,
  name?: string
): TwitterUser {
  const db = getDatabase();

  // 先通过 telegram_id 获取真实的 user.id
  const user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramId) as { id: number } | undefined;
  if (!user) {
    throw new Error('用户不存在，请先发送 /start 初始化');
  }

  const result = db.prepare(`
        INSERT INTO twitter_users (user_id, username, name)
        VALUES (?, ?, ?)
    `).run(user.id, username, name || null);
  return db.prepare('SELECT * FROM twitter_users WHERE id = ?').get(result.lastInsertRowid) as TwitterUser;
}

/**
 * 移除 Twitter 订阅
 */
export function removeTwitterUser(userId: number, username: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM twitter_users WHERE user_id = ? AND username = ?').run(userId, username);
  return result.changes > 0;
}

/**
 * 获取所有 Twitter 订阅
 */
export function getAllTwitterUsers(): (TwitterUser & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
        SELECT t.*, u.telegram_id 
        FROM twitter_users t
        JOIN users u ON t.user_id = u.id
    `).all() as (TwitterUser & { telegram_id: number })[];
}

/**
 * 更新 Twitter 用户状态
 */
export function updateTwitterUserStatus(
  id: number,
  lastTweetId: string
): void {
  const db = getDatabase();
  db.prepare(`
        UPDATE twitter_users 
        SET last_tweet_id = ?
        WHERE id = ?
    `).run(lastTweetId, id);
}

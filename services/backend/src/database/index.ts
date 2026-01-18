/**
 * 数据库模块
 * 使用 SQLite 存储钱包和告警配置
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// 获取当前文件目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据库文件路径（存放在 data 目录下）
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/bot.db');

// 数据库实例
let db: Database.Database;

/**
 * 初始化数据库
 * 创建必要的表结构
 */
export function initDatabase(): void {
  const dbLogger = logger.child('Database');

  try {
    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      dbLogger.info(`创建数据目录: ${dataDir}`);
    }

    // 创建数据库连接
    db = new Database(DB_PATH);
    dbLogger.info(`数据库已连接: ${DB_PATH}`);

    // 启用外键约束
    db.pragma('foreign_keys = ON');

    // 创建用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建钱包表
    db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        chain TEXT NOT NULL,
        address TEXT NOT NULL,
        label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, chain, address)
      )
    `);

    // 创建告警表
    db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY,
        wallet_id INTEGER NOT NULL,
        token_symbol TEXT NOT NULL,
        threshold REAL NOT NULL,
        alert_type TEXT NOT NULL DEFAULT 'below',
        enabled INTEGER DEFAULT 1,
        last_triggered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      )
    `);

    // 创建余额快照表（用于检测变化）
    db.exec(`
      CREATE TABLE IF NOT EXISTS balance_snapshots (
        id INTEGER PRIMARY KEY,
        wallet_id INTEGER NOT NULL,
        token_symbol TEXT NOT NULL,
        balance TEXT NOT NULL,
        balance_usd REAL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      )
    `);

    // 创建自定义代币表
    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_tokens (
        id INTEGER PRIMARY KEY,
        chain TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        coingecko_id TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chain, address),
        UNIQUE(chain, symbol)
      )
    `);

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_wallet ON alerts(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_wallet ON balance_snapshots(wallet_id, recorded_at);
    `);

    // 创建 Bilibili 主播表
    db.exec(`
      CREATE TABLE IF NOT EXISTS bilibili_streamers (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        room_id TEXT NOT NULL,
        uid TEXT,
        name TEXT,
        is_live INTEGER DEFAULT 0,
        last_title TEXT,
        last_cover TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, room_id)
      )
    `);

    // 创建 YouTube 频道订阅表
    db.exec(`
      CREATE TABLE IF NOT EXISTS youtube_channels (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        channel_id TEXT NOT NULL,
        name TEXT,
        last_video_id TEXT,
        last_video_title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, channel_id)
      )
    `);

    // 创建 Twitter/X 用户订阅表
    db.exec(`
      CREATE TABLE IF NOT EXISTS twitter_users (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        name TEXT,
        last_tweet_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, username)
      )
    `);

    dbLogger.info('数据库表初始化完成');
  } catch (error) {
    dbLogger.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDatabase()');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    logger.child('Database').info('数据库连接已关闭');
  }
}

export default { initDatabase, getDatabase, closeDatabase };

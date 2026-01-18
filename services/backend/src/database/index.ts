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
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 尝试添加 role 字段 (用于旧数据库迁移)
    try {
      db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
    } catch (error) {
      // 忽略错误 (字段已存在)
    }

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

    // 创建通用 RSS 订阅表
    db.exec(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        name TEXT,
        last_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, url)
      )
    `);

    // 创建 GitHub 仓库监控表
    db.exec(`
      CREATE TABLE IF NOT EXISTS github_repos (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        repo TEXT NOT NULL,
        name TEXT,
        last_release_tag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, repo)
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

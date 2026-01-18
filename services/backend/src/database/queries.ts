/**
 * 数据库查询函数
 * 封装常用的 CRUD 操作
 */

import { getDatabase } from './index.js';
import type {
  User,
  BilibiliStreamer,
  RssFeed,
  YoutubeChannel,
  TwitterUser,
  GithubRepo
} from './models.js';

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
 * 更新用户角色
 */
export function updateUserRole(telegramId: number, role: 'admin' | 'user' | 'guest') {
  const db = getDatabase();
  db.prepare('UPDATE users SET role = ? WHERE telegram_id = ?').run(role, telegramId);
}

/**
 * 根据 Telegram ID 获取用户
 */
export function getUserByTelegramId(telegramId: number): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as User | undefined;
}

/**
 * 获取所有用户
 */
export function getAllUsers(): User[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users').all() as User[];
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

// ==================== RSS 订阅操作 ====================

/**
 * 获取所有 RSS 订阅
 */
export function getAllRssFeeds(): (RssFeed & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
        SELECT r.*, u.telegram_id 
        FROM rss_feeds r
        JOIN users u ON r.user_id = u.id
    `).all() as (RssFeed & { telegram_id: number })[];
}

/**
 * 添加 RSS 订阅
 */
export function addRssFeed(userId: number, url: string, name?: string): RssFeed {
  const db = getDatabase();
  const result = db.prepare(`
        INSERT INTO rss_feeds (user_id, url, name)
        VALUES (?, ?, ?)
    `).run(userId, url, name || null);

  return db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(result.lastInsertRowid) as RssFeed;
}

/**
 * 移除 RSS 订阅
 */
export function removeRssFeed(userId: number, url: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`
        DELETE FROM rss_feeds WHERE user_id = ? AND url = ?
    `).run(userId, url);
  return result.changes > 0;
}

/**
 * 更新 RSS 最后内容
 */
export function updateRssFeedHash(id: number, hash: string) {
  const db = getDatabase();
  db.prepare(`
        UPDATE rss_feeds SET last_hash = ? WHERE id = ?
    `).run(hash, id);
}

// ==================== GitHub 仓库操作 ====================

/**
 * 获取所有 GitHub 订阅
 */
export function getAllGithubRepos(): (GithubRepo & { telegram_id: number })[] {
  const db = getDatabase();
  return db.prepare(`
        SELECT g.*, u.telegram_id 
        FROM github_repos g
        JOIN users u ON g.user_id = u.id
    `).all() as (GithubRepo & { telegram_id: number })[];
}

/**
 * 添加 GitHub 订阅
 */
export function addGithubRepo(userId: number, repo: string, name?: string): GithubRepo {
  const db = getDatabase();
  const result = db.prepare(`
        INSERT INTO github_repos (user_id, repo, name)
        VALUES (?, ?, ?)
    `).run(userId, repo, name || null);

  return db.prepare('SELECT * FROM github_repos WHERE id = ?').get(result.lastInsertRowid) as GithubRepo;
}

/**
 * 移除 GitHub 订阅
 */
export function removeGithubRepo(userId: number, repo: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`
        DELETE FROM github_repos WHERE user_id = ? AND repo = ?
    `).run(userId, repo);
  return result.changes > 0;
}

/**
 * 更新 GitHub 仓库状态
 */
export function updateGithubRepoStatus(id: number, lastReleaseTag: string) {
  const db = getDatabase();
  db.prepare(`
        UPDATE github_repos SET last_release_tag = ? WHERE id = ?
    `).run(lastReleaseTag, id);
}

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
    role: 'admin' | 'user' | 'guest'; // 默认 user
    created_at: string;
    updated_at: string;
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

export interface TwitterUser {
    id: number;
    user_id: number;
    username: string; // 这里的 username 是 handle (e.g. @elonmusk)
    name?: string;
    last_tweet_id?: string;
    created_at: string;
}

/**
 * 通用 RSS 订阅
 */
export interface RssFeed {
    id: number;
    user_id: number;
    url: string;
    name?: string;
    last_hash?: string; // 用于记录最后一条内容的 Hash (或发布时间)
    created_at: string;
}

/**
 * GitHub 仓库
 */
export interface GithubRepo {
    id: number;
    user_id: number;
    repo: string; // owner/repo
    name?: string;
    last_release_tag?: string;
    created_at: string;
}

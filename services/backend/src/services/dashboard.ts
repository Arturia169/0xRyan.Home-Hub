/**
 * 看板数据服务
 * 汇聚 B站、YouTube 及社媒订阅情报
 */

import { getAllBilibiliStreamers } from '../database/queries.js';
import { logger } from '../utils/logger.js';

const log = logger.child('DashboardService');

export interface IntelligenceItem {
    platform: 'bilibili' | 'youtube' | 'x' | 'reddit';
    type: 'live' | 'post';
    title: string;
    author: string;
    url: string;
    status: 'online' | 'offline';
    thumbnail?: string;
    timestamp: string;
}

export interface DashboardData {
    intelligence: IntelligenceItem[];
}

/**
 * 获取用户的情报中心数据
 */
export async function getUserDashboardData(telegramId: number): Promise<DashboardData> {
    log.info(`开始获取用户 ${telegramId} 的情报数据`);

    // 1. 获取 B 站直播状态 (目前已有的功能)
    const streamers = getAllBilibiliStreamers();

    const intelligence: IntelligenceItem[] = streamers.map(s => ({
        platform: 'bilibili',
        type: 'live',
        title: s.last_title || (s.is_live === 1 ? '正在直播' : '未开播'),
        author: s.name || '神秘UP主',
        url: `https://live.bilibili.com/${s.room_id}`,
        status: s.is_live === 1 ? 'online' : 'offline',
        thumbnail: s.last_cover || undefined,
        timestamp: new Date().toISOString()
    }));

    // TODO: 接入 YouTube / X / Reddit RSS 动态
    // 后续通过 rss-parser 在此处注入更多情报流

    log.info(`情报获取完成: 共有 ${intelligence.length} 条订阅`);

    return {
        intelligence
    };
}

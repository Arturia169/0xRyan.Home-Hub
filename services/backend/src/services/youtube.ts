/**
 * YouTube 频道监控服务
 * 基于 RSS 订阅检测新视频
 */

import Parser from 'rss-parser';
import { setInterval, clearInterval, setTimeout } from 'node:timers';
import { logger } from '../utils/logger.js';
import { sendMessage, sendPhoto } from './notification.js';
import {
    getAllYoutubeChannels,
    updateYoutubeChannelStatus
} from '../database/queries.js';
import type { YoutubeChannel } from '../database/models.js';

const log = logger.child('YoutubeService');
const CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次 (RSS 不需要太频繁)

// YouTube RSS 地址模板
const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

interface YoutubeFeedItem {
    id: string; // "yt:video:VIDEO_ID"
    title: string;
    link: string;
    pubDate: string;
    author: string;
    isoDate?: string;
}

export class YoutubeService {
    private parser: Parser;
    private timer: ReturnType<typeof setInterval> | null = null;
    private isRunning = false;

    constructor() {
        this.parser = new Parser();
    }

    /**
     * 启动监控服务
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        log.info('YouTube 监控服务已启动');

        // 立即执行一次
        this.checkAllChannels();

        // 设置定时器
        this.timer = setInterval(() => {
            this.checkAllChannels();
        }, CHECK_INTERVAL);
    }

    /**
     * 停止监控服务
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        log.info('YouTube 监控服务已停止');
    }

    /**
     * 检查所有频道
     */
    private async checkAllChannels() {
        try {
            const channels = getAllYoutubeChannels();
            if (channels.length === 0) return;

            // 使用 Set 去重
            const checkedChannelIds = new Set<string>();

            for (const channel of channels) {
                if (checkedChannelIds.has(channel.channel_id)) continue;
                checkedChannelIds.add(channel.channel_id);

                await this.checkChannel(channel);

                // 简单的防速率限制
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            log.error('检查 YouTube 频道出错:', error);
        }
    }

    /**
     * 检查单个频道
     */
    private async checkChannel(channel: YoutubeChannel & { telegram_id: number }) {
        try {
            const feedUrl = `${YOUTUBE_RSS_BASE}${channel.channel_id}`;
            const feed = await this.parser.parseURL(feedUrl);

            if (!feed.items || feed.items.length === 0) return;

            // 获取最新视频
            const latestVideo = feed.items[0] as YoutubeFeedItem;
            // RSS 中的 ID 通常是 "yt:video:VIDEO_ID"，我们需要提取纯 ID
            const videoId = latestVideo.id.replace('yt:video:', '');

            // 如果是新视频
            if (videoId !== channel.last_video_id) {
                // 如果不是第一次添加（即已有 last_video_id），则发送通知
                // 首次添加不通过，避免刷屏，只记录状态
                if (channel.last_video_id) {
                    await this.notifyNewVideo(channel, latestVideo, videoId);
                } else {
                    log.info(`首次初始化 YouTube 频道状态: ${channel.name || feed.title}`);
                }

                // 更新数据库状态
                updateYoutubeChannelStatus(channel.id, videoId, latestVideo.title);
            }

        } catch (error: any) {
            log.error(`检查 YouTube 频道失败 (${channel.channel_id}):`, error.message);
        }
    }

    /**
     * 发送新视频通知
     */
    private async notifyNewVideo(
        channel: YoutubeChannel & { telegram_id: number },
        video: YoutubeFeedItem,
        videoId: string
    ) {
        try {
            // 查找订阅了该频道的所有用户
            const allChannels = getAllYoutubeChannels();
            const subscribers = allChannels.filter(c => c.channel_id === channel.channel_id);

            const message = `
📺 <b>${video.author} 发布了新视频！</b>

<b>${video.title}</b>

⏰ ${new Date(video.pubDate).toLocaleString('zh-CN')}
🔗 <a href="${video.link}">点击观看</a>
`;

            // YouTube 缩略图通常是 https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
            const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            for (const sub of subscribers) {
                try {
                    await sendPhoto(sub.telegram_id, thumbnailUrl, {
                        caption: message,
                        parse_mode: 'HTML'
                    });
                } catch (error: any) {
                    // 如果发图片失败，降级为发文本
                    log.warn(`发送图片失败，尝试发送文本: ${error.message}`);
                    await sendMessage(sub.telegram_id, message, {
                        parse_mode: 'HTML'
                    });
                }
            }

            log.info(`发送 YouTube 通知: ${video.title}`);

        } catch (error) {
            log.error('发送 YouTube 通知过程出错:', error);
        }
    }
}

// 导出单例
export const youtubeService = new YoutubeService();

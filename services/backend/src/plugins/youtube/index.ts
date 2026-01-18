/**
 * YouTube 插件
 * 监控 YouTube 频道更新
 */

import { BasePlugin, USER_AGENT } from '../../core/BasePlugin.js';
import { Subscription } from '../../core/types.js';
import Parser from 'rss-parser';
import {
    addYoutubeChannel,
    getAllYoutubeChannels,
    removeYoutubeChannel,
    updateYoutubeChannelStatus
} from '../../database/queries.js';
import { setTimeout } from 'node:timers';

const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

interface YoutubeFeedItem {
    id: string; // "yt:video:VIDEO_ID"
    title: string;
    link: string;
    pubDate: string;
    author: string;
    isoDate?: string;
}

export class YoutubePlugin extends BasePlugin {
    name = 'youtube';
    label = 'YouTube 监控';
    interval = 5 * 60 * 1000; // 5分钟

    private parser: Parser;

    constructor() {
        super();

        const agent = this.getProxyAgent();
        this.parser = new Parser({
            requestOptions: {
                headers: {
                    'User-Agent': USER_AGENT
                },
                agent: agent
            }
        });
    }

    async addSubscription(userId: number, target: string, name?: string): Promise<any> {
        // target 可以是 channelId 或 handle
        // 解析 handle 的逻辑比较复杂，且带有网络请求，暂保留在 Command 层处理，
        // 这里假设传入的 target 已经是 channel_id

        // 验证是否是有效的 Channel ID 格式 (UC开头, 24位)
        if (!target.startsWith('UC') || target.length !== 24) {
            // 简单的格式校验，非强制，因为 YouTube 可能改变 ID 格式
            // 但这能拦截大部分错误输入
        }

        return addYoutubeChannel(userId, target, name);
    }

    async removeSubscription(userId: number, target: string): Promise<boolean> {
        return removeYoutubeChannel(userId, target);
    }

    async getSubscriptions(userId: number): Promise<Subscription[]> {
        const channels = getAllYoutubeChannels().filter(c => c.telegram_id === userId);
        return channels.map(c => ({
            id: c.id!,
            userId: c.telegram_id,
            targetId: c.channel_id,
            name: c.name,
            extra: {
                lastVideoId: c.last_video_id,
                lastVideoTitle: c.last_video_title
            }
        }));
    }

    /**
     * 主动获取某个频道最新的视频并通知用户
     */
    async fetchAndNotifyLatest(userId: number, channelId: string): Promise<boolean> {
        try {
            const feedUrl = `${YOUTUBE_RSS_BASE}${channelId}`;
            const feed = await this.parser.parseURL(feedUrl);

            if (!feed.items || feed.items.length === 0) return false;

            const latestVideo = feed.items[0] as YoutubeFeedItem;
            const videoId = latestVideo.id.replace('yt:video:', '');

            await this.sendNotification(userId, latestVideo, videoId);
            return true;
        } catch (error: any) {
            this.log.error(`获取频道最新动态失败 (${channelId}):`, error.message);
            return false;
        }
    }

    protected async checkUpdates(): Promise<void> {
        const channels = getAllYoutubeChannels();
        if (channels.length === 0) return;

        // 对 Channel ID 去重，避免重复请求
        const uniqueChannelIds = new Set(channels.map(c => c.channel_id));

        for (const channelId of uniqueChannelIds) {
            try {
                // 速率限制
                await new Promise(resolve => setTimeout(resolve, 2000));

                const feedUrl = `${YOUTUBE_RSS_BASE}${channelId}`;
                const feed = await this.parser.parseURL(feedUrl);

                if (!feed.items || feed.items.length === 0) continue;

                // 获取最新视频
                const latestVideo = feed.items[0] as YoutubeFeedItem;
                const videoId = latestVideo.id.replace('yt:video:', '');

                // 找到所有订阅此频道的用户
                const subscribers = channels.filter(c => c.channel_id === channelId);

                for (const sub of subscribers) {
                    if (sub.last_video_id !== videoId) {
                        // 如果有 last_video_id 才通知 (首次添加不通知)
                        if (sub.last_video_id) {
                            await this.sendNotification(sub.telegram_id, latestVideo, videoId);
                        } else {
                            this.log.info(`首次初始化 YouTube 频道: ${sub.name || feed.title}`);
                        }

                        // 更新数据库状态
                        updateYoutubeChannelStatus(sub.id!, videoId, latestVideo.title);
                    }
                }
            } catch (error: any) {
                this.log.error(`检查 YouTube 频道失败 (${channelId}):`, error.message);
            }
        }
    }

    private async sendNotification(userId: number, video: YoutubeFeedItem, videoId: string) {
        const message = `
📺 <b>${video.author} 发布了新视频！</b>

<b>${video.title}</b>

⏰ ${new Date(video.pubDate).toLocaleString('zh-CN')}
🔗 <a href="${video.link}">点击观看</a>
`;
        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        await this.notify(userId, message, thumbnailUrl, video.link);
    }
}

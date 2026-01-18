/**
 * 通用 RSS 插件
 * 订阅任意 RSS/Atom 源
 */

import { BasePlugin, USER_AGENT } from '../../core/BasePlugin.js';
import { Subscription } from '../../core/types.js';
import Parser from 'rss-parser';
import {
    addRssFeed,
    getAllRssFeeds,
    removeRssFeed,
    updateRssFeedHash
} from '../../database/queries.js';
import { createHash } from 'node:crypto';

export class GeneralRssPlugin extends BasePlugin {
    name = 'rss';
    label = 'RSS 订阅';
    interval = 10 * 60 * 1000; // 10分钟检查一次，避免对源站造成压力

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
        // 验证 RSS 有效性
        try {
            const feed = await this.parser.parseURL(target);
            const feedName = name || feed.title || '未知 RSS 源';

            // 添加到数据库
            return addRssFeed(userId, target, feedName);
        } catch (error: any) {
            throw new Error(`无效的 RSS 源: ${error.message}`);
        }
    }

    async removeSubscription(userId: number, target: string): Promise<boolean> {
        return removeRssFeed(userId, target);
    }

    async getSubscriptions(userId: number): Promise<Subscription[]> {
        const feeds = getAllRssFeeds().filter(s => s.telegram_id === userId);
        return feeds.map(s => ({
            id: s.id!,
            userId: s.telegram_id,
            targetId: s.url,
            name: s.name,
            extra: {
                lastHash: s.last_hash
            }
        }));
    }

    protected async checkUpdates(): Promise<void> {
        const feeds = getAllRssFeeds();
        if (feeds.length === 0) return;

        // 对 URL 去重，避免重复请求
        const uniqueUrls = new Set(feeds.map(f => f.url));

        for (const url of uniqueUrls) {
            try {
                // 简单的速率限制
                await new Promise(resolve => setTimeout(resolve, 1000));

                const feed = await this.parser.parseURL(url);
                if (!feed.items || feed.items.length === 0) continue;

                // 获取最新的文章
                const latestItem = feed.items[0];

                // 计算 Hash (优先使用 guid, 其次 link, 再次 title)
                const uniqueString = latestItem.guid || latestItem.link || latestItem.title || '';
                const currentHash = createHash('md5').update(uniqueString).digest('hex');

                // 找到所有订阅此 URL 的记录
                const subscribers = feeds.filter(f => f.url === url);

                for (const sub of subscribers) {
                    // 如果是旧的 Hash，或者没有 Hash (第一次运行)，跳过通知但更新 Hash
                    // 注意：为了避免第一次添加就疯狂推送，我们可以在 addSubscription 时不记录 Hash，
                    // 这样第一次 checkUpdates 会视为“更新”，从而推送最新的文章。
                    // 或者我们可以在 addSubscription 时就把最新的 Hash 写入，这样只推送*之后*的新文章。
                    // 现在的逻辑：如果 last_hash 为空 (null)，则说明是刚添加的。
                    // 策略选择：刚添加时，推送最新的一条，让用户确认订阅成功。

                    if (sub.last_hash !== currentHash) {
                        // 推送通知
                        await this.sendNotification(sub, feed, latestItem);

                        // 更新数据库
                        updateRssFeedHash(sub.id, currentHash);
                    }
                }
            } catch (error) {
                this.log.error(`检查 RSS 失败 (${url}):`, error);
            }
        }
    }

    private async sendNotification(sub: any, feed: any, item: any) {
        const title = item.title || '无标题';
        const link = item.link || sub.url;
        const feedName = sub.name || feed.title || 'RSS';
        const date = item.pubDate ? new Date(item.pubDate).toLocaleString() : '';

        const message = `
📰 <b>${feedName} 更新</b>

<b>${title}</b>
${date ? `🕒 ${date}` : ''}

<a href="${link}">👉 点击阅读原文</a>
`;
        // 不发送图片，RSS 图片解析比较复杂且不稳定
        await this.notify(sub.telegram_id, message, undefined, link);
    }
}

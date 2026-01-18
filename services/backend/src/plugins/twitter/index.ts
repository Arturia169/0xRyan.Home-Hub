/**
 * Twitter 插件
 * 监控 Twitter/X 用户推文 (通过 Nitter RSS)
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { Subscription } from '../../core/types.js';
import Parser from 'rss-parser';
import {
    addTwitterUser,
    getAllTwitterUsers,
    removeTwitterUser,
    updateTwitterUserStatus
} from '../../database/queries.js';
import { setTimeout } from 'node:timers';

// Nitter 实例列表 (轮询使用以避免单点故障)
const NITTER_INSTANCES = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.cz'
];

interface TwitterFeedItem {
    guid: string;
    title: string;
    link: string;
    pubDate: string;
    content?: string;
    description?: string;
    author?: string;
}

export class TwitterPlugin extends BasePlugin {
    name = 'twitter';
    label = 'Twitter 监控';
    interval = 10 * 60 * 1000; // 10分钟

    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
    }

    async addSubscription(userId: number, target: string, name?: string): Promise<any> {
        let username = target;
        // 确保有 @ 前缀
        if (!username.startsWith('@')) {
            username = '@' + username;
        }
        return addTwitterUser(userId, username, name || username);
    }

    async removeSubscription(userId: number, target: string): Promise<boolean> {
        let username = target;
        if (!username.startsWith('@')) {
            username = '@' + username;
        }
        return removeTwitterUser(userId, username);
    }

    async getSubscriptions(userId: number): Promise<Subscription[]> {
        const users = getAllTwitterUsers().filter(u => u.telegram_id === userId);
        return users.map(u => ({
            id: u.id!,
            userId: u.telegram_id,
            targetId: u.username, // targetId 使用 username (@user)
            name: u.name,
            extra: {
                lastTweetId: u.last_tweet_id
            }
        }));
    }

    protected async checkUpdates(): Promise<void> {
        const users = getAllTwitterUsers();
        if (users.length === 0) return;

        const uniqueUsernames = new Set(users.map(u => u.username));

        for (const username of uniqueUsernames) {
            try {
                // 速率限制
                await new Promise(resolve => setTimeout(resolve, 3000));

                const handle = username.replace('@', '');
                // 简单起见，目前主要使用 privacydev (相对稳定)
                // 实际生产中可以实现 getWorkingRssUrl 轮询多个实例
                const feedUrl = `https://nitter.privacydev.net/${handle}/rss`;

                let feed;
                try {
                    feed = await this.parser.parseURL(feedUrl);
                } catch (e: any) {
                    this.log.warn(`获取 RSS 失败 (${username}): ${e.message}`);
                    continue;
                }

                if (!feed.items || feed.items.length === 0) continue;

                const latestTweet = feed.items[0] as TwitterFeedItem;
                const tweetIdMatch = latestTweet.guid.match(/\/status\/(\d+)/);
                const tweetId = tweetIdMatch ? tweetIdMatch[1] : latestTweet.guid;

                // 找到订阅者
                const subscribers = users.filter(u => u.username === username);

                for (const sub of subscribers) {
                    if (sub.last_tweet_id !== tweetId) {
                        if (sub.last_tweet_id) {
                            await this.sendNotification(sub.telegram_id, latestTweet, sub.username);
                        } else {
                            this.log.info(`首次初始化 Twitter 用户: ${username}`);
                        }
                        updateTwitterUserStatus(sub.id!, tweetId);
                    }
                }

            } catch (error: any) {
                this.log.error(`检查 Twitter 用户出错 (${username}):`, error.message);
            }
        }
    }

    private async sendNotification(userId: number, tweet: TwitterFeedItem, username: string) {
        // 转换链接到 twitter.com
        const twitterLink = tweet.link.replace(/nitter\.[a-z\.]+/, 'twitter.com');
        const author = tweet.author || username;

        const message = `
🐦 <b>${author} 发布了推文</b>

${tweet.title}

🔗 <a href="${twitterLink}">查看推文</a>
`;
        await this.notify(userId, message, undefined, twitterLink);
    }
}

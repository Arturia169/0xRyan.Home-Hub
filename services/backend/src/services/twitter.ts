/**
 * Twitter/X 用户监控服务
 * 基于 RSShub 或 Nitter 订阅检测新推文
 */

import Parser from 'rss-parser';
import { setInterval, clearInterval, setTimeout } from 'node:timers';
import { logger } from '../utils/logger.js';
import { sendMessage } from './notification.js';
import {
    getAllTwitterUsers,
    updateTwitterUserStatus
} from '../database/queries.js';
import type { TwitterUser } from '../database/models.js';

const log = logger.child('TwitterService');
const CHECK_INTERVAL = 10 * 60 * 1000; // 10分钟检查一次 (推特 RSS 经常限流，这里保守一点)

// Nitter 实例列表 (轮询使用以避免单点故障)
const NITTER_INSTANCES = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.cz'
];

interface TwitterFeedItem {
    guid: string; // 推文 ID URL
    title: string;
    link: string;
    pubDate: string;
    content?: string;
    description?: string; // Nitter 的 RSS 内容通常在 description 里
    author?: string;
}

export class TwitterService {
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
        log.info('Twitter 监控服务已启动');

        this.checkAllUsers();

        this.timer = setInterval(() => {
            this.checkAllUsers();
        }, CHECK_INTERVAL);
    }

    /**
     * 停止
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        log.info('Twitter 监控服务已停止');
    }

    /**
     * 获取可用的 RSS URL
     * 尝试多个 Nitter 实例
     */
    private async getWorkingRssUrl(username: string): Promise<string | null> {
        // 移除 @ 前缀
        const handle = username.replace('@', '');

        for (const instance of NITTER_INSTANCES) {
            try {
                const url = `${instance}/${handle}/rss`;
                // 简单测试一下是否可达? 
                // 这里直接返回 URL，让 parser 去试，如果 parser 报错则捕获
                return url;
            } catch (e) {
                continue;
            }
        }
        // 默认返回第一个，即使可能失败
        return `${NITTER_INSTANCES[0]}/${handle}/rss`;
    }

    /**
     * 检查所有用户
     */
    private async checkAllUsers() {
        try {
            const users = getAllTwitterUsers();
            if (users.length === 0) return;

            const checkedUsernames = new Set<string>();

            for (const user of users) {
                if (checkedUsernames.has(user.username)) continue;
                checkedUsernames.add(user.username);

                await this.checkUser(user);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            log.error('检查 Twitter 用户出错:', error);
        }
    }

    /**
     * 检查单个用户
     */
    private async checkUser(user: TwitterUser & { telegram_id: number }) {
        try {
            // 目前简单固定使用 privacydev 实例，相对稳定，后续可优化为轮询
            const handle = user.username.replace('@', '');
            const feedUrl = `https://nitter.privacydev.net/${handle}/rss`;

            const feed = await this.parser.parseURL(feedUrl);

            if (!feed.items || feed.items.length === 0) return;

            const latestTweet = feed.items[0] as TwitterFeedItem;
            // 提取推文 ID (通常在 GUID 或 Link 结尾)
            // GUID 格式通常是: https://nitter.net/user/status/123456...#m
            const tweetIdMatch = latestTweet.guid.match(/\/status\/(\d+)/);
            const tweetId = tweetIdMatch ? tweetIdMatch[1] : latestTweet.guid;

            if (tweetId !== user.last_tweet_id) {
                if (user.last_tweet_id) {
                    await this.notifyNewTweet(user, latestTweet);
                } else {
                    log.info(`首次初始化 Twitter 用户状态: ${handle}`);
                }

                updateTwitterUserStatus(user.id, tweetId);
            }

        } catch (error: any) {
            // Twitter RSS 经常失败，这是预期的，记录 warning 即可
            log.warn(`检查 Twitter 用户失败 (${user.username}):`, error.message);
        }
    }

    private async notifyNewTweet(
        user: TwitterUser & { telegram_id: number },
        tweet: TwitterFeedItem
    ) {
        try {
            const allUsers = getAllTwitterUsers();
            const subscribers = allUsers.filter(u => u.username === user.username);

            // 转换 Nitter 链接回 Twitter 原生链接 (方便用户由 App 打开)
            const twitterLink = tweet.link.replace(/nitter\.[a-z\.]+/, 'twitter.com');
            const author = tweet.author || user.username;

            const message = `
🐦 <b>${author} 发布了推文</b>

${tweet.title}

🔗 <a href="${twitterLink}">查看推文</a>
`;

            for (const sub of subscribers) {
                await sendMessage(sub.telegram_id, message, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: false // 允许推特预览图
                });
            }

            log.info(`发送 Twitter 通知: ${user.username}`);

        } catch (error) {
            log.error('发送 Twitter 通知出错:', error);
        }
    }
}

export const twitterService = new TwitterService();

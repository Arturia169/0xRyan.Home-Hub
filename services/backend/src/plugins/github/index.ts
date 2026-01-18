/**
 * GitHub 插件
 * 监控 GitHub 仓库 Release 发布
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { Subscription } from '../../core/types.js';
import Parser from 'rss-parser';
import {
    addGithubRepo,
    getAllGithubRepos,
    removeGithubRepo,
    updateGithubRepoStatus
} from '../../database/queries.js';
import { setTimeout } from 'node:timers';

interface GithubFeedItem {
    id: string; // usually a tag uri
    title: string;
    link: string;
    pubDate: string;
    content: string;
    contentSnippet?: string;
    author: string;
}

export class GithubPlugin extends BasePlugin {
    name = 'github';
    label = 'GitHub 监控';
    interval = 30 * 60 * 1000; // 30分钟检查一次

    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
    }

    async addSubscription(userId: number, target: string, name?: string): Promise<any> {
        // target should be "owner/repo"
        if (!target.includes('/')) {
            throw new Error('格式错误，请使用 "owner/repo" (例如: microsoft/vscode)');
        }

        return addGithubRepo(userId, target, name);
    }

    async removeSubscription(userId: number, target: string): Promise<boolean> {
        return removeGithubRepo(userId, target);
    }

    async getSubscriptions(userId: number): Promise<Subscription[]> {
        const repos = getAllGithubRepos().filter(r => r.telegram_id === userId);
        return repos.map(r => ({
            id: r.id!,
            userId: r.telegram_id,
            targetId: r.repo,
            name: r.name,
            extra: {
                lastReleaseTag: r.last_release_tag
            }
        }));
    }

    protected async checkUpdates(): Promise<void> {
        const repos = getAllGithubRepos();
        if (repos.length === 0) return;

        const uniqueRepos = new Set(repos.map(r => r.repo));

        for (const repo of uniqueRepos) {
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));

                // GitHub Release RSS
                const feedUrl = `https://github.com/${repo}/releases.atom`;
                let feed;
                try {
                    feed = await this.parser.parseURL(feedUrl);
                } catch (e: any) {
                    this.log.warn(`获取 GitHub RSS 失败 (${repo}): ${e.message}`);
                    continue;
                }

                if (!feed.items || feed.items.length === 0) continue;

                const latestRelease = feed.items[0] as GithubFeedItem;
                // id 格式 usually: tag:github.com,2008:Repository/12345/v1.0.0
                // 我们直接用 link 或 title 对应的 tag 作为唯一标识
                // 一般 release title 就是 tag version，或者从 link 中提取
                const releaseTag = latestRelease.id;

                const subscribers = repos.filter(r => r.repo === repo);

                for (const sub of subscribers) {
                    if (sub.last_release_tag !== releaseTag) {
                        if (sub.last_release_tag) {
                            await this.sendNotification(sub.telegram_id, latestRelease, repo);
                        } else {
                            this.log.info(`首次初始化 GitHub 仓库: ${repo}`);
                        }
                        updateGithubRepoStatus(sub.id!, releaseTag);
                    }
                }

            } catch (error: any) {
                this.log.error(`检查 GitHub 仓库出错 (${repo}):`, error.message);
            }
        }
    }

    private async sendNotification(userId: number, release: GithubFeedItem, repo: string) {
        // 尝试从 content 提取简介 (GitHub atom feed content 可能是 HTML)
        // 简单截取
        const summary = release.contentSnippet?.slice(0, 200) + '...' || '点击查看详情';

        const message = `
🐙 <b>${repo} 发布了新版本</b>

<b>${release.title}</b>

${summary}

⏰ ${new Date(release.pubDate).toLocaleString('zh-CN')}
🔗 <a href="${release.link}">查看 Release</a>
`;
        await this.notify(userId, message, undefined, release.link);
    }
}

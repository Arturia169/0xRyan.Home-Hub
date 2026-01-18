/**
 * 插件基类
 * 封装了通用的工具方法，如日志、通知等
 */

import { SourcePlugin, Subscription } from './types.js';
import { logger } from '../utils/logger.js';
import { sendMessage, sendPhoto } from '../services/notification.js';
import { getDatabase } from '../database/index.js';
import { setTimeout, setInterval, clearInterval } from 'node:timers';
import type { Database } from 'better-sqlite3';

export abstract class BasePlugin implements SourcePlugin {
    abstract name: string;
    abstract label: string;
    abstract interval: number;

    protected log: any;
    protected timer: NodeJS.Timeout | null = null;

    constructor() {
        // 在子类构造函数中初始化 logger，名字暂时用 BasePlugin，子类应该覆盖
        this.log = logger.child('Plugin:Base');
    }

    // 初始化方法，子类必须调用 super.init() 或自行实现
    async init(): Promise<void> {
        this.log = logger.child(`Plugin:${this.name}`);
        this.log.info(`正在初始化插件: ${this.label}`);
    }

    // 抽象方法，必须由子类实现
    abstract addSubscription(userId: number, target: string, name?: string): Promise<any>;
    abstract removeSubscription(userId: number, target: string): Promise<boolean>;
    abstract getSubscriptions(userId: number): Promise<Subscription[]>;

    // 具体的轮询逻辑，由子类实现
    protected abstract checkUpdates(): Promise<void>;

    start(): void {
        if (this.timer) return;
        this.log.info(`启动监控，间隔: ${this.interval}ms`);
        // 立即执行一次
        this.checkUpdates().catch(err => this.log.error('轮询出错:', err));

        this.timer = setInterval(() => {
            this.checkUpdates().catch(err => this.log.error('轮询出错:', err));
        }, this.interval);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.log.info('停止监控');
        }
    }

    // 通用通知方法
    protected async notify(userId: number, message: string, photoUrl?: string) {
        try {
            if (photoUrl) {
                await sendPhoto(userId, photoUrl, {
                    caption: message,
                    parse_mode: 'HTML'
                });
            } else {
                await sendMessage(userId, message, {
                    parse_mode: 'HTML'
                });
            }
            this.log.info(`发送通知给用户 ${userId}`);
        } catch (error: any) {
            this.log.error(`发送通知失败 (用户 ${userId}):`, error.message);
        }
    }

    // 数据库辅助方法
    protected get db(): Database {
        return getDatabase();
    }
}

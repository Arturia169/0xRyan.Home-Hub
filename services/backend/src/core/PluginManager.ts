/**
 * 插件管理器
 */

import { SourcePlugin } from './types.js';
import { logger } from '../utils/logger.js';
import { Context } from 'grammy';
import { BilibiliPlugin } from '../plugins/bilibili/index.js';
import { GeneralRssPlugin } from '../plugins/general-rss/index.js';
import { YoutubePlugin } from '../plugins/youtube/index.js';

const log = logger.child('Core:PluginManager');

export class PluginManager {
    private plugins: Map<string, SourcePlugin> = new Map();

    constructor() {
        // 在这里注册所有内置插件
        this.register(new BilibiliPlugin());
        this.register(new GeneralRssPlugin());
        this.register(new YoutubePlugin());
    }

    // 注册插件
    register(plugin: SourcePlugin) {
        if (this.plugins.has(plugin.name)) {
            log.warn(`插件 ${plugin.name} 已存在，将被覆盖`);
        }
        this.plugins.set(plugin.name, plugin);
        log.info(`插件已注册: ${plugin.label} (${plugin.name})`);
    }

    // 获取插件
    get(name: string): SourcePlugin | undefined {
        return this.plugins.get(name);
    }

    // 获取所有插件
    getAll(): SourcePlugin[] {
        return Array.from(this.plugins.values());
    }

    // 初始化所有插件
    async initAll() {
        log.info('正在初始化所有插件...');
        for (const plugin of this.plugins.values()) {
            try {
                await plugin.init();
                log.info(`插件 ${plugin.name} 初始化成功`);
            } catch (error) {
                log.error(`插件 ${plugin.name} 初始化失败:`, error);
            }
        }
    }

    // 启动所有插件
    startAll() {
        log.info('正在启动所有监控...');
        for (const plugin of this.plugins.values()) {
            try {
                plugin.start();
            } catch (error) {
                log.error(`插件 ${plugin.name} 启动失败:`, error);
            }
        }
    }

    // 停止所有插件
    stopAll() {
        for (const plugin of this.plugins.values()) {
            plugin.stop();
        }
    }

    // 处理统一的订阅命令
    async handleAddCommand(ctx: Context, pluginName: string, args: string[]) {
        const plugin = this.get(pluginName);
        if (!plugin) return;

        if (args.length < 1) {
            await ctx.reply(`⚠️ 使用方法: /add${pluginName} <ID/URL> [名称]`);
            return;
        }

        const target = args[0];
        const name = args.slice(1).join(' ');
        const userId = ctx.from!.id;

        try {
            await plugin.addSubscription(userId, target, name);
            await ctx.reply(`✅ 成功添加 ${plugin.label} 订阅: ${name || target}`);
        } catch (error: any) {
            await ctx.reply(`❌ 添加失败: ${error.message}`);
        }
    }
}

export const pluginManager = new PluginManager();

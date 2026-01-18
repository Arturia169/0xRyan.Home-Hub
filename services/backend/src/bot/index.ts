/**
 * Telegram Bot 初始化模块
 */

import { Bot, GrammyError, HttpError, Context, NextFunction } from 'grammy';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { setBotInstance } from '../services/notification.js';

// 导入命令处理器
import startCommand from './commands/start.js';
import { addBili, removeBili } from './commands/bilibili.js';
import { addYoutube, removeYoutube } from './commands/youtube.js';
import { addTwitter, removeTwitter } from './commands/twitter.js';
import { listAll } from './commands/list.js';
import { listUsers, setRole } from './commands/admin/index.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { pluginManager } from '../core/PluginManager.js';

const log = logger.child('Bot');

// Bot 实例
let bot: Bot | null = null;

/**
 * 检查用户是否有权限使用机器人
 */
function isUserAllowed(userId: number): boolean {
    const allowedUsers = config.telegram.allowedUserIds;
    // 如果没有配置允许用户列表，则允许所有用户
    if (!allowedUsers || allowedUsers.length === 0) {
        return true;
    }
    return allowedUsers.includes(userId);
}

/**
 * 创建并配置 Bot
 */
export function createBot(): Bot {
    if (!config.telegram.botToken) {
        throw new Error('未配置 TELEGRAM_BOT_TOKEN');
    }

    // 配置代理
    const botConfig: any = {};
    if (config.proxyUrl) {
        log.info(`使用代理启动 Bot: ${config.proxyUrl}`);
        botConfig.client = {
            baseFetchConfig: {
                agent: new HttpsProxyAgent(config.proxyUrl),
            },
        };
    }

    bot = new Bot(config.telegram.botToken, botConfig);

    // 设置 Bot 实例到通知服务
    setBotInstance(bot);

    // 权限检查中间件
    bot.use(async (ctx: Context, next: NextFunction) => {
        const userId = ctx.from?.id;
        if (userId && !isUserAllowed(userId)) {
            log.warn(`未授权用户尝试访问: ${userId}`);
            await ctx.reply('⛔ 你没有权限使用此机器人');
            return;
        }
        await next();
    });

    // 日志中间件
    bot.use(async (ctx: Context, next: NextFunction) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;

        if (ctx.message?.text) {
            log.debug(`处理消息: "${ctx.message.text}" (${ms}ms)`);
        } else if (ctx.callbackQuery?.data) {
            log.debug(`处理回调: "${ctx.callbackQuery.data}" (${ms}ms)`);
        }
    });

    // 处理回调查询
    bot.on('callback_query:data', async (ctx: Context, next) => {
        if (ctx.callbackQuery?.data === 'delete_msg') {
            try {
                await ctx.deleteMessage();
                await ctx.answerCallbackQuery({ text: '已删除' });
            } catch (error) {
                log.error('删除消息失败:', error);
                await ctx.answerCallbackQuery({ text: '删除失败，消息可能已过期' });
            }
        } else {
            await next();
        }
    });

    // 注册命令处理器
    bot.use(startCommand);

    // Bilibili 命令
    bot.command('addbili', addBili);
    bot.command('removebili', removeBili);

    // YouTube 命令
    bot.command('addyt', addYoutube);
    bot.command('removeyt', removeYoutube);

    // Twitter 命令
    bot.command('addtw', addTwitter);
    bot.command('removetw', removeTwitter);

    // 统一的订阅列表命令
    bot.command('list', listAll);

    // RSS 命令 (托管给 PluginManager)
    bot.command('addrss', async (ctx: Context) => {
        if (!ctx.message?.text) return;
        const parts = ctx.message.text.split(' ');
        await pluginManager.handleAddCommand(ctx, 'rss', parts.slice(1));
    });

    bot.command('removerss', async (ctx: Context) => {
        if (!ctx.message?.text) return;
        const parts = ctx.message.text.split(' ');
        if (parts.length < 2) return ctx.reply('⚠️ 用法: /removerss <URL>');

        try {
            const plugin = pluginManager.get('rss');
            if (plugin && await plugin.removeSubscription(ctx.from!.id, parts[1])) {
                await ctx.reply('✅ 删除成功');
            } else {
                await ctx.reply('❌ 删除失败或订阅不存在');
            }
        } catch (e: any) { ctx.reply(`❌ 错误: ${e.message}`); }
    });

    // GitHub 命令
    bot.command('addgh', async (ctx: Context) => {
        if (!ctx.message?.text) return;
        const parts = ctx.message.text.split(' ');
        await pluginManager.handleAddCommand(ctx, 'github', parts.slice(1));
    });

    bot.command('removegh', async (ctx: Context) => {
        if (!ctx.message?.text) return;
        const parts = ctx.message.text.split(' ');
        if (parts.length < 2) return ctx.reply('⚠️ 用法: /removegh <owner/repo>');

        try {
            const plugin = pluginManager.get('github');
            if (plugin && await plugin.removeSubscription(ctx.from!.id, parts[1])) {
                await ctx.reply('✅ 删除成功');
            } else {
                await ctx.reply('❌ 删除失败或订阅不存在');
            }
        } catch (e: any) { ctx.reply(`❌ 错误: ${e.message}`); }
    });

    // 管理员命令
    bot.command('admin_users', listUsers);
    bot.command('setrole', setRole);

    // 错误处理
    bot.catch((err: any) => {
        const ctx = err.ctx;
        log.error(`处理更新 ${ctx.update.update_id} 时出错:`, err.error);

        if (err.error instanceof GrammyError) {
            log.error('Telegram API 错误:', err.error.description);
        } else if (err.error instanceof HttpError) {
            log.error('HTTP 错误:', err.error);
        } else {
            log.error('未知错误:', err.error);
        }
    });

    return bot;
}

/**
 * 启动 Bot
 */
export async function startBot(): Promise<void> {
    if (!bot) {
        createBot();
    }

    // 设置命令列表
    await bot!.api.setMyCommands([
        { command: 'start', description: '开始使用 / 主菜单' },
        { command: 'list', description: '查看所有订阅' },
        { command: 'addbili', description: '添加B站直播监控' },
        { command: 'addrss', description: '添加RSS订阅' },
        { command: 'addyt', description: '添加YouTube频道监控' },
        { command: 'addtw', description: '添加Twitter用户监控' },
        { command: 'addgh', description: '添加GitHub仓库监控' },
        { command: 'admin_users', description: '[Admin] 用户管理' },
        { command: 'setrole', description: '[Admin] 修改权限' },
        { command: 'help', description: '帮助信息' },
    ]);



    // 强制重置菜单按钮为默认（移除残留的控制面板按钮）
    try {
        await bot!.api.setChatMenuButton({
            menu_button: { type: 'default' },
        });
        log.info('菜单按钮已重置为默认');
    } catch (error) {
        log.error('重置菜单按钮失败:', error);
    }

    log.info('Bot 命令已注册');

    // 启动长轮询
    bot!.start({
        onStart: (botInfo: any) => {
            log.info(`Bot 已启动: @${botInfo.username}`);
        },
    });
}

/**
 * 停止 Bot
 */
export async function stopBot(): Promise<void> {
    if (bot) {
        await bot.stop();
        log.info('Bot 已停止');
    }
}

/**
 * 获取 Bot 实例
 */
export function getBot(): Bot | null {
    return bot;
}

export default { createBot, startBot, stopBot, getBot };

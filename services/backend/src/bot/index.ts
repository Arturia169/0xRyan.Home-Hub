/**
 * Telegram Bot 初始化模块
 */

import { Bot, GrammyError, HttpError, Context, NextFunction } from 'grammy';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { setBotInstance } from '../services/notification.js';

// 导入命令处理器
import startCommand from './commands/start.js';
import { addBili, removeBili, listBili } from './commands/bilibili.js';
import { bilibiliService } from '../services/bilibili.js';

// 导入键盘
import { mainMenuKeyboard } from './keyboards.js';

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

    bot = new Bot(config.telegram.botToken);

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

    // 注册命令处理器
    bot.use(startCommand);

    // Bilibili 命令
    bot.command('addbili', addBili);
    bot.command('removebili', removeBili);
    bot.command('listbili', listBili);

    // 处理主菜单回调
    bot.callbackQuery('menu:main', async (ctx: Context) => {
        await ctx.editMessageText(
            '🤖 <b>赛博基地情报中心</b>\n\n请选择操作：',
            {
                parse_mode: 'HTML',
                reply_markup: mainMenuKeyboard(),
            }
        );
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery('menu:add', async (ctx: Context) => {
        await ctx.reply('请使用 /addbili 命令添加 B站 监控');
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery('menu:list', async (ctx: Context) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('请使用 /listbili 命令查看监控列表');
    });

    bot.callbackQuery('menu:balance', async (ctx: Context) => {
        await ctx.reply('情报中心模式下不提供余额查询');
        await ctx.answerCallbackQuery();
    });

    // 处理 noop 回调（无操作）
    bot.callbackQuery('noop', async (ctx: Context) => {
        await ctx.answerCallbackQuery();
    });

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
        { command: 'addbili', description: '添加B站直播监控' },
        { command: 'listbili', description: '查看B站监控列表' },
        { command: 'removebili', description: '移除B站监控' },
        { command: 'help', description: '帮助信息' },
    ]);

    // 设置菜单按钮为 Web App
    if (config.telegram.webappUrl) {
        if (config.telegram.webappUrl.startsWith('https://')) {
            try {
                await bot!.api.setChatMenuButton({
                    menu_button: {
                        type: 'web_app',
                        text: '💎 控制面板',
                        web_app: { url: config.telegram.webappUrl },
                    },
                });
                log.info('Bot 菜单按钮已设置为 Web App');
            } catch (error) {
                log.error('设置菜单按钮失败:', error);
            }
        } else {
            log.warn('⚠️ WEBAPP_URL 不是 HTTPS 地址，无法设置为菜单按钮。');
            try {
                await bot!.api.setChatMenuButton({
                    menu_button: { type: 'default' },
                });
            } catch (e) {
                log.error('重置菜单按钮失败:', e);
            }
        }
    }

    // 启动 Bilibili 监控服务
    bilibiliService.start();

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
        bilibiliService.stop();
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

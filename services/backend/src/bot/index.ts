/**
 * Telegram Bot 初始化模块
 */

import { Bot, session, GrammyError, HttpError } from 'grammy';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { setBotInstance } from '../services/notification.js';

// 导入命令处理器
import startCommand from './commands/start.js';
import addCommand from './commands/add.js';
import listCommand from './commands/list.js';
import balanceCommand from './commands/balance.js';
import priceCommand from './commands/price.js';
import alertCommand from './commands/alert.js';
import statsCommand from './commands/stats.js';
import historyCommand from './commands/history.js';
import summaryCommand from './commands/summary.js';
import labelCommand from './commands/label.js';
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
    bot.use(async (ctx, next) => {
        const userId = ctx.from?.id;
        if (userId && !isUserAllowed(userId)) {
            log.warn(`未授权用户尝试访问: ${userId}`);
            await ctx.reply('⛔ 你没有权限使用此机器人');
            return;
        }
        await next();
    });

    // 日志中间件
    bot.use(async (ctx, next) => {
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
    bot.use(addCommand);
    bot.use(listCommand);
    bot.use(balanceCommand);
    bot.use(priceCommand);
    bot.use(alertCommand);
    bot.use(statsCommand);
    bot.use(historyCommand);
    bot.use(summaryCommand);
    bot.use(labelCommand);

    // Bilibili 命令
    bot.command('addbili', addBili);
    bot.command('removebili', removeBili);
    bot.command('listbili', listBili);

    // 处理主菜单回调
    bot.callbackQuery('menu:main', async (ctx) => {
        await ctx.editMessageText(
            '🤖 <b>虚拟钱包监控机器人</b>\n\n请选择操作：',
            {
                parse_mode: 'HTML',
                reply_markup: mainMenuKeyboard(),
            }
        );
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery('menu:add', async (ctx) => {
        await ctx.reply('请使用 /add 命令添加钱包');
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery('menu:list', async (ctx) => {
        // 手动触发 /list 命令逻辑
        await ctx.answerCallbackQuery();
        // 发送提示
        await ctx.reply('请使用 /list 命令查看钱包列表');
    });

    bot.callbackQuery('menu:balance', async (ctx) => {
        await ctx.reply('请使用 /balance 命令查询余额');
        await ctx.answerCallbackQuery();
    });

    // 处理 noop 回调（无操作）
    bot.callbackQuery('noop', async (ctx) => {
        await ctx.answerCallbackQuery();
    });

    // 错误处理
    bot.catch((err) => {
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
        { command: 'add', description: '添加监控钱包' },
        { command: 'list', description: '查看所有钱包' },
        { command: 'balance', description: '查询钱包余额' },
        { command: 'price', description: '查询代币价格' },
        { command: 'alert', description: '设置余额告警' },
        { command: 'stats', description: '资产分布统计' },
        { command: 'summary', description: '全资产概览汇总' },
        { command: 'history', description: '查看交易历史' },
        { command: 'addtoken', description: '添加自定义代币' },
        { command: 'addbili', description: '添加B站直播监控' },
        { command: 'listbili', description: '查看B站监控列表' },
        { command: 'removebili', description: '移除B站监控' },
        { command: 'help', description: '帮助信息' },
    ]);

    // 设置菜单按钮为 Web App
    if (config.telegram.webappUrl) {
        // Telegram 要求 setChatMenuButton 的 URL 必须是 HTTPS
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
            log.warn('⚠️ WEBAPP_URL 不是 HTTPS 地址，无法设置为菜单按钮。Telegram 强制要求 HTTPS 以启动 Mini App。已使用默认菜单。');
            try {
                // 如果不是 HTTPS，设回默认按钮，避免 API 报错
                await bot!.api.setChatMenuButton({
                    menu_button: { type: 'default' },
                });
            } catch (e) {
                log.error('充正菜单按钮失败:', e);
            }
        }
    } else {
        log.warn('⚠️ WEBAPP_URL 未配置，"💎 控制面板" 按钮将无法正常工作。请在 .env 中设置 WEBAPP_URL');
    }

    // 启动 Bilibili 监控服务
    bilibiliService.start();

    log.info('Bot 命令已注册');

    // 启动长轮询
    bot!.start({
        onStart: (botInfo) => {
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

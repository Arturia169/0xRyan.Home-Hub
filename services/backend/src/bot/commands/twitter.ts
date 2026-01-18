/**
 * Twitter 相关命令
 */

import { Context } from 'grammy';
import { pluginManager } from '../../core/PluginManager.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('Bot:Twitter');

/**
 * 添加 Twitter 订阅
 * 格式: /addtw <username> [可选名称]
 */
export async function addTwitter(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/addtw <username> [自定义名称]`\n\n例如: `/addtw @elonmusk 马斯克`', { parse_mode: 'Markdown' });
        return;
    }

    let username = args[0];
    // 确保有 @ 前缀
    if (!username.startsWith('@')) {
        username = '@' + username;
    }

    const name = args.slice(1).join(' ') || username;
    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('twitter');
        if (!plugin) return ctx.reply('❌ 插件未加载');

        await plugin.addSubscription(userId, username, name);
        await ctx.reply(`✅ 成功订阅 Twitter 用户: <b>${name}</b>\n帐号: <code>${username}</code>`, { parse_mode: 'HTML' });
        log.info(`用户 ${userId} 添加 Twitter 订阅: ${username}`);
    } catch (error: any) {
        await ctx.reply(`❌ 添加失败: ${error.message}`);
    }
}

/**
 * 移除 Twitter 订阅
 */
export async function removeTwitter(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/removetw <username>`', { parse_mode: 'Markdown' });
        return;
    }

    let username = args[0];
    if (!username.startsWith('@')) {
        username = '@' + username;
    }

    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('twitter');
        if (!plugin) return ctx.reply('❌ 插件未加载');

        const success = await plugin.removeSubscription(userId, username);
        if (success) {
            await ctx.reply(`🗑️ 已取消订阅 Twitter 用户: ${username}`);
        } else {
            await ctx.reply('⚠️ 未找到该用户的订阅记录');
        }
    } catch (error: any) {
        await ctx.reply(`❌ 移除失败: ${error.message}`);
    }
}

/**
 * 列出所有订阅
 */
export async function listTwitter(ctx: Context) {
    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('twitter');
        if (!plugin) return;

        const users = await plugin.getSubscriptions(userId);

        if (users.length === 0) {
            await ctx.reply('📭 你还没有订阅任何 Twitter 用户');
            return;
        }

        let message = '🐦 <b>Twitter 订阅列表:</b>\n\n';
        users.forEach((u, index) => {
            message += `${index + 1}. <b>${u.name || u.targetId}</b>\n`;
            message += `   Handle: <code>${u.targetId}</code>\n`;
            message += '\n';
        });

        await ctx.reply(message, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
    } catch (e) { console.error(e); }
}

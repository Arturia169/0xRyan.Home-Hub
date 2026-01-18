/**
 * 统一的订阅列表命令
 */


import {
    getAllYoutubeChannels,
    getAllTwitterUsers
} from '../../database/queries.js';
import { pluginManager } from '../../core/PluginManager.js';
import { Subscription } from '../../core/types.js';

export async function listAll(ctx: Context) {
    const userId = ctx.from!.id;

    // 获取所有订阅
    let biliSubs: Subscription[] = [];
    try {
        const biliPlugin = pluginManager.get('bilibili');
        if (biliPlugin) {
            biliSubs = await biliPlugin.getSubscriptions(userId);
        }
    } catch (e) {
        console.error('获取B站订阅失败', e);
    }

    // 暂时还未迁移 YouTube 和 Twitter，沿用旧查询
    const ytChannels = getAllYoutubeChannels().filter(c => c.telegram_id === userId);
    const twUsers = getAllTwitterUsers().filter(u => u.telegram_id === userId);

    if (biliSubs.length === 0 && ytChannels.length === 0 && twUsers.length === 0) {
        await ctx.reply('📭 你还没有任何订阅\n\n使用以下命令添加订阅：\n/addbili - B站直播\n/addyt - YouTube频道\n/addtw - Twitter用户');
        return;
    }

    let message = '📋 <b>我的订阅列表</b>\n\n';

    // Bilibili
    if (biliSubs.length > 0) {
        message += '📺 <b>Bilibili 直播 (' + biliSubs.length + ')</b>\n';
        biliSubs.forEach((s, index) => {
            const isLive = s.extra?.isLive;
            const status = isLive ? '🔴 直播中' : '⚫ 未开播';
            message += `${index + 1}. ${s.name || s.targetId} ${status}\n`;
            message += `   房间号: <code>${s.targetId}</code>\n`;
        });
        message += '\n';
    }

    // YouTube
    if (ytChannels.length > 0) {
        message += '🎬 <b>YouTube 频道 (' + ytChannels.length + ')</b>\n';
        ytChannels.forEach((c, index) => {
            message += `${index + 1}. ${c.name || c.channel_id}\n`;
            message += `   ID: <code>${c.channel_id}</code>\n`;
        });
        message += '\n';
    }

    // RSS
    try {
        const rssPlugin = pluginManager.get('rss');
        if (rssPlugin) {
            const rssSubs = await rssPlugin.getSubscriptions(userId);
            if (rssSubs.length > 0) {
                message += '📰 <b>RSS 订阅 (' + rssSubs.length + ')</b>\n';
                rssSubs.forEach((s, index) => {
                    message += `${index + 1}. <a href="${s.targetId}">${s.name || 'RSS源'}</a>\n`;
                });
                message += '\n';
            }
        }
    } catch (e) { console.error(e); }

    // Twitter
    if (twUsers.length > 0) {
        message += '🐦 <b>Twitter 用户 (' + twUsers.length + ')</b>\n';
        twUsers.forEach((u, index) => {
            message += `${index + 1}. ${u.name || u.username}\n`;
            message += `   Handle: <code>${u.username}</code>\n`;
        });
        message += '\n';
    }

    message += '💡 使用 /remove 命令可以取消订阅';

    await ctx.reply(message, { parse_mode: 'HTML' });
}

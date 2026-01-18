import { pluginManager } from '../../core/PluginManager.js';
import { Subscription } from '../../core/types.js';
import { Context } from 'grammy';

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

    // 获取各插件订阅数量以判断是否全空
    let biliSubsCount = biliSubs.length;
    let ytSubsCount = 0;
    let twSubsCount = 0;
    let rssSubsCount = 0;

    try {
        const ytPlugin = pluginManager.get('youtube');
        if (ytPlugin) ytSubsCount = (await ytPlugin.getSubscriptions(userId)).length;
    } catch { }

    try {
        const twPlugin = pluginManager.get('twitter');
        if (twPlugin) twSubsCount = (await twPlugin.getSubscriptions(userId)).length;
    } catch { }

    try {
        const rssPlugin = pluginManager.get('rss');
        if (rssPlugin) rssSubsCount = (await rssPlugin.getSubscriptions(userId)).length;
    } catch { }

    if (biliSubsCount === 0 && ytSubsCount === 0 && twSubsCount === 0 && rssSubsCount === 0) {
        await ctx.reply('📭 你还没有任何订阅\n\n使用以下命令添加订阅：\n/addbili - B站直播\n/addyt - YouTube频道\n/addtw - Twitter用户\n/addrss - RSS订阅');
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
    try {
        const ytPlugin = pluginManager.get('youtube');
        if (ytPlugin) {
            const ytChannels = await ytPlugin.getSubscriptions(userId);
            if (ytChannels.length > 0) {
                message += '🎬 <b>YouTube 频道 (' + ytChannels.length + ')</b>\n';
                ytChannels.forEach((c, index) => {
                    message += `${index + 1}. ${c.name || c.targetId}\n`;
                    message += `   ID: <code>${c.targetId}</code>\n`;
                });
                message += '\n';
            }
        }
    } catch (e) {
        console.error('获取YouTube订阅失败', e);
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
    try {
        const twPlugin = pluginManager.get('twitter');
        if (twPlugin) {
            const twUsers = await twPlugin.getSubscriptions(userId);
            if (twUsers.length > 0) {
                message += '🐦 <b>Twitter 用户 (' + twUsers.length + ')</b>\n';
                twUsers.forEach((u, index) => {
                    message += `${index + 1}. ${u.name || u.targetId}\n`;
                    message += `   Handle: <code>${u.targetId}</code>\n`;
                });
                message += '\n';
            }
        }
    } catch (e) { console.error(e); }

    message += '💡 使用 /remove 命令可以取消订阅';

    await ctx.reply(message, { parse_mode: 'HTML' });
}

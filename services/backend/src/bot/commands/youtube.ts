/**
 * YouTube 相关命令
 */

import { Context } from 'grammy';
import {
    addYoutubeChannel,
    removeYoutubeChannel,
    getAllYoutubeChannels
} from '../../database/queries.js';
import { youtubeService } from '../../services/youtube.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('Bot:YouTube');

/**
 * 添加 YouTube 频道
 * 格式: /addyt <channel_id> [可选名称]
 */
export async function addYoutube(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/addyt <channel_id> [自定义名称]`\n\n例如: `/addyt UCxxxxxx 某个频道`', { parse_mode: 'Markdown' });
        return;
    }

    const channelId = args[0];
    const name = args.slice(1).join(' ') || channelId;
    const userId = ctx.from!.id;

    try {
        addYoutubeChannel(userId, channelId, name);
        await ctx.reply(`✅ 成功订阅 YouTube 频道: <b>${name}</b>\nID: <code>${channelId}</code>`, { parse_mode: 'HTML' });
        log.info(`用户 ${userId} 添加 YouTube 订阅: ${channelId}`);

        // 触发一次扫描
        // youtubeService.triggerScan(); // 暂时没有 public trigger 方法，依赖自动轮询即可
    } catch (error: any) {
        await ctx.reply(`❌ 添加失败: ${error.message}`);
    }
}

/**
 * 移除 YouTube 频道
 */
export async function removeYoutube(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/removeyt <channel_id>`', { parse_mode: 'Markdown' });
        return;
    }

    const channelId = args[0];
    const userId = ctx.from!.id;

    try {
        const success = removeYoutubeChannel(userId, channelId);
        if (success) {
            await ctx.reply(`🗑️ 已取消订阅 YouTube 频道: ${channelId}`);
        } else {
            await ctx.reply('⚠️ 未找到该频道的订阅记录');
        }
    } catch (error: any) {
        await ctx.reply(`❌ 移除失败: ${error.message}`);
    }
}

/**
 * 列出所有订阅
 */
export async function listYoutube(ctx: Context) {
    const userId = ctx.from!.id;
    const channels = getAllYoutubeChannels().filter(c => c.telegram_id === userId); // 注意: getAllYoutubeChannels 返回的是所有用户的，需要过滤

    if (channels.length === 0) {
        await ctx.reply('📭 你还没有订阅任何 YouTube 频道');
        return;
    }

    let message = '📺 <b>YouTube 订阅列表:</b>\n\n';
    channels.forEach((c, index) => {
        message += `${index + 1}. <b>${c.name || c.channel_id}</b>\n`;
        message += `   ID: <code>${c.channel_id}</code>\n`;
        // message += `   RSS: https://www.youtube.com/feeds/videos.xml?channel_id=${c.channel_id}\n\n`; // 保持简洁
        message += '\n';
    });

    await ctx.reply(message, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
}

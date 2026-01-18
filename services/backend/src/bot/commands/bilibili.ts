/**
 * Bilibili 相关命令
 */

import type { Context } from 'grammy';
import { logger } from '../../utils/logger.js';
import { getOrCreateUser } from '../../database/queries.js';
import {
    addBilibiliStreamer,
    removeBilibiliStreamer,
    getBilibiliStreamersByUser
} from '../../database/queries.js';
import { bilibiliService } from '../../services/bilibili.js';

const log = logger.child('BotCmd:Bili');

/**
 * 添加监控主播
 * /addbili <RoomID>
 */
export async function addBili(ctx: Context) {
    if (!ctx.message?.text) return;

    const parts = ctx.message.text.split(' ');
    if (parts.length !== 2) {
        await ctx.reply('⚠️ 格式错误\n请使用: `/addbili 房间号`\n例如: `/addbili 22637261`', { parse_mode: 'Markdown' });
        return;
    }

    const roomId = parts[1];
    if (!/^\d+$/.test(roomId)) {
        await ctx.reply('⚠️ 房间号必须是数字');
        return;
    }

    try {
        await ctx.reply('🔍 正在查询直播间信息...');

        // 获取直播间信息
        const info = await bilibiliService.getRoomInfo(roomId);
        if (!info) {
            await ctx.reply('❌ 无法找到该直播间，请检查房间号是否正确');
            return;
        }

        const user = ctx.from!;
        const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

        // 获取主播名字 (API 可能不直接返回 name，暂时用 title 或者 room_id 代替，或者后续优化)
        // 实际上 uapis.cn 接口返回的字段里没有直接的主播名字，
        // 不过我们可以用 title 作为初始名字，或者之后如果能获取到的话
        // 这里做一个假设：接口返回的 parent_area_name - area_name 可能包含一些信息
        // 更好的方式是如果有 uid，再查一次用户信息，但目前先简化处理
        // 注意：uapis.cn 返回的 json 里有 title, description, tags 等
        // 我们用 "主播(房间号)" 作为默认名字
        let name = `主播(${info.room_id})`;

        // 添加到数据库
        addBilibiliStreamer(
            dbUser.id,
            info.room_id.toString(),
            info.uid.toString(),
            name
        );

        const statusText = info.live_status === 1 ? '🟢 直播中' : '⚫ 未开播';

        await ctx.reply(
            `✅ <b>成功添加 Bilibili 监控</b>\n\n` +
            `🏠 房间号: <code>${info.room_id}</code>\n` +
            `📝 标题: ${info.title}\n` +
            `📡 状态: ${statusText}\n\n` +
            `当主播开播时，你会收到通知。`,
            { parse_mode: 'HTML' }
        );

    } catch (error: any) {
        log.error(error);
        await ctx.reply('❌ 添加失败，可能是数据库错误或网络问题');
    }
}

/**
 * 移除监控主播
 * /removebili <RoomID>
 */
export async function removeBili(ctx: Context) {
    if (!ctx.message?.text) return;

    const parts = ctx.message.text.split(' ');
    if (parts.length !== 2) {
        await ctx.reply('⚠️ 格式错误\n请使用: `/removebili 房间号`');
        return;
    }

    const roomId = parts[1];
    const user = ctx.from!;
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

    try {
        const success = removeBilibiliStreamer(dbUser.id, roomId);
        if (success) {
            await ctx.reply(`✅ 已停止监控直播间 ${roomId}`);
        } else {
            await ctx.reply(`⚠️ 你没有监控直播间 ${roomId}`);
        }
    } catch (error: any) {
        log.error(error);
        await ctx.reply('❌ 移除失败');
    }
}

/**
 * 列出已监控的主播
 * /listbili
 */
export async function listBili(ctx: Context) {
    const user = ctx.from!;
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

    const streamers = getBilibiliStreamersByUser(dbUser.id);

    if (streamers.length === 0) {
        await ctx.reply('📭 你还没有监控任何 Bilibili 直播间\n使用 `/addbili 房间号` 添加');
        return;
    }

    let message = '📺 <b>你的 Bilibili 监控列表</b>\n\n';

    for (const s of streamers) {
        const status = s.is_live === 1 ? '🟢 直播中' : '⚫ 未开播';
        const link = `<a href="https://live.bilibili.com/${s.room_id}">${s.room_id}</a>`;

        message += `${status} - 房间: ${link}\n`;
        if (s.last_title) {
            message += `📝 ${s.last_title}\n`;
        }
        message += '\n';
    }

    await ctx.reply(message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
    });
}

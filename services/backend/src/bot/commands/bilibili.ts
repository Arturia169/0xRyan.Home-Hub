import type { Context } from 'grammy';
import { pluginManager } from '../../core/PluginManager.js';
import { getOrCreateUser } from '../../database/queries.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('BotCmd:Bili');

/**
 * 添加监控主播
 * /addbili <RoomID>
 */
export async function addBili(ctx: Context) {
    if (!ctx.message?.text) return;

    const parts = ctx.message.text.split(' ');
    // parts[0] is /addbili, so we pass parts.slice(1)
    await pluginManager.handleAddCommand(ctx, 'bilibili', parts.slice(1));
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

    // 确保用户存在
    getOrCreateUser(user.id, user.username, user.first_name);

    try {
        const plugin = pluginManager.get('bilibili');
        if (!plugin) {
            await ctx.reply('❌ 插件未加载');
            return;
        }

        const success = await plugin.removeSubscription(user.id, roomId);
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



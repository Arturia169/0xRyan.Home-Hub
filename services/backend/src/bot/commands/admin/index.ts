/**
 * 管理员命令
 */

import { Context } from 'grammy';
import { getAllUsers, updateUserRole, getUserByTelegramId } from '../../../database/queries.js';
import config from '../../../config/index.js';

// 检查是否为管理员
export function isAdmin(userId: number): boolean {
    // 1. 检查配置文件中的 ALLOWED_USER_IDS (视为超级管理员)
    if (config.telegram.allowedUserIds.includes(userId)) {
        return true;
    }

    // 2. 检查数据库角色
    const user = getUserByTelegramId(userId);
    return user?.role === 'admin';
}

// 列出所有用户
export async function listUsers(ctx: Context) {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ 只有管理员可以使用此命令');
    }

    const users = getAllUsers();
    let message = '👥 <b>用户列表</b>\n\n';

    users.forEach((u) => {
        const roleIcon = u.role === 'admin' ? '👮' : (u.role === 'guest' ? '👤' : '✅');
        message += `${roleIcon} <b>${u.first_name || '未命名'}</b> (@${u.username || '无'})\n`;
        message += `   ID: <code>${u.telegram_id}</code> | Role: ${u.role}\n`;
    });

    message += '\n使用 /setrole <ID> <admin|user|guest> 修改权限';

    await ctx.reply(message, { parse_mode: 'HTML' });
}

// 修改用户角色
export async function setRole(ctx: Context) {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;

    const parts = ctx.message?.text?.split(' ') || [];
    if (parts.length < 3) {
        return ctx.reply('⚠️ 用法: /setrole <TelegramID> <admin|user|guest>');
    }

    const targetId = parseInt(parts[1]);
    const newRole = parts[2] as any;

    if (isNaN(targetId)) return ctx.reply('❌ 无效的 ID');
    if (!['admin', 'user', 'guest'].includes(newRole)) {
        return ctx.reply('❌ 角色必须是: admin, user, guest');
    }

    try {
        updateUserRole(targetId, newRole);
        await ctx.reply(`✅ 已将用户 <code>${targetId}</code> 设置为 <b>${newRole}</b>`, { parse_mode: 'HTML' });

        // 通知目标用户
        try {
            await ctx.api.sendMessage(targetId, `👮 你的权限已被更新为: <b>${newRole}</b>`, { parse_mode: 'HTML' });
        } catch (e) { }

    } catch (error: any) {
        await ctx.reply(`❌ 操作失败: ${error.message}`);
    }
}

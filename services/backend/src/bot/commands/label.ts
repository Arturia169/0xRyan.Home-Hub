/**
 * 钱包标签重命名处理器
 * 处理 wallet:label:id 的回调和输入
 */

import { Composer } from 'grammy';
import { updateWalletLabel, getWalletsByUser, getOrCreateUser } from '../../database/queries.js';
import { escapeHTML } from '../../utils/format.js';

const composer = new Composer();

// 存储重命名状态的简单 Session
const renamingSessions = new Map<number, { walletId: number }>();

// 处理来自列表或详情页的“修改标签”回调
composer.callbackQuery(/^wallet:label:(\d+)$/, async (ctx) => {
    const user = ctx.from;
    const walletId = parseInt(ctx.match[1]);

    renamingSessions.set(user.id, { walletId });

    await ctx.reply(
        '✏️ <b>修改钱包标签</b>\n\n请发送新的标签名称（例如：我的矿池、常用钱包）：\n\n发送 /cancel 取消操作。',
        { parse_mode: 'HTML' }
    );
    await ctx.answerCallbackQuery();
});

// 处理用户输入的文字（重命名逻辑）
composer.on('message:text', async (ctx, next) => {
    const user = ctx.from;
    if (!user) return next();

    const session = renamingSessions.get(user.id);
    if (!session) return next();

    const newLabel = ctx.message.text.trim();

    if (newLabel === '/cancel') {
        renamingSessions.delete(user.id);
        await ctx.reply('❌ 已取消重命名操作。');
        return;
    }

    try {
        const success = updateWalletLabel(session.walletId, newLabel);
        if (success) {
            await ctx.reply(`✅ 标签已更新为: <b>${escapeHTML(newLabel)}</b>`, { parse_mode: 'HTML' });
        } else {
            await ctx.reply('❌ 更新失败，未找到该钱包。');
        }
    } catch (error) {
        await ctx.reply('❌ 更新出错，请稍后刷新列表。');
    } finally {
        renamingSessions.delete(user.id);
    }
});

// 也可以直接通过命令修改：/label <钱包地址模糊匹配> <新标签>
composer.on('message:text', async (ctx, next) => {
    const text = ctx.message.text || '';
    if (!text.startsWith('/label ')) return next();

    const args = text.split(/\s+/).slice(1);
    if (args.length < 2) {
        await ctx.reply('❌ 用法: `/label <地址/模糊搜索> <新标签>`', { parse_mode: 'HTML' });
        return;
    }

    const search = args[0];
    const newLabel = args.slice(1).join(' ');

    const dbUser = getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const wallets = getWalletsByUser(dbUser.id);
    const wallet = wallets.find(w => w.address.includes(search) || (w.label && w.label.includes(search)));

    if (!wallet) {
        await ctx.reply('❌ 未找到匹配的钱包。');
        return;
    }

    const success = updateWalletLabel(wallet.id, newLabel);
    if (success) {
        await ctx.reply(`✅ 钱包 <code>${wallet.address.slice(0, 6)}...</code> 已重命名为: <b>${escapeHTML(newLabel)}</b>`, { parse_mode: 'HTML' });
    } else {
        await ctx.reply('❌ 重命名失败。');
    }
});

export default composer;

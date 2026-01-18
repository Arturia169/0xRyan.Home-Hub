/**
 * /list 和 /remove 命令处理器
 * 查看和管理监控钱包
 */

import { Composer } from 'grammy';
import { walletActionsKeyboard, confirmKeyboard } from '../keyboards.js';
import {
    getOrCreateUser,
    getWalletsByUser,
    removeWallet,
    getWalletByAddress
} from '../../database/queries.js';
import { shortenAddress, getChainEmoji } from '../../utils/format.js';

const composer = new Composer();

composer.command('list', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);

    if (wallets.length === 0) {
        await ctx.reply(
            '📋 <b>我的钱包</b>\n\n' +
            '暂无监控的钱包\n\n' +
            '💡 使用 /add 添加第一个钱包',
            { parse_mode: 'HTML' }
        );
        return;
    }

    let message = `📋 <b>我的钱包</b>\n\n`;
    message += `共 ${wallets.length} 个钱包：\n\n`;

    // 创建内联键盘按钮
    const buttons = [];

    for (const wallet of wallets) {
        const chainEmoji = getChainEmoji(wallet.chain);
        const chainName = wallet.chain === 'arbitrum' ? 'ARB' : 'TRON';
        const label = wallet.label ? ` (${wallet.label})` : '';

        message += `${chainEmoji} <b>${chainName}</b>${label}\n`;
        message += `   <code>${shortenAddress(wallet.address, 8, 6)}</code>\n\n`;

        // 为每个钱包添加操作按钮
        buttons.push([
            {
                text: `✏️ 重命名${label}`,
                callback_data: `wallet:label:${wallet.id}`
            },
            {
                text: `🗑️ 删除`,
                callback_data: `wallet:delete:${wallet.id}`
            }
        ]);
    }

    message += `💡 点击钱包地址可复制\n`;
    message += `使用 /balance 查询所有钱包余额`;

    await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
});

composer.command('remove', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const address = ctx.match?.toString().trim();

    if (!address) {
        await ctx.reply(
            '❌ 请提供要移除的钱包地址\n\n' +
            '用法: /remove <地址>\n' +
            '例如: /remove 0x1234...',
            { parse_mode: 'HTML' }
        );
        return;
    }

    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

    // 检查钱包是否存在
    const wallet = getWalletByAddress(dbUser.id, address);
    if (!wallet) {
        await ctx.reply('❌ 未找到该钱包地址', { parse_mode: 'HTML' });
        return;
    }

    // 移除钱包
    const success = removeWallet(dbUser.id, wallet.address, wallet.chain);

    if (success) {
        const chainEmoji = getChainEmoji(wallet.chain);
        await ctx.reply(
            `✅ <b>钱包已移除</b>\n\n` +
            `${chainEmoji} <code>${shortenAddress(address)}</code>`,
            { parse_mode: 'HTML' }
        );
    } else {
        await ctx.reply('❌ 移除失败，请稍后重试');
    }
});

// 处理钱包删除回调
composer.callbackQuery(/^wallet:delete:(\d+)$/, async (ctx) => {
    const walletId = parseInt(ctx.match[1]);

    await ctx.editMessageText(
        '⚠️ <b>确认删除</b>\n\n确定要移除此钱包的监控吗？',
        {
            parse_mode: 'HTML',
            reply_markup: confirmKeyboard(`confirm:delete:${walletId}`),
        }
    );
    await ctx.answerCallbackQuery();
});

// 处理删除确认
composer.callbackQuery(/^confirm:delete:(\d+)$/, async (ctx) => {
    const user = ctx.from;
    const walletId = parseInt(ctx.match[1]);

    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);
    const wallet = wallets.find(w => w.id === walletId);

    if (!wallet) {
        await ctx.editMessageText('❌ 钱包不存在或已被删除');
        await ctx.answerCallbackQuery();
        return;
    }

    const success = removeWallet(dbUser.id, wallet.address, wallet.chain);

    if (success) {
        await ctx.editMessageText(
            `✅ 钱包已移除\n<code>${shortenAddress(wallet.address)}</code>`,
            { parse_mode: 'HTML' }
        );
    } else {
        await ctx.editMessageText('❌ 移除失败');
    }
    await ctx.answerCallbackQuery();
});

export default composer;

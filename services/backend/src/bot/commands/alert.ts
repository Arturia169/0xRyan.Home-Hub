/**
 * /alert 命令处理器
 * 设置余额告警
 */

import { Composer } from 'grammy';
import { alertTypeKeyboard, confirmKeyboard } from '../keyboards.js';
import {
    getOrCreateUser,
    getWalletsByUser,
    getWalletByAddress,
    getAlertsByWallet,
    createAlert,
    deleteAlert,
    toggleAlert,
} from '../../database/queries.js';
import { shortenAddress, getChainEmoji, getTokenEmoji, formatAmount } from '../../utils/format.js';
import type { ChainType } from '../../config/index.js';

const composer = new Composer();

// 存储用户的告警设置会话
const alertSessions = new Map<number, {
    walletId: number;
    address: string;
    chain: ChainType;
    token?: string;
    threshold?: number;
    alertType?: 'below' | 'above';
    step: 'token' | 'threshold' | 'type';
}>();

composer.command('alert', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const args = ctx.match?.toString().trim().split(/\s+/) || [];
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);

    if (wallets.length === 0) {
        await ctx.reply('❌ 暂无监控的钱包，请先用 /add 添加钱包', { parse_mode: 'HTML' });
        return;
    }

    // 完整参数：/alert <地址> <代币> <阈值>
    if (args.length >= 3) {
        const address = args[0];
        const token = args[1].toUpperCase();
        const threshold = parseFloat(args[2]);

        const wallet = getWalletByAddress(dbUser.id, address);
        if (!wallet) {
            await ctx.reply('❌ 未找到该钱包', { parse_mode: 'HTML' });
            return;
        }

        if (isNaN(threshold) || threshold <= 0) {
            await ctx.reply('❌ 请输入有效的阈值（正数）', { parse_mode: 'HTML' });
            return;
        }

        // 创建告警（默认低于阈值触发）
        const alert = createAlert({
            walletId: wallet.id,
            tokenSymbol: token,
            threshold,
            alertType: 'below',
        });

        const chainEmoji = getChainEmoji(wallet.chain);
        const tokenEmoji = getTokenEmoji(token);

        await ctx.reply(
            `✅ <b>告警设置成功</b>\n\n` +
            `${chainEmoji} <b>钱包:</b> <code>${shortenAddress(wallet.address)}</code>\n` +
            `${tokenEmoji} <b>代币:</b> ${token}\n` +
            `🔻 <b>条件:</b> 余额低于 ${formatAmount(threshold, 4)}\n\n` +
            `当余额低于此值时，你将收到告警通知。`,
            { parse_mode: 'HTML' }
        );
        return;
    }

    // 显示现有告警或开始设置流程
    let message = '⚠️ <b>余额告警</b>\n\n';

    // 列出所有已设置的告警
    let hasAlerts = false;
    for (const wallet of wallets) {
        const alerts = getAlertsByWallet(wallet.id);
        if (alerts.length > 0) {
            hasAlerts = true;
            const chainEmoji = getChainEmoji(wallet.chain);
            message += `${chainEmoji} ${wallet.label || shortenAddress(wallet.address)}\n`;
            for (const alert of alerts) {
                const tokenEmoji = getTokenEmoji(alert.token_symbol);
                const typeIcon = alert.alert_type === 'below' ? '🔻' : '🔺';
                const typeText = alert.alert_type === 'below' ? '低于' : '高于';
                message += `   ${tokenEmoji} ${alert.token_symbol} ${typeIcon} ${typeText} ${formatAmount(alert.threshold, 4)}\n`;
            }
            message += '\n';
        }
    }

    if (!hasAlerts) {
        message += '暂无设置告警\n\n';
    }

    message += `<b>设置新告警:</b>\n`;
    message += `/alert &lt;地址&gt; &lt;代币&gt; &lt;阈值&gt;\n`;
    message += `例: /alert 0x1234... ETH 0.1`;

    await ctx.reply(message, { parse_mode: 'HTML' });
});

// 处理告警菜单回调
composer.callbackQuery('menu:alerts', async (ctx) => {
    const user = ctx.from;
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);

    let message = '⚠️ <b>余额告警</b>\n\n';

    let hasAlerts = false;
    for (const wallet of wallets) {
        const alerts = getAlertsByWallet(wallet.id);
        if (alerts.length > 0) {
            hasAlerts = true;
            const chainEmoji = getChainEmoji(wallet.chain);
            message += `${chainEmoji} ${wallet.label || shortenAddress(wallet.address)}\n`;
            for (const alert of alerts) {
                const tokenEmoji = getTokenEmoji(alert.token_symbol);
                const typeIcon = alert.alert_type === 'below' ? '🔻' : '🔺';
                const typeText = alert.alert_type === 'below' ? '低于' : '高于';
                message += `   ${tokenEmoji} ${alert.token_symbol} ${typeIcon} ${typeText} ${formatAmount(alert.threshold, 4)}\n`;
            }
            message += '\n';
        }
    }

    if (!hasAlerts) {
        message += '暂无设置告警\n\n';
    }

    message += `使用 /alert &lt;地址&gt; &lt;代币&gt; &lt;阈值&gt; 设置告警`;

    await ctx.reply(message, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
});

export default composer;

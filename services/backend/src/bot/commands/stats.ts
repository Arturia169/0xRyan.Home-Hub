/**
 * /stats 命令处理器
 * 资产统计汇总
 */

import { Composer } from 'grammy';
import { getOrCreateUser, getWalletsByUser, getUserStats } from '../../database/queries.js';
import { getChainService } from '../../chains/index.js';
import { getTokenPrices } from '../../services/price.js';
import {
    formatUSD,
    formatAmount,
    getChainEmoji,
    getTokenEmoji
} from '../../utils/format.js';
import type { ChainType } from '../../config/index.js';

const composer = new Composer();

/**
 * 发送统计信息
 */
/**
 * 发送统计信息
 */
async function sendStats(ctx: any, editMessageId?: number) {
    const user = ctx.from;
    if (!user) return;

    let statusMsgId = editMessageId;
    if (!statusMsgId) {
        const sent = await ctx.reply('⏳ 正在统计资产...');
        statusMsgId = sent.message_id;
    }

    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);
    const stats = getUserStats(dbUser.id);

    if (wallets.length === 0) {
        await ctx.api.editMessageText(
            ctx.chat.id,
            statusMsgId,
            '📊 <b>资产统计</b>\n\n' +
            '暂无监控的钱包\n\n' +
            '使用 /add 添加钱包开始监控',
            { parse_mode: 'HTML' }
        );
        return;
    }

    // 按链分组
    const chainStats = new Map<ChainType, {
        walletCount: number;
        tokens: Map<string, number>;
        totalUsd: number;
    }>();

    // 1. 先获取所有钱包的余额，收集所有代币符号
    const allBalances: Array<{ chain: string, symbol: string, amount: number }> = [];
    const seenSymbols = new Set<string>();

    for (const wallet of wallets) {
        try {
            const service = getChainService(wallet.chain);
            const balances = await service.getAllBalances(wallet.address);

            for (const balance of balances) {
                const amount = parseFloat(balance.balanceFormatted.replace(/,/g, ''));
                if (amount > 0) {
                    allBalances.push({
                        chain: wallet.chain,
                        symbol: balance.token.symbol,
                        amount: amount
                    });
                    seenSymbols.add(balance.token.symbol.toUpperCase());
                }
            }
        } catch (error) {
            // 跳过失败的钱包
        }
    }

    // 2. 获取所有涉及代币的价格
    const prices = await getTokenPrices(Array.from(seenSymbols));

    let grandTotalUsd = 0;

    for (const wallet of wallets) {
        try {
            const service = getChainService(wallet.chain);
            const balances = await service.getAllBalances(wallet.address);

            let chainData = chainStats.get(wallet.chain);
            if (!chainData) {
                chainData = { walletCount: 0, tokens: new Map(), totalUsd: 0 };
                chainStats.set(wallet.chain, chainData);
            }

            chainData.walletCount++;

            for (const balance of balances) {
                const numBalance = parseFloat(balance.balanceFormatted.replace(/,/g, ''));
                const price = prices[balance.token.symbol] || 0;
                const valueUsd = numBalance * price;

                const currentToken = chainData.tokens.get(balance.token.symbol) || 0;
                chainData.tokens.set(balance.token.symbol, currentToken + numBalance);

                chainData.totalUsd += valueUsd;
                grandTotalUsd += valueUsd;
            }
        } catch (error) {
            // 跳过失败的钱包
        }
    }

    // 构建统计消息
    let message = '📊 <b>资产统计汇总</b>\n\n';

    // 概览
    message += `👛 <b>钱包数量:</b> ${stats.walletCount}\n`;
    message += `⚠️ <b>活跃告警:</b> ${stats.alertCount}\n`;
    message += `🔗 <b>监控链:</b> ${stats.chains.map(c => c === 'arbitrum' ? 'ARB' : 'TRON').join(', ')}\n\n`;

    // 每条链的详情
    for (const [chain, data] of chainStats) {
        const chainEmoji = getChainEmoji(chain);
        const chainName = chain === 'arbitrum' ? 'Arbitrum One' : 'Tron';

        message += `${chainEmoji} <b>${chainName}</b> (${data.walletCount} 个钱包)\n`;

        // 按价值排序显示代币
        const tokenEntries = Array.from(data.tokens.entries())
            .map(([symbol, amount]) => ({
                symbol,
                amount,
                valueUsd: amount * (prices[symbol] || 0),
            }))
            .filter(t => t.amount > 0)
            .sort((a, b) => b.valueUsd - a.valueUsd);

        for (const token of tokenEntries) {
            const tokenEmoji = getTokenEmoji(token.symbol);
            message += `   ${tokenEmoji} ${formatAmount(token.amount, 4)} ${token.symbol}`;
            if (token.valueUsd > 0.01) {
                message += ` (${formatUSD(token.valueUsd)})`;
            }
            message += '\n';
        }

        message += `   💰 小计: ${formatUSD(data.totalUsd)}\n\n`;
    }

    // 总计
    message += `━━━━━━━━━━━━━━━\n`;
    message += `💎 <b>总资产价值:</b> ${formatUSD(grandTotalUsd)}`;

    await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsgId,
        message,
        { parse_mode: 'HTML' }
    );
}

composer.command('stats', async (ctx) => {
    await sendStats(ctx);
});

// 处理统计菜单回调
composer.callbackQuery('menu:stats', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '正在统计...' });
    await sendStats(ctx);
});

export default composer;

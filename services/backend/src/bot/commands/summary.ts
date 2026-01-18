/**
 * /summary 命令处理器
 * 汇总用户所有钱包的资产情况
 */

import { Composer } from 'grammy';
import { getWalletsByUser, getOrCreateUser } from '../../database/queries.js';
import { getChainService } from '../../chains/index.js';
import { getTokenPrices } from '../../services/price.js';
import {
    formatAmount,
    formatUSD,
    getChainEmoji,
    getTokenEmoji
} from '../../utils/format.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('SummaryCommand');
const composer = new Composer();

/**
 * 发送资产总结
 */
/**
 * 发送资产总结
 */
async function sendSummary(ctx: any, editMessageId?: number) {
    const user = ctx.from;
    if (!user) return;

    let statusMsgId = editMessageId;
    if (!statusMsgId) {
        const sent = await ctx.reply('🔍 正在计算全链资产，请稍候...');
        statusMsgId = sent.message_id;
    }

    try {
        const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
        const wallets = getWalletsByUser(dbUser.id);

        if (wallets.length === 0) {
            await ctx.api.editMessageText(
                ctx.chat.id,
                statusMsgId,
                '⚠️ 你还没有绑定任何钱包。使用 /add 开始添加。'
            );
            return;
        }

        // 1. 并发获取所有钱包的所有代币余额
        const allBalances: Array<{ chain: string, symbol: string, amount: number }> = [];
        const seenSymbols = new Set<string>();

        // 限制并发数为 5，避免 RPC 限制
        const batchSize = 5;
        for (let i = 0; i < wallets.length; i += batchSize) {
            const batch = wallets.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (wallet) => {
                try {
                    const service = getChainService(wallet.chain);
                    const balances = await service.getAllBalances(wallet.address);
                    return balances.map(b => ({
                        chain: wallet.chain,
                        symbol: b.token.symbol,
                        amount: parseFloat(b.balanceFormatted.replace(/,/g, '')),
                    }));
                } catch (error) {
                    log.error(`Fetch balance failed for ${wallet.address}:`, error);
                    return [];
                }
            }));

            results.flat().forEach(item => {
                if (item.amount > 0) {
                    allBalances.push(item);
                    seenSymbols.add(item.symbol.toUpperCase());
                }
            });
        }

        // 2. 获取所有涉及代币的价格
        // getTokenPrices 内部会合并自定义代币的配置
        const prices = await getTokenPrices(Array.from(seenSymbols));

        // 3. 统计各链资产
        let totalUsd = 0;
        const chainSummary: Record<string, {
            usd: number,
            tokens: Array<{ symbol: string, amount: number, value: number }>
        }> = {};

        // 初始化链统计结构
        for (const item of allBalances) {
            if (!chainSummary[item.chain]) {
                chainSummary[item.chain] = { usd: 0, tokens: [] };
            }
        }

        // 聚合代币（同一链上多个钱包的同种代币合并）
        const chainTokenMap: Record<string, Record<string, number>> = {};

        for (const item of allBalances) {
            const chain = item.chain;
            const symbol = item.symbol.toUpperCase();

            if (!chainTokenMap[chain]) chainTokenMap[chain] = {};
            chainTokenMap[chain][symbol] = (chainTokenMap[chain][symbol] || 0) + item.amount;
        }

        // 计算价值和排序
        for (const chain of Object.keys(chainTokenMap)) {
            const tokens = [];
            let chainTotal = 0;

            for (const [symbol, amount] of Object.entries(chainTokenMap[chain])) {
                const price = prices[symbol] || 0;
                const value = amount * price;
                if (value > 0 || amount > 0) { // 保留有余额的，即使价值未知
                    tokens.push({ symbol, amount, value });
                    chainTotal += value;
                }
            }

            // 按价值降序排序
            tokens.sort((a, b) => b.value - a.value);

            chainSummary[chain] = {
                usd: chainTotal,
                tokens: tokens
            };
            totalUsd += chainTotal;
        }

        // 4. 构造结果消息
        let message = `📊 <b>全资产概览</b>\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `💰 <b>总估值: ${formatUSD(totalUsd)}</b>\n\n`;

        // 按链的总价值降序排序显示
        const sortedChains = Object.entries(chainSummary).sort((a, b) => b[1].usd - a[1].usd);

        for (const [chain, data] of sortedChains) {
            const chainName = chain === 'arbitrum' ? 'Arbitrum' : 'Tron';
            message += `${getChainEmoji(chain as any)} <b>${chainName}</b> (${formatUSD(data.usd)})\n`;

            for (const token of data.tokens) {
                // 仅显示价值大于 $0.01 或 没有价格但有数量的代币
                if (token.value > 0.01 || (token.value === 0 && token.amount > 0)) {
                    const priceText = token.value > 0 ? ` (${formatUSD(token.value)})` : '';
                    message += `  • ${formatAmount(token.amount, 4)} ${token.symbol}${priceText}\n`;
                }
            }
            message += `\n`;
        }

        message += `⏰ 更新于: ${new Date().toLocaleTimeString('zh-CN')}`;

        await ctx.api.editMessageText(
            ctx.chat.id,
            statusMsgId,
            message,
            { parse_mode: 'HTML' }
        );

    } catch (error) {
        log.error('Summary error:', error);
        await ctx.api.editMessageText(
            ctx.chat.id,
            statusMsgId,
            '❌ 获取资产汇总失败，请稍后再试。'
        );
    }
}

composer.command('summary', async (ctx) => {
    await sendSummary(ctx);
});

// 处理全资产汇总回调
composer.callbackQuery('menu:summary', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '正在计算汇总...' });
    await sendSummary(ctx);
});

export default composer;

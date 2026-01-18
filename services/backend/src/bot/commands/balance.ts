/**
 * /balance 命令处理器
 * 查询钱包余额
 */

import { Composer } from 'grammy';
import { getOrCreateUser, getWalletsByUser, getWalletByAddress } from '../../database/queries.js';
import { getChainService } from '../../chains/index.js';
import { getTokenPrices } from '../../services/price.js';
import {
    shortenAddress,
    getChainEmoji,
    getTokenEmoji,
    formatAmount,
    formatUSD,
} from '../../utils/format.js';
import type { ChainType } from '../../config/index.js';

const composer = new Composer();

composer.command('balance', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const address = ctx.match?.toString().trim();
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

    if (address) {
        // 查询指定钱包
        const wallet = getWalletByAddress(dbUser.id, address);
        if (!wallet) {
            await ctx.reply('❌ 未找到该钱包，请先用 /add 添加', { parse_mode: 'HTML' });
            return;
        }

        await ctx.reply('⏳ 正在查询余额...');
        const message = await getWalletBalanceMessage(wallet.chain, wallet.address, wallet.label);
        await ctx.reply(message, { parse_mode: 'HTML' });
    } else {
        // 查询所有钱包
        const wallets = getWalletsByUser(dbUser.id);

        if (wallets.length === 0) {
            await ctx.reply(
                '❌ 暂无监控的钱包\n\n使用 /add 添加钱包',
                { parse_mode: 'HTML' }
            );
            return;
        }

        await ctx.reply(`⏳ 正在查询 ${wallets.length} 个钱包的余额...`);

        let totalValueUsd = 0;
        let message = '💰 <b>钱包余额汇总</b>\n\n';

        for (const wallet of wallets) {
            try {
                const { balanceText, valueUsd } = await getWalletBalanceText(
                    wallet.chain,
                    wallet.address,
                    wallet.label
                );
                message += balanceText + '\n';
                totalValueUsd += valueUsd;
            } catch (error) {
                const chainEmoji = getChainEmoji(wallet.chain);
                message += `${chainEmoji} ${wallet.label || shortenAddress(wallet.address)}\n`;
                message += `   ❌ 查询失败\n\n`;
            }
        }

        message += `━━━━━━━━━━━━━━━\n`;
        message += `💎 <b>总资产:</b> ${formatUSD(totalValueUsd)}`;

        await ctx.reply(message, { parse_mode: 'HTML' });
    }
});

// 获取单个钱包余额的完整消息
async function getWalletBalanceMessage(
    chain: ChainType,
    address: string,
    label?: string
): Promise<string> {
    const service = getChainService(chain);
    const chainEmoji = getChainEmoji(chain);
    const chainName = chain === 'arbitrum' ? 'Arbitrum One' : 'Tron';

    try {
        const balances = await service.getAllBalances(address);
        const symbols = balances.map(b => b.token.symbol);
        const prices = await getTokenPrices(symbols);

        let message = `💰 <b>钱包余额</b>\n\n`;
        message += `${chainEmoji} <b>链:</b> ${chainName}\n`;
        message += `📍 <b>地址:</b> <code>${shortenAddress(address, 8, 6)}</code>\n`;
        if (label) {
            message += `🏷️ <b>标签:</b> ${label}\n`;
        }
        message += `\n<b>代币余额:</b>\n`;

        let totalValueUsd = 0;

        for (const balance of balances) {
            const tokenEmoji = getTokenEmoji(balance.token.symbol);
            const price = prices[balance.token.symbol] || 0;
            const numBalance = parseFloat(balance.balanceFormatted.replace(/,/g, ''));
            const valueUsd = numBalance * price;
            totalValueUsd += valueUsd;

            message += `${tokenEmoji} <b>${balance.token.symbol}:</b> ${balance.balanceFormatted}`;
            if (price > 0 && valueUsd > 0.01) {
                message += ` (${formatUSD(valueUsd)})`;
            }
            message += '\n';
        }

        message += `\n💎 <b>总价值:</b> ${formatUSD(totalValueUsd)}`;

        return message;
    } catch (error) {
        return `❌ 查询余额失败: ${(error as Error).message}`;
    }
}

// 获取单个钱包余额的简短文本（用于汇总）
async function getWalletBalanceText(
    chain: ChainType,
    address: string,
    label?: string
): Promise<{ balanceText: string; valueUsd: number }> {
    const service = getChainService(chain);
    const chainEmoji = getChainEmoji(chain);

    const balances = await service.getAllBalances(address);
    const symbols = balances.map(b => b.token.symbol);
    const prices = await getTokenPrices(symbols);

    let totalValueUsd = 0;
    const walletName = label || shortenAddress(address);

    let balanceText = `${chainEmoji} <b>${walletName}</b>\n`;

    for (const balance of balances) {
        const tokenEmoji = getTokenEmoji(balance.token.symbol);
        const price = prices[balance.token.symbol] || 0;
        const numBalance = parseFloat(balance.balanceFormatted.replace(/,/g, ''));
        const valueUsd = numBalance * price;
        totalValueUsd += valueUsd;

        // 只显示有余额的代币
        if (numBalance > 0) {
            balanceText += `   ${tokenEmoji} ${balance.balanceFormatted} ${balance.token.symbol}`;
            if (valueUsd > 0.01) {
                balanceText += ` (${formatUSD(valueUsd)})`;
            }
            balanceText += '\n';
        }
    }

    return { balanceText, valueUsd: totalValueUsd };
}

// 处理余额查询回调
composer.callbackQuery(/^wallet:balance:(\d+)$/, async (ctx) => {
    const user = ctx.from;
    const walletId = parseInt(ctx.match[1]);

    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);
    const wallets = getWalletsByUser(dbUser.id);
    const wallet = wallets.find(w => w.id === walletId);

    if (!wallet) {
        await ctx.answerCallbackQuery({ text: '钱包不存在' });
        return;
    }

    await ctx.answerCallbackQuery({ text: '正在查询...' });

    const message = await getWalletBalanceMessage(wallet.chain, wallet.address, wallet.label);
    await ctx.reply(message, { parse_mode: 'HTML' });
});

export default composer;

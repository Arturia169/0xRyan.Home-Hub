/**
 * /history 命令处理器
 * 查询交易历史
 */

import { Composer } from 'grammy';
import { getOrCreateUser, getWalletsByUser, getWalletByAddress } from '../../database/queries.js';
import { getAllArbitrumTransactions } from '../../services/txhistory.js';
import {
    shortenAddress,
    getChainEmoji,
    getTokenEmoji,
    formatTimestamp,
    formatTokenBalance,
} from '../../utils/format.js';
import config from '../../config/index.js';

const composer = new Composer();

composer.command('history', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    // 检查 API Key 是否配置
    if (!config.etherscanApiKey) {
        await ctx.reply(
            '❌ 交易历史功能需要配置 ETHERSCAN_API_KEY\n\n' +
            '请在 .env 文件中添加:\n' +
            '<code>ETHERSCAN_API_KEY=你的API密钥</code>',
            { parse_mode: 'HTML' }
        );
        return;
    }

    const address = ctx.match?.toString().trim();
    const dbUser = getOrCreateUser(user.id, user.username, user.first_name);

    if (address) {
        // 查询指定钱包
        const wallet = getWalletByAddress(dbUser.id, address);
        if (!wallet) {
            await ctx.reply('❌ 未找到该钱包，请先用 /add 添加', { parse_mode: 'HTML' });
            return;
        }

        if (wallet.chain !== 'arbitrum') {
            await ctx.reply(
                '⚠️ 目前交易历史功能仅支持 Arbitrum One 链\n' +
                'Tron 链支持即将推出',
                { parse_mode: 'HTML' }
            );
            return;
        }

        await ctx.reply('⏳ 正在查询交易历史...');
        await showTransactionHistory(ctx, wallet.address, wallet.label);
    } else {
        // 获取第一个 Arbitrum 钱包
        const wallets = getWalletsByUser(dbUser.id);
        const arbWallet = wallets.find(w => w.chain === 'arbitrum');

        if (!arbWallet) {
            await ctx.reply(
                '❌ 未找到 Arbitrum 钱包\n\n' +
                '使用 /add arb <地址> 添加一个 Arbitrum 钱包',
                { parse_mode: 'HTML' }
            );
            return;
        }

        await ctx.reply('⏳ 正在查询交易历史...');
        await showTransactionHistory(ctx, arbWallet.address, arbWallet.label);
    }
});

async function showTransactionHistory(ctx: any, address: string, label?: string) {
    try {
        const transactions = await getAllArbitrumTransactions(address, 10);

        if (transactions.length === 0) {
            await ctx.reply(
                `📋 <b>交易历史</b>\n\n` +
                `👛 ${label || shortenAddress(address)}\n\n` +
                `暂无交易记录`,
                { parse_mode: 'HTML' }
            );
            return;
        }

        let message = `📋 <b>交易历史</b>\n\n`;
        message += `🔵 <b>Arbitrum One</b>\n`;
        message += `👛 ${label || shortenAddress(address, 8, 6)}\n\n`;

        for (const tx of transactions) {
            const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
            const typeEmoji = isIncoming ? '📥' : '📤';
            const typeText = isIncoming ? '收到' : '发送';

            if (tx.type === 'native') {
                // ETH 交易
                const ethAmount = formatTokenBalance(tx.value, 18);
                message += `${typeEmoji} ${typeText} <b>${ethAmount} ETH</b>\n`;
            } else {
                // 代币交易
                const tokenEmoji = getTokenEmoji(tx.tokenSymbol || '');
                // 需要根据代币获取精度，这里默认使用 6（USDC/USDT）
                const decimals = ['USDC', 'USDT'].includes(tx.tokenSymbol || '') ? 6 : 18;
                const amount = formatTokenBalance(tx.value, decimals);
                message += `${typeEmoji} ${typeText} <b>${amount} ${tx.tokenSymbol}</b>\n`;
            }

            const otherAddress = isIncoming ? tx.from : tx.to;
            message += `   ${isIncoming ? '从' : '到'}: <code>${shortenAddress(otherAddress)}</code>\n`;
            message += `   ⏰ ${formatTimestamp(tx.timestamp)}\n`;
            message += `   🔗 <a href="https://arbiscan.io/tx/${tx.hash}">查看详情</a>\n\n`;
        }

        await ctx.reply(message, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        await ctx.reply(`❌ 获取交易历史失败: ${(error as Error).message}`);
    }
}

export default composer;

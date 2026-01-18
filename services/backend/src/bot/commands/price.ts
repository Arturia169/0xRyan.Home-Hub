/**
 * /price 命令处理器
 * 查询代币价格
 */

import { Composer } from 'grammy';
import { getTokenPrices, getPriceChanges } from '../../services/price.js';
import { formatAmount, formatPercentChange, getTokenEmoji } from '../../utils/format.js';

const composer = new Composer();

// 支持的代币列表
const SUPPORTED_TOKENS = ['ETH', 'TRX', 'USDT', 'USDC', 'ARB', 'BTC'];

composer.command('price', async (ctx) => {
    const tokenArg = ctx.match?.toString().trim().toUpperCase();

    if (tokenArg && SUPPORTED_TOKENS.includes(tokenArg)) {
        // 查询单个代币价格
        await ctx.reply('⏳ 正在查询价格...');

        const priceData = await getPriceChanges([tokenArg]);
        const data = priceData[tokenArg];

        if (!data) {
            await ctx.reply(`❌ 无法获取 ${tokenArg} 价格`);
            return;
        }

        const tokenEmoji = getTokenEmoji(tokenArg);
        const changeEmoji = data.change24h >= 0 ? '📈' : '📉';

        const message = `
${tokenEmoji} <b>${tokenArg} 价格</b>

💵 <b>当前价格:</b> $${formatAmount(data.price, 4)}
${changeEmoji} <b>24h 涨跌:</b> ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
    `;

        await ctx.reply(message.trim(), { parse_mode: 'HTML' });
    } else {
        // 查询所有代币价格
        await ctx.reply('⏳ 正在查询所有代币价格...');

        const priceData = await getPriceChanges(SUPPORTED_TOKENS);

        let message = '💵 <b>代币价格行情</b>\n\n';

        for (const symbol of SUPPORTED_TOKENS) {
            const data = priceData[symbol];
            if (!data) continue;

            const tokenEmoji = getTokenEmoji(symbol);
            const changeStr = data.change24h >= 0
                ? `<b>+${data.change24h.toFixed(2)}%</b> 📈`
                : `<b>${data.change24h.toFixed(2)}%</b> 📉`;

            message += `${tokenEmoji} <b>${symbol}</b>\n`;
            message += `   $${formatAmount(data.price, data.price < 1 ? 6 : 2)} | ${changeStr}\n`;
        }

        message += `\n⏰ 数据来源: CoinGecko`;

        await ctx.reply(message, { parse_mode: 'HTML' });
    }
});

// 处理价格查询回调
composer.callbackQuery('menu:price', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '正在查询...' });

    const priceData = await getPriceChanges(SUPPORTED_TOKENS);

    let message = '💵 <b>代币价格行情</b>\n\n';

    for (const symbol of SUPPORTED_TOKENS) {
        const data = priceData[symbol];
        if (!data) continue;

        const tokenEmoji = getTokenEmoji(symbol);
        const changeStr = data.change24h >= 0
            ? `+${data.change24h.toFixed(2)}% 📈`
            : `${data.change24h.toFixed(2)}% 📉`;

        message += `${tokenEmoji} <b>${symbol}</b>: $${formatAmount(data.price, data.price < 1 ? 6 : 2)} (${changeStr})\n`;
    }

    message += `\n⏰ 数据来源: CoinGecko`;

    await ctx.reply(message, { parse_mode: 'HTML' });
});

export default composer;

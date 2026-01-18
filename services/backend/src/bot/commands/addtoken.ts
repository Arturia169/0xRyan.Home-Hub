import { Composer } from 'grammy';
import { addCustomToken, getCustomTokensByChain } from '../../database/queries.js';
import { getChainService, isValidAddress } from '../../chains/index.js';
import { ChainType, chainConfigs } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

const composer = new Composer();
const log = logger.child('AddTokenCommand');

composer.command('addtoken', async (ctx) => {
    const args = ctx.match?.split(' ').filter(arg => arg.trim() !== '') || [];

    // 帮助信息
    if (args.length < 2) {
        await ctx.reply(
            '➕ <b>添加自定义代币</b>\n\n' +
            '使用方法：<code>/addtoken &lt;链&gt; &lt;合约地址&gt; [CoinGecko ID]</code>\n\n' +
            '示例：\n' +
            '<code>/addtoken arbitrum 0x123...456</code> (自动获取名称)\n' +
            '<code>/addtoken arbitrum 0x123...456 pepe</code> (指定价格ID)\n\n' +
            '支持的链：arbitrum, tron',
            { parse_mode: 'HTML' }
        );
        return;
    }

    const chain = args[0].toLowerCase() as ChainType;
    const address = args[1];
    const coingeckoId = args[2] || undefined;

    // 1. 验证链
    if (!['arbitrum', 'tron'].includes(chain)) {
        await ctx.reply(`❌ 不支持的链类型: ${chain}\n目前支持: arbitrum, tron`);
        return;
    }

    // 2. 验证地址
    if (!isValidAddress(chain, address)) {
        await ctx.reply(`❌ 无效的 ${chain} 地址: ${address}`);
        return;
    }

    // 3. 检查是否为系统预设代币
    const isSystemToken = chainConfigs[chain].tokens.some(t => t.address.toLowerCase() === address.toLowerCase());
    if (isSystemToken) {
        await ctx.reply('⚠ 该代币已在系统默认列表中，无需重复添加。');
        return;
    }

    // 4. 检查是否已存在于自定义列表
    const existing = getCustomTokensByChain(chain).find(t => t.address.toLowerCase() === address.toLowerCase());
    if (existing) {
        await ctx.reply(`⚠ 该代币已存在: ${existing.symbol} (${existing.name})`);
        return;
    }

    const loadingMsg = await ctx.reply('🔍 正在链上查询代币信息...');

    try {
        const service = getChainService(chain);
        const info = await service.getTokenInfo(address);

        if (!info) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ 无法从链上获取代币信息，请检查合约地址是否正确。');
            return;
        }

        // 保存到数据库
        const newToken = addCustomToken({
            chain,
            address,
            symbol: info.symbol,
            name: info.name,
            decimals: info.decimals,
            coingecko_id: coingeckoId
        });

        await ctx.api.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            `✅ <b>代币添加成功！</b>\n\n` +
            `🔹 符号: <code>${newToken.symbol}</code>\n` +
            `🔸 名称: ${newToken.name}\n` +
            `💎 精度: ${newToken.decimals}\n` +
            `🔗 链: ${chain}\n` +
            (coingeckoId ? `💰 价格ID: ${coingeckoId}\n` : '⚠️ 未配置价格ID (仅监控数量)\n') +
            `\n现在你可以监控该代币的余额了。`,
            { parse_mode: 'HTML' }
        );

        log.info(`用户 ${ctx.from?.id} 添加了自定义代币 ${newToken.symbol} (${chain})`);

    } catch (error) {
        log.error('添加自定义代币失败:', error);
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, `❌ 添加失败: ${(error as Error).message}`);
    }
});

export default composer;

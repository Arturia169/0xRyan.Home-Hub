/**
 * /add 命令处理器
 * 添加监控钱包
 */

import { Composer } from 'grammy';
import { chainSelectKeyboard } from '../keyboards.js';
import { getOrCreateUser, addWallet, getWalletByAddress } from '../../database/queries.js';
import { isValidAddress, detectChainType, normalizeAddress } from '../../chains/index.js';
import type { ChainType } from '../../config/index.js';
import { shortenAddress, getChainEmoji } from '../../utils/format.js';

const composer = new Composer();

// 存储用户的添加钱包会话状态
const addWalletSessions = new Map<number, {
    chain?: ChainType;
    address?: string;
    label?: string;
    step: 'chain' | 'address' | 'label';
}>();

composer.command('add', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const args = ctx.match?.toString().trim().split(/\s+/) || [];

    // 如果提供了完整参数：/add <链> <地址> [标签]
    if (args.length >= 2) {
        const chainArg = args[0].toLowerCase();
        const address = args[1];
        const label = args.slice(2).join(' ') || undefined;

        // 解析链类型
        let chain: ChainType;
        if (chainArg === 'arb' || chainArg === 'arbitrum') {
            chain = 'arbitrum';
        } else if (chainArg === 'tron' || chainArg === 'trx') {
            chain = 'tron';
        } else {
            await ctx.reply('❌ 无效的链类型。请使用 <code>arb</code> 或 <code>tron</code>', {
                parse_mode: 'HTML',
            });
            return;
        }

        // 验证地址
        if (!isValidAddress(chain, address)) {
            await ctx.reply('❌ 无效的钱包地址格式', { parse_mode: 'HTML' });
            return;
        }

        // 添加钱包
        await addWalletToDb(ctx, user.id, chain, address, label);
        return;
    }

    // 如果只提供了地址，尝试自动检测链类型
    if (args.length === 1) {
        const address = args[0];
        const detectedChain = detectChainType(address);

        if (detectedChain && isValidAddress(detectedChain, address)) {
            await addWalletToDb(ctx, user.id, detectedChain, address);
            return;
        }
    }

    // 交互式添加
    addWalletSessions.set(user.id, { step: 'chain' });

    await ctx.reply(
        '➕ <b>添加监控钱包</b>\n\n请选择区块链网络：',
        {
            parse_mode: 'HTML',
            reply_markup: chainSelectKeyboard(),
        }
    );
});

// 处理链选择回调
composer.callbackQuery(/^chain:(.+)$/, async (ctx) => {
    const user = ctx.from;
    const chain = ctx.match[1] as ChainType;

    addWalletSessions.set(user.id, { chain, step: 'address' });

    await ctx.editMessageText(
        `➕ <b>添加监控钱包</b>\n\n` +
        `${getChainEmoji(chain)} 已选择: <b>${chain === 'arbitrum' ? 'Arbitrum One' : 'Tron'}</b>\n\n` +
        `请发送要监控的钱包地址：`,
        { parse_mode: 'HTML' }
    );
    await ctx.answerCallbackQuery();
});

// 处理地址输入
composer.on('message:text', async (ctx, next) => {
    const user = ctx.from;
    if (!user) return next();

    const session = addWalletSessions.get(user.id);
    if (!session || session.step !== 'address') return next();

    const address = ctx.message.text.trim();

    // 验证地址
    if (!isValidAddress(session.chain!, address)) {
        await ctx.reply(
            `❌ 无效的 ${session.chain === 'arbitrum' ? 'Arbitrum' : 'Tron'} 地址格式\n` +
            `请重新发送正确的地址：`,
            { parse_mode: 'HTML' }
        );
        return;
    }

    session.address = address;
    session.step = 'label';
    addWalletSessions.set(user.id, session);

    await ctx.reply(
        `✅ 地址验证通过: <code>${shortenAddress(address)}</code>\n\n` +
        `请为这个钱包设置一个标签（可选，发送 /skip 跳过）：`,
        { parse_mode: 'HTML' }
    );
});

// 处理标签输入
composer.on('message:text', async (ctx, next) => {
    const user = ctx.from;
    if (!user) return next();

    const session = addWalletSessions.get(user.id);
    if (!session || session.step !== 'label') return next();

    let label: string | undefined;
    if (ctx.message.text.trim() !== '/skip') {
        label = ctx.message.text.trim();
    }

    // 添加钱包
    await addWalletToDb(ctx, user.id, session.chain!, session.address!, label);

    // 清除会话
    addWalletSessions.delete(user.id);
});

// 处理 /skip 命令
composer.command('skip', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const session = addWalletSessions.get(user.id);
    if (!session || session.step !== 'label') return;

    // 添加钱包（无标签）
    await addWalletToDb(ctx, user.id, session.chain!, session.address!);

    // 清除会话
    addWalletSessions.delete(user.id);
});

// 添加钱包到数据库的辅助函数
async function addWalletToDb(
    ctx: any,
    telegramId: number,
    chain: ChainType,
    address: string,
    label?: string
): Promise<void> {
    try {
        // 规范化地址格式
        const normalizedAddress = normalizeAddress(chain, address);

        // 获取或创建用户
        const dbUser = getOrCreateUser(telegramId, ctx.from.username, ctx.from.first_name);

        // 检查是否已存在
        const existing = getWalletByAddress(dbUser.id, normalizedAddress);
        if (existing) {
            await ctx.reply(
                `⚠️ 该钱包地址已在监控列表中\n` +
                `标签: ${existing.label || '无'}`,
                { parse_mode: 'HTML' }
            );
            return;
        }

        // 添加钱包
        const wallet = addWallet({
            userId: dbUser.id,
            chain,
            address: normalizedAddress,
            label,
        });

        const chainEmoji = getChainEmoji(chain);
        const chainName = chain === 'arbitrum' ? 'Arbitrum One' : 'Tron';

        await ctx.reply(
            `✅ <b>钱包添加成功！</b>\n\n` +
            `${chainEmoji} <b>链:</b> ${chainName}\n` +
            `📍 <b>地址:</b> <code>${shortenAddress(normalizedAddress)}</code>\n` +
            `🏷️ <b>标签:</b> ${label || '无'}\n\n` +
            `💡 已开始监控此钱包，有余额变化时会通知你。\n` +
            `使用 /balance ${shortenAddress(normalizedAddress, 10, 0)} 查询余额`,
            { parse_mode: 'HTML' }
        );
    } catch (error: any) {
        await ctx.reply(`❌ 添加失败: ${error.message}`);
    }
}

// 取消操作
composer.callbackQuery('cancel', async (ctx) => {
    addWalletSessions.delete(ctx.from.id);
    await ctx.editMessageText('❌ 操作已取消');
    await ctx.answerCallbackQuery();
});

export default composer;

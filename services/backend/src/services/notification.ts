/**
 * 通知服务模块
 * 负责格式化和发送各类通知消息
 */

import type { Bot } from 'grammy';
import type { ChainType } from '../config/index.js';
import { chainConfigs } from '../config/index.js';
import {
    shortenAddress,
    formatAmount,
    formatUSD,
    formatTimestamp,
    getChainEmoji,
    getTokenEmoji,
    escapeHTML,
} from '../utils/format.js';
import { logger } from '../utils/logger.js';
import { formatAddressWithLabel } from '../utils/labels.js';

const log = logger.child('Notification');

// Bot 实例引用
let botInstance: Bot | null = null;

/**
 * 设置 Bot 实例（用于发送消息）
 */
export function setBotInstance(bot: Bot): void {
    botInstance = bot;
}

/**
 * 发送消息到指定用户
 */
export async function sendMessage(
    telegramId: number,
    message: string,
    options?: { parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' }
): Promise<void> {
    if (!botInstance) {
        log.error('Bot 实例未设置');
        return;
    }

    try {
        await botInstance.api.sendMessage(telegramId, message, {
            parse_mode: options?.parse_mode || 'HTML',
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        log.error(`发送消息失败: ${telegramId}`, error);
    }
}

/**
 * 发送图片到指定用户
 */
export async function sendPhoto(
    telegramId: number,
    photo: string,
    options?: { caption?: string; parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' }
): Promise<void> {
    if (!botInstance) {
        log.error('Bot 实例未设置');
        return;
    }

    try {
        await botInstance.api.sendPhoto(telegramId, photo, {
            caption: options?.caption,
            parse_mode: options?.parse_mode || 'HTML',
        });
    } catch (error) {
        log.error(`发送图片失败: ${telegramId}`, error);
    }
}

/**
 * 交易通知接口
 */
export interface TransactionAlert {
    chain: ChainType;
    walletAddress: string;
    walletLabel?: string;
    type: 'in' | 'out';
    tokenSymbol: string;
    amount: string;
    amountFormatted: string;
    valueUsd?: number;
    from: string;
    to: string;
    txHash: string;
    timestamp: number;
}

/**
 * 发送交易通知
 */
export async function sendTransactionAlert(
    telegramId: number,
    alert: TransactionAlert
): Promise<void> {
    const chainConfig = chainConfigs[alert.chain];
    const chainEmoji = getChainEmoji(alert.chain);
    const tokenEmoji = getTokenEmoji(alert.tokenSymbol);
    const typeEmoji = alert.type === 'in' ? '📥' : '📤';
    const typeText = alert.type === 'in' ? '转入' : '转出';

    const walletName = alert.walletLabel ? escapeHTML(alert.walletLabel) : shortenAddress(alert.walletAddress);
    const explorerUrl = `${chainConfig.explorer}/tx/${alert.txHash}`;

    let message = `${typeEmoji} <b>交易${typeText}通知</b>\n\n`;
    message += `${chainEmoji} <b>链:</b> ${chainConfig.name}\n`;
    message += `👛 <b>钱包:</b> ${walletName}\n`;
    message += `${tokenEmoji} <b>代币:</b> ${alert.tokenSymbol}\n`;
    message += `💰 <b>数量:</b> ${alert.amountFormatted}`;

    if (alert.valueUsd) {
        message += ` (${formatUSD(alert.valueUsd)})`;
    }
    message += '\n';

    if (alert.type === 'in') {
        message += `📤 <b>来自:</b> <code>${formatAddressWithLabel(alert.from, alert.chain)}</code>\n`;
    } else {
        message += `📥 <b>发送至:</b> <code>${formatAddressWithLabel(alert.to, alert.chain)}</code>\n`;
    }

    message += `⏰ <b>时间:</b> ${formatTimestamp(alert.timestamp)}\n`;
    message += `\n🔗 <a href="${explorerUrl}">查看交易详情</a>`;

    await sendMessage(telegramId, message);
}

/**
 * 余额告警接口
 */
export interface BalanceAlert {
    chain: ChainType;
    walletAddress: string;
    walletLabel?: string;
    tokenSymbol: string;
    currentBalance: string;
    threshold: number;
    alertType: 'below' | 'above';
}

/**
 * 发送余额告警
 */
export async function sendBalanceAlert(
    telegramId: number,
    alert: BalanceAlert
): Promise<void> {
    const chainConfig = chainConfigs[alert.chain];
    const chainEmoji = getChainEmoji(alert.chain);
    const tokenEmoji = getTokenEmoji(alert.tokenSymbol);
    const alertEmoji = alert.alertType === 'below' ? '🔻' : '🔺';
    const alertText = alert.alertType === 'below' ? '低于' : '高于';

    const walletName = alert.walletLabel ? escapeHTML(alert.walletLabel) : shortenAddress(alert.walletAddress);

    let message = `${alertEmoji} <b>余额告警</b>\n\n`;
    message += `${chainEmoji} <b>链:</b> ${chainConfig.name}\n`;
    message += `👛 <b>钱包:</b> ${walletName}\n`;
    message += `${tokenEmoji} <b>代币:</b> ${alert.tokenSymbol}\n`;
    message += `💰 <b>当前余额:</b> ${alert.currentBalance}\n`;
    message += `⚠️ <b>告警条件:</b> ${alertText} ${formatAmount(alert.threshold, 2)}\n`;

    await sendMessage(telegramId, message);
}

/**
 * 发送余额变化通知
 */
export async function sendBalanceChangeNotification(
    telegramId: number,
    chain: ChainType,
    walletAddress: string,
    walletLabel: string | undefined,
    tokenSymbol: string,
    oldBalance: string,
    newBalance: string,
    valueUsd?: number
): Promise<void> {
    const chainConfig = chainConfigs[chain];
    const chainEmoji = getChainEmoji(chain);
    const tokenEmoji = getTokenEmoji(tokenSymbol);

    // 计算变化
    const oldNum = parseFloat(oldBalance.replace(/,/g, '')) || 0;
    const newNum = parseFloat(newBalance.replace(/,/g, '')) || 0;
    const change = newNum - oldNum;
    const changeEmoji = change >= 0 ? '📈' : '📉';
    const changeSign = change >= 0 ? '+' : '';

    const walletName = walletLabel ? escapeHTML(walletLabel) : shortenAddress(walletAddress);

    let message = `${changeEmoji} <b>余额变化通知</b>\n\n`;
    message += `${chainEmoji} <b>链:</b> ${chainConfig.name}\n`;
    message += `👛 <b>钱包:</b> ${walletName}\n`;
    message += `${tokenEmoji} <b>代币:</b> ${tokenSymbol}\n`;
    message += `📊 <b>变化:</b> ${changeSign}${formatAmount(change, 4)}\n`;
    message += `💰 <b>当前余额:</b> ${newBalance}`;

    if (valueUsd) {
        message += ` (${formatUSD(valueUsd)})`;
    }

    await sendMessage(telegramId, message);
}

/**
 * 发送鲸鱼交易告警
 */
export async function sendWhaleAlert(
    telegramId: number,
    chain: ChainType,
    tokenSymbol: string,
    amount: string,
    valueUsd: number,
    txHash: string,
    from: string,
    to: string
): Promise<void> {
    const chainConfig = chainConfigs[chain];
    const chainEmoji = getChainEmoji(chain);
    const tokenEmoji = getTokenEmoji(tokenSymbol);
    const explorerUrl = `${chainConfig.explorer}/tx/${txHash}`;

    let message = `🐋 <b>鲸鱼交易告警</b>\n\n`;
    message += `${chainEmoji} <b>链:</b> ${chainConfig.name}\n`;
    message += `${tokenEmoji} <b>代币:</b> ${tokenSymbol}\n`;
    message += `💰 <b>数量:</b> ${formatAmount(amount, 2)} (${formatUSD(valueUsd)})\n`;
    message += `📤 <b>从:</b> <code>${formatAddressWithLabel(from, chain)}</code>\n`;
    message += `📥 <b>到:</b> <code>${formatAddressWithLabel(to, chain)}</code>\n`;
    message += `\n🔗 <a href="${explorerUrl}">查看交易详情</a>`;

    await sendMessage(telegramId, message);
}

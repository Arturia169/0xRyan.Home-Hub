/**
 * 通知服务模块
 * 负责格式化和发送各类通知消息
 */

import type { Bot } from 'grammy';
import { logger } from '../utils/logger.js';

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
 * 系统状态通知（占位，以后可扩展）
 */
export async function sendSystemNotification(telegramId: number, content: string): Promise<void> {
    await sendMessage(telegramId, `🔴 <b>系统通知</b>\n\n${content}`);
}

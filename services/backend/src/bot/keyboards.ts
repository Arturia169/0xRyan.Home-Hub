import { InlineKeyboard } from 'grammy';
import type { ChainType } from '../config/index.js';
import config from '../config/index.js';

/**
 * 创建链选择键盘
 */
export function chainSelectKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('🔵 Arbitrum One', 'chain:arbitrum')
        .text('🔴 Tron', 'chain:tron');
}

/**
 * 创建代币选择键盘
 */
export function tokenSelectKeyboard(chain: ChainType): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    if (chain === 'arbitrum') {
        keyboard
            .text('💎 ETH', 'token:ETH')
            .text('💲 USDC', 'token:USDC')
            .row()
            .text('💵 USDT', 'token:USDT')
            .text('🔵 ARB', 'token:ARB');
    } else if (chain === 'tron') {
        keyboard
            .text('🔴 TRX', 'token:TRX')
            .text('💲 USDC', 'token:USDC')
            .row()
            .text('💵 USDT', 'token:USDT');
    }

    keyboard.row().text('❌ 取消', 'cancel');

    return keyboard;
}

/**
 * 创建确认键盘
 */
export function confirmKeyboard(
    confirmCallback: string,
    cancelCallback: string = 'cancel'
): InlineKeyboard {
    return new InlineKeyboard()
        .text('✅ 确认', confirmCallback)
        .text('❌ 取消', cancelCallback);
}

/**
 * 创建钱包操作键盘
 */
export function walletActionsKeyboard(walletId: number): InlineKeyboard {
    return new InlineKeyboard()
        .text('💰 查看余额', `wallet:balance:${walletId}`)
        .text('⚠️ 设置告警', `wallet:alert:${walletId}`)
        .row()
        .text('✏️ 修改标签', `wallet:label:${walletId}`)
        .text('🗑️ 删除', `wallet:delete:${walletId}`);
}

/**
 * 创建返回主菜单键盘
 */
export function backToMenuKeyboard(): InlineKeyboard {
    return new InlineKeyboard().text('🏠 返回主菜单', 'menu:main');
}

/**
 * 创建主菜单键盘
 */
export function mainMenuKeyboard(): InlineKeyboard {
    const webAppUrl = config.telegram.webappUrl || 'https://t.me';
    const keyboard = new InlineKeyboard();

    // Telegram 要求 Web App 必须使用 HTTPS
    if (webAppUrl.startsWith('https://')) {
        keyboard.webApp('💎 控制面板', webAppUrl);
    } else {
        keyboard.url('💎 控制面板 (需浏览器)', webAppUrl);
    }

    return keyboard
        .row()
        .text('➕ 添加钱包', 'menu:add')
        .text('📋 我的钱包', 'menu:list')
        .row()
        .text('📊 资产分布统计', 'menu:stats')
        .text('💰 全资产汇总', 'menu:summary')
        .row()
        .text('💵 查询价格', 'menu:price')
        .text('⚠️ 告警设置', 'menu:alerts');
}

/**
 * 创建告警类型选择键盘
 */
export function alertTypeKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('🔻 低于阈值告警', 'alertType:below')
        .text('🔺 高于阈值告警', 'alertType:above')
        .row()
        .text('❌ 取消', 'cancel');
}

/**
 * 创建分页键盘
 */
export function paginationKeyboard(
    currentPage: number,
    totalPages: number,
    callbackPrefix: string
): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    if (currentPage > 1) {
        keyboard.text('⬅️ 上一页', `${callbackPrefix}:${currentPage - 1}`);
    }

    keyboard.text(`${currentPage}/${totalPages}`, 'noop');

    if (currentPage < totalPages) {
        keyboard.text('➡️ 下一页', `${callbackPrefix}:${currentPage + 1}`);
    }

    return keyboard;
}

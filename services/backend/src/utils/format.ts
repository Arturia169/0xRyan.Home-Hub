/**
 * 格式化工具模块
 * 提供地址、金额、时间等格式化函数
 */

/**
 * 缩短区块链地址显示
 * 例如: 0x1234...5678
 * @param address 完整地址
 * @param prefixLength 前缀长度，默认 6
 * @param suffixLength 后缀长度，默认 4
 */
export function shortenAddress(
    address: string,
    prefixLength: number = 6,
    suffixLength: number = 4
): string {
    if (!address) return '';
    if (address.length <= prefixLength + suffixLength + 3) {
        return address;
    }
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * 格式化金额显示（添加千分位分隔符）
 * @param amount 金额数值
 * @param decimals 保留小数位数，默认 4
 */
export function formatAmount(amount: number | string, decimals: number = 4): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) return '0';

    // 处理非常小的数字
    if (Math.abs(num) < 0.0001 && num !== 0) {
        return num.toExponential(2);
    }

    // 格式化为指定精度
    const fixed = num.toFixed(decimals);

    // 添加千分位分隔符
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // 移除末尾的零
    if (parts[1]) {
        parts[1] = parts[1].replace(/0+$/, '');
        if (parts[1] === '') {
            return parts[0];
        }
    }

    return parts.join('.');
}

/**
 * 格式化 USD 金额
 * @param amount 金额
 */
export function formatUSD(amount: number): string {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${formatAmount(amount, 2)}`;
}

/**
 * 格式化代币余额
 * @param balance 原始余额（最小单位）
 * @param decimals 代币精度
 */
export function formatTokenBalance(balance: bigint | string, decimals: number): string {
    const balanceStr = balance.toString();
    const divisor = BigInt(10 ** decimals);
    const balanceBigInt = BigInt(balanceStr);

    const integerPart = balanceBigInt / divisor;
    const remainder = balanceBigInt % divisor;

    // 将余数转换为小数部分
    const decimalPart = remainder.toString().padStart(decimals, '0');

    // 格式化整数部分
    const formattedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // 保留有效小数位（最多4位）
    const significantDecimals = decimalPart.slice(0, 4).replace(/0+$/, '');

    if (significantDecimals === '') {
        return formattedInteger;
    }

    return `${formattedInteger}.${significantDecimals}`;
}

/**
 * 格式化时间戳为可读格式
 * @param timestamp Unix 时间戳（秒或毫秒）
 */
export function formatTimestamp(timestamp: number): string {
    // 如果是秒级时间戳，转换为毫秒
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);

    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

/**
 * 格式化相对时间（多久之前）
 * @param timestamp Unix 时间戳（秒或毫秒）
 */
export function formatRelativeTime(timestamp: number): string {
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const now = Date.now();
    const diff = now - ms;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return `${seconds} 秒前`;
}

/**
 * 格式化百分比变化
 * @param change 变化百分比
 */
export function formatPercentChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    const emoji = change >= 0 ? '📈' : '📉';
    return `${emoji} ${sign}${change.toFixed(2)}%`;
}

/**
 * 转义 HTML 特殊字符，用于 Telegram HTML 消息
 * @param text 待转义的文本
 */
export function escapeHTML(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * 获取链的 Emoji 图标
 */
export function getChainEmoji(chain: string): string {
    const chainEmojis: Record<string, string> = {
        arbitrum: '🔵',
        tron: '🔴',
        ethereum: '💎',
        bsc: '💛',
        polygon: '💜',
    };
    return chainEmojis[chain.toLowerCase()] || '🔗';
}

/**
 * 获取代币的 Emoji 图标
 */
export function getTokenEmoji(symbol: string): string {
    const tokenEmojis: Record<string, string> = {
        ETH: '💎',
        TRX: '🔴',
        USDT: '💵',
        USDC: '💲',
        ARB: '🔵',
        BTC: '🟠',
    };
    return tokenEmojis[symbol.toUpperCase()] || '🪙';
}

/**
 * 标签管理工具
 * 存储已知的交易所、协议等公共地址标签
 */

import type { ChainType } from '../config/index.js';

interface AddressLabel {
    address: string;
    label: string;
    chain: ChainType;
}

// 已知公共地址列表
const PUBLIC_LABELS: AddressLabel[] = [
    // --- Tron 交易所 ---
    { address: 'TNDS46vXskFvpxG3h9v5it5VzK82n6D5xG', label: 'Binance Hot Wallet', chain: 'tron' },
    { address: 'TMuA6YrubeExsUhyNLwsS4SCyzlcGcv9wD', label: 'Binance Hot Wallet 2', chain: 'tron' },
    { address: 'TE2RwwRMStandardpY1v6L9xpxr7JmXk', label: 'Binance Staking', chain: 'tron' },
    { address: 'TPBZax9Xcsasas9Xcsasas9Xcsasas9X', label: 'OKX Hot Wallet', chain: 'tron' }, // 示例
    { address: 'TYf689v3zic6B7E1Bf5m4WwX7U1T3TzYyV', label: 'Huobi Hot Wallet', chain: 'tron' },

    // --- Arbitrum 交易所 & 协议 ---
    { address: '0x0000000000000000000000000000000000000000', label: 'Null Address (Burn)', chain: 'arbitrum' },
    { address: '0x47c031236e17e0E067CF296EaE74f88102B51fc7', label: 'Binance Hot Wallet', chain: 'arbitrum' },
    { address: '0x1F98431c8aD98523631AE4a59f267346ea31F984', label: 'Uniswap V3', chain: 'arbitrum' },
    { address: '0xabbc444c3b265079a1c02b16911ad31ac4032d1e', label: 'GMX: Vault', chain: 'arbitrum' }
];

/**
 * 识别地址标签
 * @param address 原始地址
 * @param chain 链类型
 * @returns 识别到的标签，未识别返回 null
 */
export function getAddressLabel(address: string, chain: ChainType): string | null {
    if (!address) return null;

    // 规范化搜索地址
    const searchAddr = chain === 'arbitrum' ? address.toLowerCase() : address;

    const found = PUBLIC_LABELS.find(item => {
        const itemAddr = item.chain === 'arbitrum' ? item.address.toLowerCase() : item.address;
        return item.chain === chain && itemAddr === searchAddr;
    });

    return found ? found.label : null;
}

/**
 * 格式化地址（带标签识别）
 * @param address 原始地址
 * @param chain 链类型
 * @param shorten 是否在无标签时缩短地址
 */
export function formatAddressWithLabel(address: string, chain: ChainType, shorten: boolean = true): string {
    const label = getAddressLabel(address, chain);
    if (label) {
        return `🏦 ${label}`;
    }

    if (shorten) {
        // 调用原有的缩短逻辑
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    return address;
}

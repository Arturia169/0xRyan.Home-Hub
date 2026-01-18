/**
 * Telegram Mini App 验证工具
 */

import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * 验证 Telegram 初始化数据
 * @param initData 原始 initData 字符串
 */
export function validateInitData(initData: string): { isValid: boolean; userId?: number } {
    try {
        const urlParams = new URL(`http://localhost?${initData}`).searchParams;
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // 按键名排序
        const paramsArray: string[] = [];
        const entries = Array.from((urlParams as any).entries()) as [string, string][];

        entries.sort(([a], [b]) => a.localeCompare(b)).forEach(([key, value]) => {
            paramsArray.push(`${key}=${value}`);
        });

        const paramsStr = paramsArray.join('\n');

        // 计算 secret key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(config.telegram.botToken)
            .digest();

        // 计算 hash 签名
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(paramsStr)
            .digest('hex');

        if (signature !== hash) {
            return { isValid: false };
        }

        // 解析用户信息
        const userJson = urlParams.get('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            return { isValid: true, userId: user.id };
        }

        return { isValid: true }; // 校验通过但无用户信息
    } catch (error) {
        return { isValid: false };
    }
}

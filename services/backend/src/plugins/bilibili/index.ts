/**
 * Bilibili 插件
 * 监控直播间开播状态
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { Subscription } from '../../core/types.js';
import axios from 'axios';
import {
    getAllBilibiliStreamers,
    updateBilibiliStreamerStatus,
    addBilibiliStreamer,
    removeBilibiliStreamer
} from '../../database/queries.js';
import { BilibiliStreamer } from '../../database/models.js';

interface BilibiliLiveInfo {
    room_id: number;
    title: string;
    live_status: number; // 0:未开播, 1:直播中, 2:轮播中
    user_cover: string;
    online: number;
    live_time: string;
    parent_area_name: string;
    area_name: string;
}

export class BilibiliPlugin extends BasePlugin {
    name = 'bilibili';
    label = 'B站直播';
    interval = 60 * 1000; // 1分钟

    async addSubscription(userId: number, target: string, name?: string): Promise<any> {
        // 先检查 target 是否是纯数字
        if (!/^\d+$/.test(target)) {
            throw new Error('房间号必须是数字');
        }

        // 尝试获取直播间信息以验证有效性
        const info = await this.getRoomInfo(target);
        if (!info) {
            throw new Error('未找到该直播间，请确认房间号是否正确');
        }

        // 存入数据库 (addBilibiliStreamer 内部逻辑是传入 telegramId，因为 queries.ts 之前修过了)
        // 注意：addBilibiliStreamer 签名是 addBilibiliStreamer(telegramId, roomId, uid?, name?)
        // 我们通过 API 无法直接拿到 uid，暂时留空
        return addBilibiliStreamer(userId, target, undefined, name || undefined);
    }

    async removeSubscription(userId: number, target: string): Promise<boolean> {
        return removeBilibiliStreamer(userId, target);
    }

    async getSubscriptions(userId: number): Promise<Subscription[]> {
        const streamers = getAllBilibiliStreamers().filter(s => s.telegram_id === userId);
        return streamers.map(s => ({
            id: s.id!,
            userId: s.telegram_id,
            targetId: s.room_id,
            name: s.name,
            extra: {
                isLive: s.is_live === 1,
                lastTitle: s.last_title
            }
        }));
    }

    protected async checkUpdates(): Promise<void> {
        const streamers = getAllBilibiliStreamers();
        if (streamers.length === 0) return;

        // 去重房间号，避免重复检查
        const uniqueRooms = new Set(streamers.map(s => s.room_id));

        for (const roomId of uniqueRooms) {
            // 简单的速率限制
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const info = await this.getRoomInfo(roomId);
                if (!info) continue;

                // 找到该房间的所有订阅记录
                const subs = streamers.filter(s => s.room_id === roomId);

                // 检查每个订阅的状态
                for (const sub of subs) {
                    // 状态变化：从非直播 -> 直播
                    if (sub.is_live !== 1 && info.live_status === 1) {
                        await this.sendLiveNotification(sub, info);
                    }

                    // 更新数据库
                    if (sub.is_live !== info.live_status || sub.last_title !== info.title) {
                        updateBilibiliStreamerStatus(
                            sub.id!,
                            info.live_status,
                            info.title,
                            info.user_cover
                        );
                    }
                }
            } catch (error) {
                this.log.error(`检查房间 ${roomId} 出错:`, error);
            }
        }
    }

    /**
     * 获取直播间信息
     */
    private async getRoomInfo(roomId: string): Promise<BilibiliLiveInfo | null> {
        try {
            const response = await axios.get(`https://uapis.cn/api/v1/social/bilibili/liveroom`, {
                params: { room_id: roomId },
                timeout: 10000
            });
            if (response.data && response.data.room_id) {
                return response.data;
            }
            return null;
        } catch (error: any) {
            // this.log.error(`获取直播信息失败 ${roomId}: ${error.message}`);
            return null;
        }
    }

    /**
     * 发送开播通知
     */
    private async sendLiveNotification(sub: BilibiliStreamer & { telegram_id: number }, info: BilibiliLiveInfo) {
        const message = `
📺 <b>${sub.name || '主播'} 开播啦！</b>

📝 <b>标题</b>: ${info.title}
👀 <b>人气</b>: ${info.online}
🏷 <b>分区</b>: ${info.parent_area_name} - ${info.area_name}
⏰ <b>时间</b>: ${info.live_time}

<a href="https://live.bilibili.com/${sub.room_id}">👉 点击进入直播间</a>
`;

        // 调用基类的 notify 方法
        await this.notify(sub.telegram_id, message, info.user_cover, `https://live.bilibili.com/${sub.room_id}`);
    }
}

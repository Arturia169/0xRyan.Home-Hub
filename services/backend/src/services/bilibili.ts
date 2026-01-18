/**
 * Bilibili 直播监控服务
 * 轮询接口检查开播状态
 */

import axios from 'axios';
import { setInterval, clearInterval, setTimeout } from 'node:timers';
import { logger } from '../utils/logger.js';
import { sendMessage, sendPhoto } from './notification.js';
import {
    getAllBilibiliStreamers,
    updateBilibiliStreamerStatus,
    addBilibiliStreamer
} from '../database/queries.js';
import type { BilibiliStreamer } from '../database/models.js';

const log = logger.child('BilibiliService');
const CHECK_INTERVAL = 60 * 1000; // 1分钟检查一次

interface BilibiliLiveInfo {
    uid: number;
    room_id: number;
    short_id: number;
    name?: string; // API 不直接返回名字，需要单独获取或用户提供
    area_name: string;
    parent_area_name: string;
    background: string;
    title: string;
    user_cover: string;
    live_status: number; // 0:未开播, 1:直播中, 2:轮播中
    live_time: string;
    online: number;
    tags: string;
}

export class BilibiliService {
    private timer: ReturnType<typeof setInterval> | null = null;
    private isRunning = false;

    /**
     * 获取直播间信息
     */
    async getRoomInfo(roomId: string): Promise<BilibiliLiveInfo | null> {
        try {
            // 使用 uapis.cn 接口
            const response = await axios.get(`https://uapis.cn/api/v1/social/bilibili/liveroom`, {
                params: { room_id: roomId },
                timeout: 10000
            });

            if (response.data && response.data.room_id) {
                return response.data;
            }
            return null;
        } catch (error: any) {
            log.error(`获取直播间信息失败: ${roomId}`, error.message);
            return null;
        }
    }

    /**
     * 启动监控服务
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        log.info('Bilibili 监控服务已启动');

        // 立即执行一次
        this.checkAllStreamers();

        // 设置定时器
        this.timer = setInterval(() => {
            this.checkAllStreamers();
        }, CHECK_INTERVAL);
    }

    /**
     * 停止监控服务
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        log.info('Bilibili 监控服务已停止');
    }

    /**
     * 检查所有主播状态
     */
    private async checkAllStreamers() {
        try {
            const streamers = getAllBilibiliStreamers();
            if (streamers.length === 0) return;

            // 使用 Set 去重，避免同一个房间号重复检查
            const checkedRooms = new Set<string>();

            for (const streamer of streamers) {
                if (checkedRooms.has(streamer.room_id)) continue;
                checkedRooms.add(streamer.room_id);

                await this.checkStreamer(streamer);

                // 简单的防速率限制
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            log.error('检查直播状态出错:', error);
        }
    }

    /**
     * 检查单个主播
     */
    private async checkStreamer(streamer: BilibiliStreamer & { telegram_id: number }) {
        const info = await this.getRoomInfo(streamer.room_id);
        if (!info) return;

        // 状态发生变化：从非直播变为直播
        if (streamer.is_live !== 1 && info.live_status === 1) {
            await this.notifyLive(streamer, info);
        }

        // 更新数据库中的状态
        if (streamer.is_live !== info.live_status || streamer.last_title !== info.title) {
            updateBilibiliStreamerStatus(
                streamer.id,
                info.live_status,
                info.title,
                info.user_cover
            );
        }
    }

    /**
     * 发送开播通知
     */
    private async notifyLive(streamer: BilibiliStreamer & { telegram_id: number }, info: BilibiliLiveInfo) {
        try {
            // 查找订阅了该房间的所有用户
            const allStreamers = getAllBilibiliStreamers();
            const subscribers = allStreamers.filter(s => s.room_id === streamer.room_id);

            const message = `
📺 <b>${streamer.name || '主播'} 开播啦！</b>

📝 <b>标题</b>: ${info.title}
👀 <b>人气</b>: ${info.online}
🏷 <b>分区</b>: ${info.parent_area_name} - ${info.area_name}
⏰ <b>时间</b>: ${info.live_time}

<a href="https://live.bilibili.com/${streamer.room_id}">👉 点击进入直播间</a>
`;

            for (const sub of subscribers) {
                try {
                    // 优先发送封面图
                    if (info.user_cover) {
                        await sendPhoto(sub.telegram_id, info.user_cover, {
                            caption: message,
                            parse_mode: 'HTML'
                        });
                    } else {
                        await sendMessage(sub.telegram_id, message, {
                            parse_mode: 'HTML'
                        });
                    }
                } catch (error: any) {
                    log.error(`发送通知失败 (用户 ${sub.telegram_id}):`, error.message);
                }
            }

            log.info(`发送开播通知: ${streamer.name} (${streamer.room_id})`);

        } catch (error) {
            log.error('发送通知过程出错:', error);
        }
    }
}

// 导出单例
export const bilibiliService = new BilibiliService();

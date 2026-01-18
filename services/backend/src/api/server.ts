/**
 * API 服务器
 * 为 Telegram Mini App 提供数据
 */

import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { validateInitData } from './auth.js';
import { getUserDashboardData } from '../services/dashboard.js';
import { getSystemStats } from '../services/system.js';
import { getAllUsers } from '../database/queries.js';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = logger.child('APIServer');

const app = fastify({
    logger: false
});

/**
 * 启动服务器
 */
export async function startServer() {
    try {
        // 1. 注册插件
        await app.register(fastifyCors, {
            origin: true
        });

        // 2. 静态文件服务 (指向前端构建目录)
        // 注意：构建后的文件在 dashboard/dist
        const publicPath = path.join(__dirname, '../../dashboard/dist');
        await app.register(fastifyStatic, {
            root: publicPath,
            prefix: '/',
        });

        // 3. 路由

        // 检查服务状态
        app.get('/health', async () => {
            return { status: 'ok', version: '1.0.0' };
        });

        // 获取看板数据
        app.get('/api/dashboard', async (request: any, reply: any) => {
            const initData = request.headers['x-telegram-init-data'] as string;

            log.info('Dashboard API 请求:', {
                hasInitData: !!initData,
                initDataLength: initData?.length || 0,
                userAgent: request.headers['user-agent']
            });

            if (!initData) {
                log.warn('缺少 Telegram init data');
                return reply.status(401).send({ error: 'Missing Telegram init data' });
            }

            const { isValid, userId } = validateInitData(initData);

            log.info('InitData 验证结果:', { isValid, userId });

            if (!isValid || !userId) {
                log.warn('InitData 验证失败:', { isValid, userId });
                return reply.status(403).send({ error: 'Invalid authentication' });
            }

            try {
                log.info(`获取用户 ${userId} 的 Dashboard 数据`);
                const data = await getUserDashboardData(userId);
                log.info('Dashboard 数据:', {
                    intelligenceCount: data.intelligence.length,
                    bilibiliCount: data.bilibili?.length || 0
                });
                return data;
            } catch (error: any) {
                log.error('Fetch dashboard data failed:', error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        });

        // ==================== Cyber Home 专用接口 ====================
        app.get('/api/home-dashboard', async (request: any, reply: any) => {
            const apiKey = request.headers['x-api-key'] as string;

            if (!config.homeDashboardApiKey || apiKey !== config.homeDashboardApiKey) {
                log.warn('Cyber Home API Auth Failed:', { providedKey: !!apiKey });
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            try {
                // 默认取第一个用户的数据 (私有项目通常只有一个用户)
                const users = getAllUsers();
                if (users.length === 0) {
                    return reply.status(404).send({ error: 'No user found' });
                }

                const userId = users[0].telegram_id;
                log.info(`Cyber Home 请求完整数据, Target User: ${userId}`);

                const [dashboardData, systemStats] = await Promise.all([
                    getUserDashboardData(userId),
                    getSystemStats()
                ]);

                return {
                    ...dashboardData,
                    system: systemStats
                };
            } catch (error: any) {
                log.error('Cyber Home API Error:', error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        });
        // ==========================================================

        // 临时调试端点 - 不需要验证
        app.get('/api/debug-info', async (request: any, reply: any) => {
            const initData = request.headers['x-telegram-init-data'] as string;

            try {
                const { isValid, userId } = validateInitData(initData || '');

                return {
                    debug: true,
                    hasInitData: !!initData,
                    initDataPreview: initData ? initData.substring(0, 50) + '...' : null,
                    validation: { isValid, userId },
                    timestamp: new Date().toISOString()
                };
            } catch (error: any) {
                return {
                    debug: true,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });

        // 数据库调试端点
        app.get('/api/debug-db', async (request: any, reply: any) => {
            try {
                const { getAllUsers, getAllWallets } = await import('../database/queries.js');

                const users = getAllUsers();
                const wallets = getAllWallets();

                return {
                    debug: true,
                    users: users,
                    wallets: wallets.map(w => ({
                        id: w.id,
                        user_id: w.user_id,
                        chain: w.chain,
                        address: w.address.substring(0, 10) + '...',
                        label: w.label
                    })),
                    timestamp: new Date().toISOString()
                };
            } catch (error: any) {
                return {
                    debug: true,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });

        // 4. 监听
        const port = 3000;
        await app.listen({ port, host: '0.0.0.0' });
        log.info(`API 服务器已启动: http://localhost:${port}`);

    } catch (error) {
        log.error('API 服务器启动失败:', error);
        throw error;
    }
}

/**
 * 停止服务器
 */
export async function stopServer() {
    await app.close();
    log.info('API 服务器已停止');
}

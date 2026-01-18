import process from 'node:process';
import { config, validateConfig } from './config/index.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { startBot, stopBot } from './bot/index.js';
import { startServer, stopServer } from './api/server.js';
// import { youtubeService } from './services/youtube.js';
import { twitterService } from './services/twitter.js';
import { logger } from './utils/logger.js';
import { pluginManager } from './core/PluginManager.js';

const log = logger.child('Main');

/**
 * 程序启动
 */
async function main() {
    log.info('====================================');
    log.info('  赛博基地情报中心启动中...');
    log.info('  功能: B站/YouTube/社媒情报监听');
    log.info('====================================');

    try {
        // 验证配置
        log.info('1. 验证配置...');
        validateConfig();
        log.info('   ✅ 配置验证通过');

        // 初始化数据库
        log.info('2. 初始化数据库...');
        initDatabase();
        log.info('   ✅ 数据库初始化完成');

        // 启动 Telegram Bot
        log.info('3. 启动 Telegram Bot...');
        await startBot();
        log.info('   ✅ Bot 启动成功');

        // 启动 API 服务器 (Cyber Home 后台)
        log.info('4. 启动 API 服务器...');
        await startServer();
        log.info('   ✅ API 服务器启动成功');

        // 初始化并启动插件
        log.info('5. 加载插件系统...');
        await pluginManager.initAll();
        pluginManager.startAll();
        log.info('   ✅ 插件系统已就绪');

        // 启动旧版监控服务 (逐步迁移中)
        log.info('6. 启动旧版监控 (Twitter)...');
        // youtubeService.start();
        twitterService.start();
        log.info('   ✅ 监控服务已运行 (Twitter)');

        log.info('====================================');
        log.info('  🤖 情报中心运行中');
        log.info('====================================');

    } catch (error) {
        log.error('启动失败:', error);
        process.exit(1);
    }
}

/**
 * 优雅关闭
 */
async function shutdown() {
    log.info('\n正在关闭情报中心...');

    try {
        // 停止监控服务
        pluginManager.stopAll();
        // youtubeService.stop();
        twitterService.stop();

        // 停止 Bot
        await stopBot();

        // 停止 API 服务器
        await stopServer();

        // 关闭数据库
        closeDatabase();

        log.info('已安全退出');
        process.exit(0);
    } catch (error) {
        log.error('关闭时出错:', error);
        process.exit(1);
    }
}

// 监听退出信号
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 未捕获的异常处理
process.on('uncaughtException', (error: any) => {
    log.error('未捕获的异常:', error);
    shutdown();
});

process.on('unhandledRejection', (reason: any) => {
    log.error('未处理的 Promise 拒绝:', reason);
});

// 启动程序
main();

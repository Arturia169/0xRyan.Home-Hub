/**
 * 日志工具模块
 * 提供统一的日志输出格式
 */

import config from '../config/index.js';

/**
 * 日志级别枚举
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志级别优先级映射
 */
const logLevelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * 日志级别对应的颜色和图标
 */
const logStyles: Record<LogLevel, { icon: string; color: string }> = {
    debug: { icon: '🔍', color: '\x1b[90m' },  // 灰色
    info: { icon: '📘', color: '\x1b[36m' },   // 青色
    warn: { icon: '⚠️', color: '\x1b[33m' },   // 黄色
    error: { icon: '❌', color: '\x1b[31m' },  // 红色
};

// 重置颜色
const resetColor = '\x1b[0m';

/**
 * 获取当前时间戳字符串
 */
function getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 获取当前配置的日志级别
 */
function getCurrentLogLevel(): LogLevel {
    const level = config.logLevel.toLowerCase() as LogLevel;
    return logLevelPriority[level] !== undefined ? level : 'info';
}

/**
 * 检查是否应该输出该级别的日志
 */
function shouldLog(level: LogLevel): boolean {
    const currentLevel = getCurrentLogLevel();
    return logLevelPriority[level] >= logLevelPriority[currentLevel];
}

/**
 * 格式化日志消息
 */
function formatMessage(level: LogLevel, message: string, context?: string): string {
    const { icon, color } = logStyles[level];
    const timestamp = getTimestamp();
    const contextStr = context ? `[${context}] ` : '';
    return `${color}${icon} [${timestamp}] [${level.toUpperCase()}] ${contextStr}${message}${resetColor}`;
}

/**
 * 日志记录器类
 */
class Logger {
    private context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    /**
     * 创建带上下文的日志记录器
     */
    child(context: string): Logger {
        return new Logger(context);
    }

    /**
     * Debug 级别日志
     */
    debug(message: string, ...args: unknown[]): void {
        if (shouldLog('debug')) {
            console.log(formatMessage('debug', message, this.context), ...args);
        }
    }

    /**
     * Info 级别日志
     */
    info(message: string, ...args: unknown[]): void {
        if (shouldLog('info')) {
            console.log(formatMessage('info', message, this.context), ...args);
        }
    }

    /**
     * Warn 级别日志
     */
    warn(message: string, ...args: unknown[]): void {
        if (shouldLog('warn')) {
            console.warn(formatMessage('warn', message, this.context), ...args);
        }
    }

    /**
     * Error 级别日志
     */
    error(message: string, ...args: unknown[]): void {
        if (shouldLog('error')) {
            console.error(formatMessage('error', message, this.context), ...args);
        }
    }
}

// 导出默认日志记录器实例
export const logger = new Logger();

export default logger;

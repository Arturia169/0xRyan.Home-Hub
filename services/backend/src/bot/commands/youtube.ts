/**
 * YouTube 相关命令
 */

import { Context } from 'grammy';
import { pluginManager } from '../../core/PluginManager.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('Bot:YouTube');

/**
 * 添加 YouTube 频道
 * 格式: /addyt <channel_id 或 @handle> [可选名称]
 */
export async function addYoutube(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/addyt <频道ID或@用户名> [自定义名称]`\n\n例如: `/addyt UCxxxxxx 某个频道` 或 `/addyt @username 某人`', { parse_mode: 'Markdown' });
        return;
    }

    let channelInput = args[0];
    const name = args.slice(1).join(' ');
    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('youtube');
        if (!plugin) return ctx.reply('❌ 插件未加载');

        // 如果输入的是 @handle 格式，需要转换成真实的频道 ID
        let channelId = channelInput;
        let channelName = name || channelInput;

        if (channelInput.startsWith('@')) {
            await ctx.reply('🔍 检测到 Handle 格式，正在获取真实频道 ID...');

            try {
                const axios = (await import('axios')).default;
                const handle = channelInput.replace('@', '');
                const url = `https://www.youtube.com/@${handle}`;

                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 10000
                });

                // 尝试多种匹配模式
                let match = response.data.match(/"channelId":"(UC[^"]+)"/);
                if (!match) {
                    match = response.data.match(/"externalId":"(UC[^"]+)"/);
                }
                if (!match) {
                    match = response.data.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
                }
                if (!match) {
                    // 尝试从 meta 标签提取
                    match = response.data.match(/<meta itemprop="channelId" content="(UC[^"]+)">/);
                }

                if (match && match[1]) {
                    channelId = match[1];
                    // 如果没有自定义名称，尝试提取频道标题
                    if (!name) {
                        const titleMatch = response.data.match(/<title>([^<]+)<\/title>/);
                        if (titleMatch && titleMatch[1]) {
                            channelName = titleMatch[1].replace(' - YouTube', '').trim();
                        }
                    }
                    await ctx.reply(`✅ 已找到频道 ID: <code>${channelId}</code>`, { parse_mode: 'HTML' });
                } else {
                    // 记录部分响应内容用于调试
                    log.warn(`无法提取频道 ID，Handle: ${handle}, 响应长度: ${response.data.length}`);
                    throw new Error('无法从页面中提取频道 ID。\n\n💡 提示：请尝试直接使用频道 ID，或检查用户名拼写是否正确');
                }
            } catch (error: any) {
                if (error.code === 'ECONNABORTED') {
                    await ctx.reply(`❌ 连接超时，请检查网络或代理设置`);
                } else if (error.response?.status === 404) {
                    await ctx.reply(`❌ 频道不存在，请检查用户名是否正确：${channelInput}`);
                } else {
                    await ctx.reply(`❌ Handle 转换失败: ${error.message}\n\n💡 提示：您也可以直接使用频道 ID (UCxxxxxx 格式)`);
                }
                return;
            }
        }

        await plugin.addSubscription(userId, channelId, channelName);
        await ctx.reply(`✅ 成功订阅 YouTube 频道: <b>${channelName}</b>\nID: <code>${channelId}</code>`, { parse_mode: 'HTML' });
        log.info(`用户 ${userId} 添加 YouTube 订阅: ${channelId}`);

    } catch (error: any) {
        await ctx.reply(`❌ 添加失败: ${error.message}`);
    }
}

/**
 * 移除 YouTube 频道
 */
export async function removeYoutube(ctx: Context) {
    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
        await ctx.reply('⚠️ 使用方法: `/removeyt <channel_id>`', { parse_mode: 'Markdown' });
        return;
    }

    const channelId = args[0];
    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('youtube');
        if (!plugin) return ctx.reply('❌ 插件未加载');

        const success = await plugin.removeSubscription(userId, channelId);
        if (success) {
            await ctx.reply(`🗑️ 已取消订阅 YouTube 频道: ${channelId}`);
        } else {
            await ctx.reply('⚠️ 未找到该频道的订阅记录');
        }
    } catch (error: any) {
        await ctx.reply(`❌ 移除失败: ${error.message}`);
    }
}

/**
 * 列出所有订阅 (保留用于单独命令，虽然已有 /list)
 */
export async function listYoutube(ctx: Context) {
    const userId = ctx.from!.id;

    try {
        const plugin = pluginManager.get('youtube');
        if (!plugin) return;

        const channels = await plugin.getSubscriptions(userId);

        if (channels.length === 0) {
            await ctx.reply('📭 你还没有订阅任何 YouTube 频道');
            return;
        }

        let message = '📺 <b>YouTube 订阅列表:</b>\n\n';
        channels.forEach((c, index) => {
            message += `${index + 1}. <b>${c.name || c.targetId}</b>\n`;
            message += `   ID: <code>${c.targetId}</code>\n`;
            message += '\n';
        });

        await ctx.reply(message, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
    } catch (e) { console.error(e); }
}

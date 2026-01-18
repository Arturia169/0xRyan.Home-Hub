/**
 * 回调查询处理器
 * 处理 Inline Keyboard 的点击事件
 */
import { Composer, InlineKeyboard } from 'grammy';
import { listAll } from '../commands/list.js';
import { pluginManager } from '../../core/PluginManager.js';
import { YoutubePlugin } from '../../plugins/youtube/index.js';

const callbackHandler = new Composer();

// 引导添加订阅 (目前只是文本提示)
callbackHandler.callbackQuery('add_bili_guide', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('请发送命令添加订阅：\n<code>/addbili &lt;房间号&gt;</code>', { parse_mode: 'HTML' });
});

callbackHandler.callbackQuery('add_yt_guide', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('请发送命令添加订阅：\n<code>/addyt &lt;频道ID&gt; [名称]</code>', { parse_mode: 'HTML' });
});

callbackHandler.callbackQuery('add_tw_guide', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('请发送命令添加订阅：\n<code>/addtw &lt;用户名&gt; [名称]</code>', { parse_mode: 'HTML' });
});

callbackHandler.callbackQuery('add_gh_guide', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('请发送命令添加订阅：\n<code>/addgh &lt;owner/repo&gt;</code>', { parse_mode: 'HTML' });
});

// 列表查询 (复用 list 指令逻辑)
// 注意：listAll 原本是 CommandHandler，接受 Context。这里是 CallbackQuery Context。
// 我们需要适配一下，或者 listAll 内部逻辑得兼容。
// listAll 内部用了 ctx.reply，这在 CallbackQuery 下也是可以的。
// 但 listAll 内部如果用了 ctx.message.text 可能会报错。
// 让我们检查一下 listAll -> 它是直接 ctx.reply，没有依赖 text。可以复用。

callbackHandler.callbackQuery(['list_bili', 'list_tw', 'list_gh', 'list_all'], async (ctx) => {
    await ctx.answerCallbackQuery();
    // 这里简单粗暴都调用 listAll 展示所有，后续可以拆分只展示特定平台的 list
    await listAll(ctx);
});

// YouTube 专属列表 (带获取最新按钮)
callbackHandler.callbackQuery('list_yt', async (ctx) => {
    await ctx.answerCallbackQuery();
    await listYoutubeWithButtons(ctx);
});

async function listYoutubeWithButtons(ctx: any) {
    const userId = ctx.from!.id;
    const ytPlugin = pluginManager.get('youtube') as YoutubePlugin;
    if (!ytPlugin) return;

    const subs = await ytPlugin.getSubscriptions(userId);
    if (subs.length === 0) {
        return ctx.reply('📭 您还没有订阅任何 YouTube 频道');
    }

    let message = '🎬 <b>YouTube 订阅管理</b>\n\n您可以点击下方按钮直接获取最新动态：\n';
    const keyboard = new InlineKeyboard();

    subs.forEach((s, index) => {
        message += `${index + 1}. ${s.name || s.targetId}\n`;
        // callback_data 限制 64 字节，channelId 是 24 字节，fetch_yt_latest: 是一段前缀，够用
        keyboard.text(`🔄 ${s.name || s.targetId.substring(0, 10)}`, `fetch_yt_latest:${s.targetId}`).row();
    });

    keyboard.text('🔙 返回', 'menu_main');

    await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
    });
}

// 处理“获取最新”请求
callbackHandler.callbackQuery(/^fetch_yt_latest:(.+)$/, async (ctx) => {
    const channelId = ctx.match[1];
    const userId = ctx.from!.id;

    await ctx.answerCallbackQuery({ text: '正在获取最新动态...' });

    const ytPlugin = pluginManager.get('youtube') as YoutubePlugin;
    if (!ytPlugin) return;

    const success = await ytPlugin.fetchAndNotifyLatest(userId, channelId);
    if (!success) {
        await ctx.reply('❌ 获取最新动态失败，请稍后再试（可能是网络波动或频道无动态）。');
    }
});

// 关闭菜单
callbackHandler.callbackQuery('close_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
});

export { callbackHandler };

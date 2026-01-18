/**
 * 回调查询处理器
 * 处理 Inline Keyboard 的点击事件
 */
import { Composer } from 'grammy';
import { listAll } from '../commands/list.js';

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

callbackHandler.callbackQuery(['list_bili', 'list_yt', 'list_tw', 'list_gh', 'list_all'], async (ctx) => {
    await ctx.answerCallbackQuery();
    // 这里简单粗暴都调用 listAll 展示所有，后续可以拆分只展示特定平台的 list
    // 为了省事，v3.1 先展示所有
    await listAll(ctx);
});

// 关闭菜单
callbackHandler.callbackQuery('close_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
});

export { callbackHandler };

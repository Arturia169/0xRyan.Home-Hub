/**
 * 菜单响应处理器
 * 处理底部 Reply Keyboard 的点击事件
 */
import { Composer, Context } from 'grammy';
import { biliMenu, ytMenu, twMenu, ghMenu, userMenu } from '../keyboards.js';
import { getUserByTelegramId } from '../../database/queries.js';

const menuHandler = new Composer();

// B站直播
menuHandler.hears('📺 B站直播', async (ctx) => {
    await ctx.reply('📺 <b>Bilibili 情报中心</b>\n\n请选择操作：', {
        parse_mode: 'HTML',
        reply_markup: biliMenu
    });
});

// YouTube
menuHandler.hears('🎬 YouTube', async (ctx) => {
    await ctx.reply('🎬 <b>YouTube 情报中心</b>\n\n请选择操作：', {
        parse_mode: 'HTML',
        reply_markup: ytMenu
    });
});

// Twitter
menuHandler.hears('🐦 Twitter', async (ctx) => {
    await ctx.reply('🐦 <b>Twitter/X 情报中心</b>\n\n请选择操作：', {
        parse_mode: 'HTML',
        reply_markup: twMenu
    });
});

// GitHub
menuHandler.hears('🐙 GitHub', async (ctx) => {
    await ctx.reply('🐙 <b>GitHub 情报中心</b>\n\n请选择操作：', {
        parse_mode: 'HTML',
        reply_markup: ghMenu
    });
});

// 个人中心
menuHandler.hears('👤 个人中心', async (ctx) => {
    const user = getUserByTelegramId(ctx.from!.id);
    const role = user?.role || 'user';

    // 简单的统计 (暂时用伪数据或后续从DB查)
    // 这里为了响应速度，先只显示用户信息
    const msg = `
👤 <b>个人中心</b>

🆔 <b>ID:</b> <code>${ctx.from!.id}</code>
📛 <b>用户:</b> ${ctx.from!.first_name}
🔐 <b>权限:</b> ${role.toUpperCase()}
    `;

    await ctx.reply(msg, {
        parse_mode: 'HTML',
        reply_markup: userMenu
    });
});

// 帮助
menuHandler.hears('❓ 帮助', async (ctx) => {
    // 复用之前的 help 逻辑，这里简单回复
    // 实际应该调用 help 命令的 handler，或者让 help 命令也挂载在这里
    // 简单起见，可以触发 /help 命令
    // 但 grammy 中间件通常是独立的，这里直接回复文案比较好，或者让 index.ts 路由处理
    // 这里我们先不处理，因为 index.ts 里已经注册了 command('help')，Grammy 会优先匹配 command ? 
    // 不，text hear 优先级通常依赖注册顺序。
    // 我们在这里处理掉吧。

    // 手动触发 help 命令逻辑比较麻烦，直接回复
    await ctx.reply('📖 请发送 /help 查看详细命令列表。', {
        reply_markup: { remove_keyboard: false } // 保持键盘
    });
});

export { menuHandler };

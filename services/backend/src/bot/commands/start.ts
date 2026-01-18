/**
 * /start 命令处理器
 * 显示欢迎消息和功能介绍
 */

import { Composer, Context } from 'grammy';
import { mainMenu } from '../keyboards.js';
import { getOrCreateUser } from '../../database/queries.js';

const composer = new Composer();

composer.command('start', async (ctx: Context) => {
  const user = ctx.from;
  if (!user) return;

  // 创建或获取用户
  getOrCreateUser(user.id, user.username, user.first_name);

  const welcomeMessage = `
🤖 <b>欢迎来到 0xRyan.Home.Hub！</b>

我是你的全源情报助手，实时监控 B站、YouTube、Twitter 等平台的关键动态。

<b>📺 支持平台：</b>
• <b>Bilibili</b> - 主播开播提醒
• <b>YouTube</b> - 频道新视频推送
• <b>Twitter/X</b> - 用户推文监控

<b>🛠️ 快速开始：</b>
/list - 查看所有订阅
/addbili - 添加 B站 直播监控
/addyt - 添加 YouTube 频道
/addtw - 添加 Twitter 用户
/help - 查看完整命令列表
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: mainMenu
  });
});

composer.command('help', async (ctx: Context) => {
  const helpMessage = `
📖 <b>使用帮助</b>

<b>📋 查看订阅：</b>
/list
  查看所有平台的订阅列表

<b>📺 B站 监控管理：</b>
/addbili &lt;房间号&gt;
  例: /addbili 22637261
  
/removebili &lt;房间号&gt;
  取消对指定房间的监控

<b>🎬 YouTube 频道监控：</b>
/addyt &lt;频道ID或@用户名&gt; [自定义名称]
  例: /addyt @thirteennn013 拾参 Thirteen
  
/removeyt &lt;频道ID&gt;
  取消订阅指定频道

<b>🐦 Twitter/X 用户监控：</b>
/addtw &lt;用户名&gt; [自定义名称]
  例: /addtw @elonmusk 马斯克
  
/removetw &lt;用户名&gt;
  取消订阅指定用户

<b>❓ 其他：</b>
/start - 回到主菜单
/help - 显示此帮助
  `;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});

export default composer;

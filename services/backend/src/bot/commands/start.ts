/**
 * /start 命令处理器
 * 显示欢迎消息和功能介绍
 */

import { Composer } from 'grammy';
import { mainMenuKeyboard } from '../keyboards.js';
import { getOrCreateUser, getUserStats } from '../../database/queries.js';

const composer = new Composer();

composer.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  // 创建或获取用户
  getOrCreateUser(user.id, user.username, user.first_name);

  const welcomeMessage = `
🤖 <b>欢迎使用虚拟钱包监控机器人！</b>

我可以帮助你实时监控区块链钱包的资产变化。

<b>📋 支持的功能：</b>
• 🔵 <b>Arbitrum One</b> - ETH、USDC、USDT、ARB
• 🔴 <b>Tron</b> - TRX、USDC、USDT

<b>🛠️ 可用命令：</b>
/add - 添加监控钱包
/list - 查看所有钱包并管理（支持重命名）
/summary - <b>全链资产快照汇总</b>
/stats - 资产分布统计
/balance - 查询实时余额
/price - 查询代币价格
/alert - 设置余额告警
/help - 帮助信息

<b>💡 快速开始：</b>
点击下方按钮开始使用，或直接发送 /add 添加第一个钱包
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard(),
  });
});

composer.command('help', async (ctx) => {
  const helpMessage = `
📖 <b>使用帮助</b>

<b>📦 钱包管理：</b>
/add &lt;链&gt; &lt;地址&gt; [标签]
  添加新钱包到监控列表
  链: arb（Arbitrum）或 tron
  例: /add arb 0x1234... 我的钱包

/list
  查看所有监控中的钱包（可管理、重命名）

/summary
  查看全链资产估值汇总（强烈推荐）

/stats
  查看资产分布饼图统计（估算值）

/remove &lt;地址&gt;
  从监控列表移除钱包

<b>💰 余额查询：</b>
/balance [地址]
  查询钱包余额（不指定地址则查询所有）

/price [代币]
  查询代币价格
  例: /price eth

<b>⚠️ 告警设置：</b>
/alert &lt;地址&gt; &lt;代币&gt; &lt;阈值&gt;
  设置余额告警
  例: /alert 0x1234... ETH 0.1

<b>📊 统计功能：</b>
/stats
  查看资产统计汇总

<b>❓ 其他：</b>
/start - 回到主菜单
/help - 显示此帮助
  `;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});

export default composer;

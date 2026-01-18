/**
 * 键盘布局定义
 */
import { Keyboard, InlineKeyboard } from 'grammy';

// ==================== 主菜单 (Reply Keyboard) ====================

// 底部常驻菜单
export const mainMenu = new Keyboard()
    .text('📺 B站直播').text('🎬 YouTube').row()
    .text('🐦 Twitter').text('🐙 GitHub').row()
    .text('👤 个人中心').text('❓ 帮助')
    .resized() // 自动调整大小
    .persistent(); // 总是显示

// ==================== 子菜单 (Inline Keyboard) ====================

// 通用返回按钮
const backBtn = { text: '🔙 返回主菜单', callback_data: 'menu_main' };

// B站菜单
export const biliMenu = new InlineKeyboard()
    .text('➕ 新增订阅', 'add_bili_guide').text('📋 我的列表', 'list_bili').row()
    .url('🔗 前往 Bilibili', 'https://www.bilibili.com');

// YouTube 菜单
export const ytMenu = new InlineKeyboard()
    .text('➕ 新增订阅', 'add_yt_guide').text('📋 我的列表', 'list_yt').row()
    .url('🔗 前往 YouTube', 'https://www.youtube.com');

// Twitter 菜单
export const twMenu = new InlineKeyboard()
    .text('➕ 新增订阅', 'add_tw_guide').text('📋 我的列表', 'list_tw').row()
    .url('🔗 前往 Twitter', 'https://twitter.com');

// GitHub 菜单
export const ghMenu = new InlineKeyboard()
    .text('➕ 新增订阅', 'add_gh_guide').text('📋 我的列表', 'list_gh').row()
    .url('🔗 前往 GitHub', 'https://github.com');

// 个人中心菜单
export const userMenu = new InlineKeyboard()
    .text('📋 所有订阅', 'list_all').text('⚙️ 设置 (开发中)', 'settings').row()
    .text('🗑️ 清除菜单', 'close_menu');

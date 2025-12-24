# 快捷键自定义功能说明

## 功能概述

网易云音乐桌面应用现在支持自定义全局快捷键，让你可以在任何应用中控制音乐播放。

## 支持的操作

- **下一首**: 切换到下一首歌曲
- **上一首**: 切换到上一首歌曲
- **播放/暂停**: 切换播放状态
- **音量增加**: 增加音量 10%
- **音量减少**: 减少音量 10%

## 默认快捷键

| 操作 | Windows/Linux | macOS |
|------|--------------|-------|
| 下一首 | Ctrl+Right | Command+Right |
| 上一首 | Ctrl+Left | Command+Left |
| 播放/暂停 | Ctrl+Space | Command+Space |
| 音量增加 | Ctrl+Up | Command+Up |
| 音量减少 | Ctrl+Down | Command+Down |

## 如何自定义快捷键

### 方法 1: 通过菜单

1. 打开应用
2. 点击菜单栏 **文件** > **设置**（或按 `Ctrl/Command+,`）
3. 在设置窗口中点击要修改的快捷键输入框
4. 按下你想要设置的快捷键组合
5. 点击 **保存** 按钮
6. 重启应用使设置生效

### 方法 2: 使用快捷键

直接按 `Ctrl/Command+,` 打开设置窗口

## 快捷键录制说明

- **开始录制**: 点击任意快捷键输入框
- **录制快捷键**: 按下你想要的快捷键组合（例如：Ctrl+Shift+N）
- **清空快捷键**: 在录制状态下按 `Escape` 键
- **取消录制**: 点击输入框外的任意位置

## 支持的按键

### 修饰键
- `Ctrl` / `Control`
- `Alt` / `Option` (macOS)
- `Shift`
- `Command` (macOS)

### 主键
- 字母键: A-Z
- 数字键: 0-9
- 功能键: F1-F12
- 方向键: Up, Down, Left, Right
- 特殊键: Space, Enter, Escape, Tab, Backspace, Delete

### 快捷键格式
快捷键必须包含至少一个修饰键和一个主键，例如：
- ✅ `Ctrl+N`
- ✅ `Ctrl+Shift+P`
- ✅ `Command+Alt+Space`
- ❌ `N` (缺少修饰键)
- ❌ `Ctrl` (缺少主键)

## 冲突检测

设置窗口会自动检测快捷键冲突：
- 如果你设置的快捷键已被其他操作使用，会显示错误提示
- 如果快捷键已被系统占用，注册时会失败（应用启动时会在控制台显示警告）

## 恢复默认设置

在设置窗口中点击 **恢复默认** 按钮，可以将所有快捷键恢复为默认配置。

## 配置文件位置

快捷键配置保存在以下位置：

- **Windows**: `%APPDATA%\netease-music-electron-app\config.json`
- **macOS**: `~/Library/Application Support/netease-music-electron-app/config.json`
- **Linux**: `~/.config/netease-music-electron-app/config.json`

你也可以直接编辑此文件来修改快捷键配置（需要重启应用）。

## 故障排除

### 快捷键不生效

1. 确认快捷键已保存（重启应用后生效）
2. 检查快捷键是否被其他应用占用
3. 查看控制台日志确认快捷键是否注册成功

### 快捷键冲突

如果快捷键与系统或其他应用冲突：
1. 尝试使用不同的快捷键组合
2. 关闭可能占用快捷键的其他应用
3. 在设置中更改为其他快捷键

### 设置窗口无法打开

1. 确认应用已完全启动
2. 尝试重启应用
3. 检查控制台是否有错误信息

## 技术实现

- 使用 Electron 的 `globalShortcut` API 注册全局快捷键
- 使用 `electron-store` 持久化保存配置
- 通过 IPC 通信在主进程和渲染进程间传递控制命令
- 支持跨平台快捷键（自动处理 Windows/Linux 的 Ctrl 和 macOS 的 Command）

## 开发者信息

如需扩展更多快捷键功能，请参考以下文件：
- `src/shortcut-manager.js` - 快捷键管理核心逻辑
- `src/settings-window.js` - 设置窗口创建和 IPC 处理
- `src/settings-renderer.js` - 设置界面交互逻辑
- `src/main.js` - 快捷键注册和处理函数

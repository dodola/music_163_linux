/**
 * 预加载脚本
 * 
 * 此脚本在渲染进程加载之前运行，用于安全地暴露 IPC 功能。
 * 使用 contextBridge 在隔离的上下文中暴露 API，确保安全性。
 * 
 * 安全配置:
 * - contextIsolation: true (在 main.js 中配置)
 * - nodeIntegration: false (在 main.js 中配置)
 * - sandbox: true (在 main.js 中配置)
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * 使用 contextBridge 安全地暴露 IPC API 到渲染进程
 * 
 * 暴露的 API 将在渲染进程中通过 window.electronAPI 访问
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 注册音乐控制消息监听器
   * 
   * @param {Function} callback - 接收音乐控制动作的回调函数
   *                              回调参数: {action: string, timestamp: number}
   * 
   * @example
   * window.electronAPI.onMusicControl((message) => {
   *   console.log('收到控制命令:', message.action);
   * });
   */
  onMusicControl: (callback) => {
    // 使用 ipcRenderer.on 监听来自主进程的 'music-control' 消息
    // 只传递消息内容给回调函数，不暴露 event 对象以增强安全性
    ipcRenderer.on('music-control', (event, message) => {
      callback(message);
    });
  }
});

console.log('预加载脚本已加载，electronAPI 已暴露到渲染进程');

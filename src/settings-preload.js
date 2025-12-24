/**
 * 设置窗口预加载脚本
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  // 获取快捷键配置
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  
  // 保存快捷键配置
  saveShortcuts: (shortcuts) => ipcRenderer.invoke('save-shortcuts', shortcuts),
  
  // 重置快捷键
  resetShortcuts: () => ipcRenderer.invoke('reset-shortcuts'),
  
  // 验证快捷键格式
  validateAccelerator: (accelerator) => ipcRenderer.invoke('validate-accelerator', accelerator),
  
  // 检查快捷键冲突
  checkConflict: (accelerator, excludeAction) => 
    ipcRenderer.invoke('check-accelerator-conflict', { accelerator, excludeAction })
});

console.log('设置窗口预加载脚本已加载');

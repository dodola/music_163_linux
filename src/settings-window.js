/**
 * 设置窗口模块
 * 
 * 创建和管理快捷键设置窗口
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let settingsWindow = null;

/**
 * 创建设置窗口
 */
function createSettingsWindow(parent, shortcutManager) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: parent,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: '快捷键设置',
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

  // 处理获取快捷键配置请求
  ipcMain.handle('get-shortcuts', () => {
    return shortcutManager.getShortcuts();
  });

  // 处理保存快捷键配置请求
  ipcMain.handle('save-shortcuts', (event, shortcuts) => {
    // 验证所有快捷键
    for (const [action, accelerator] of Object.entries(shortcuts)) {
      if (accelerator && accelerator.trim() !== '') {
        const validation = shortcutManager.validateAccelerator(accelerator);
        if (!validation.valid) {
          return { success: false, error: `${action}: ${validation.error}` };
        }
      }
    }

    // 保存配置
    shortcutManager.saveShortcuts(shortcuts);
    return { success: true };
  });

  // 处理重置快捷键请求
  ipcMain.handle('reset-shortcuts', () => {
    return shortcutManager.resetToDefaults();
  });

  // 处理验证快捷键请求
  ipcMain.handle('validate-accelerator', (event, accelerator) => {
    return shortcutManager.validateAccelerator(accelerator);
  });

  // 处理检查快捷键冲突请求
  ipcMain.handle('check-accelerator-conflict', (event, { accelerator, excludeAction }) => {
    return shortcutManager.isAcceleratorInUse(accelerator, excludeAction);
  });

  settingsWindow.on('closed', () => {
    // 清理 IPC 监听器
    ipcMain.removeHandler('get-shortcuts');
    ipcMain.removeHandler('save-shortcuts');
    ipcMain.removeHandler('reset-shortcuts');
    ipcMain.removeHandler('validate-accelerator');
    ipcMain.removeHandler('check-accelerator-conflict');
    
    settingsWindow = null;
  });

  return settingsWindow;
}

module.exports = { createSettingsWindow };

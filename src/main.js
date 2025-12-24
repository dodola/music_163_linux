const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
const ShortcutManager = require('./shortcut-manager');
const { createSettingsWindow } = require('./settings-window');

// electron-store 将在应用准备就绪后动态导入
let Store;
let store;
let shortcutManager;

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow = null;

/**
 * 创建应用主窗口
 * @returns {BrowserWindow} 创建的窗口实例
 */
function createWindow() {
  console.log('[窗口] 开始创建主窗口');
  
  // 从存储中恢复窗口状态，如果不存在则使用默认值
  const defaultWindowState = {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined
  };
  
  const savedWindowState = store.get('windowState', defaultWindowState);
  console.log('[窗口] 恢复窗口状态:', savedWindowState);
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: savedWindowState.width,
    height: savedWindowState.height,
    x: savedWindowState.x,
    y: savedWindowState.y,
    minWidth: 1000,
    minHeight: 670,
    title: '网易云音乐',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 配置 session 以持久化存储
      partition: 'persist:netease-music'
    }
  });

  console.log('[窗口] 主窗口实例已创建');
  console.log('[窗口] 窗口尺寸: ' + savedWindowState.width + 'x' + savedWindowState.height + ', 最小尺寸: 1000x670');
  
  // 配置会话以保持 Cookie 和其他数据
  const session = mainWindow.webContents.session;
  console.log('[会话] 配置会话持久化');
  console.log('[会话] Session partition:', 'persist:netease-music');
  
  // 设置 Cookie 存储路径（使用 userData 目录）
  const userDataPath = app.getPath('userData');
  console.log('[会话] 用户数据路径:', userDataPath);
  
  // 会话将自动持久化 Cookie、localStorage、sessionStorage 等数据
  console.log('[会话] 会话状态持久化已启用');
  
  // 保存窗口状态的函数
  const saveWindowState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    
    const bounds = mainWindow.getBounds();
    const windowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    };
    
    store.set('windowState', windowState);
    console.log('[窗口] 保存窗口状态:', windowState);
  };
  
  // 监听窗口调整大小事件
  mainWindow.on('resize', () => {
    saveWindowState();
  });
  
  // 监听窗口移动事件
  mainWindow.on('move', () => {
    saveWindowState();
  });

  // 加载网易云音乐网页
  console.log('[窗口] 开始加载网易云音乐网页');
  mainWindow.loadURL('https://music.163.com/st/webplayer');

  // 监听网页加载失败事件
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[错误] 页面加载失败`);
    console.error(`  URL: ${validatedURL}`);
    console.error(`  错误代码: ${errorCode}`);
    console.error(`  错误描述: ${errorDescription}`);
    
    // 显示错误消息（可选）
    const errorMessage = `无法加载网易云音乐网页\n\n错误代码: ${errorCode}\n错误描述: ${errorDescription}\n\n请检查网络连接后重试`;
    
    // 在窗口中显示错误页面
    mainWindow.webContents.executeJavaScript(`
      document.body.innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <h1 style="color: #d32f2f; margin-bottom: 20px;">加载失败</h1>
          <p style="color: #666; margin-bottom: 10px;">无法加载网易云音乐网页</p>
          <p style="color: #999; font-size: 14px; margin-bottom: 5px;">错误代码: ${errorCode}</p>
          <p style="color: #999; font-size: 14px; margin-bottom: 30px;">错误描述: ${errorDescription}</p>
          <button onclick="location.reload()" style="padding: 10px 30px; font-size: 16px; background-color: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>
        </div>
      \`;
    `).catch(err => {
      console.error('[错误] 无法显示错误页面:', err);
    });
  });

  // 监听渲染进程崩溃事件
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[错误] 渲染进程崩溃');
    console.error(`  原因: ${details.reason}`);
    console.error(`  退出代码: ${details.exitCode}`);
    
    // 记录崩溃详细信息
    const crashInfo = {
      timestamp: new Date().toISOString(),
      reason: details.reason,
      exitCode: details.exitCode
    };
    console.error('[错误] 崩溃详情:', JSON.stringify(crashInfo, null, 2));
    
    // 如果不是正常退出，自动重新加载页面
    if (details.reason !== 'clean-exit') {
      console.log('[信息] 尝试自动恢复...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
          console.log('[信息] 页面已重新加载');
        }
      }, 1000); // 延迟1秒后重新加载
    }
  });

  // 网页加载完成后注入渲染进程脚本
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[信息] 网页加载完成');
    const fs = require('fs');
    try {
      const rendererScript = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
      mainWindow.webContents.executeJavaScript(rendererScript)
        .then(() => {
          console.log('[信息] 渲染进程脚本已注入');
        })
        .catch((error) => {
          console.error('[错误] 注入渲染进程脚本失败:', error.message);
          console.error('[错误] 错误堆栈:', error.stack);
        });
    } catch (error) {
      console.error('[错误] 读取渲染进程脚本文件失败:', error.message);
      console.error('[错误] 错误堆栈:', error.stack);
    }
  });

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    console.log('[窗口] 主窗口已关闭');
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * 发送音乐控制命令
 */
function sendMusicControl(action) {
  console.log(`[快捷键] 触发"${action}"快捷键`);
  
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    try {
      mainWindow.webContents.send('music-control', {
        action: action,
        timestamp: Date.now()
      });
      console.log(`[IPC] 成功发送"${action}"控制命令`);
    } catch (error) {
      console.error(`[错误] 发送"${action}"控制命令失败:`, error.message);
      console.error('[错误] 错误堆栈:', error.stack);
    }
  } else {
    console.error('[错误] 无法发送 IPC 消息：窗口不可用');
    console.error('[错误] 窗口状态:', {
      exists: !!mainWindow,
      destroyed: mainWindow ? mainWindow.isDestroyed() : 'N/A',
      hasWebContents: mainWindow ? !!mainWindow.webContents : 'N/A'
    });
  }
}

/**
 * 处理"下一首"快捷键事件
 */
function handleNextTrack() {
  sendMusicControl('next');
}

/**
 * 处理"上一首"快捷键事件
 */
function handlePreviousTrack() {
  sendMusicControl('previous');
}

/**
 * 处理"播放/暂停"快捷键事件
 */
function handlePlayPause() {
  sendMusicControl('playPause');
}

/**
 * 处理"音量增加"快捷键事件
 */
function handleVolumeUp() {
  sendMusicControl('volumeUp');
}

/**
 * 处理"音量减少"快捷键事件
 */
function handleVolumeDown() {
  sendMusicControl('volumeDown');
}

/**
 * 注册全局快捷键
 * @returns {boolean} 注册是否成功
 */
function registerGlobalShortcuts() {
  console.log('[快捷键] 开始注册全局快捷键');
  
  const handlers = {
    next: handleNextTrack,
    previous: handlePreviousTrack,
    playPause: handlePlayPause,
    volumeUp: handleVolumeUp,
    volumeDown: handleVolumeDown
  };

  const results = shortcutManager.registerAll(handlers);
  
  // 检查是否全部成功
  const allSuccess = Object.values(results).every(r => r.success);
  console.log(`[快捷键] 快捷键注册${allSuccess ? '完全成功' : '部分失败'}`);
  
  return allSuccess;
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '设置',
          accelerator: 'CommandOrControl+,',
          click: () => {
            createSettingsWindow(mainWindow, shortcutManager);
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CommandOrControl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CommandOrControl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CommandOrControl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CommandOrControl+X', role: 'cut' },
        { label: '复制', accelerator: 'CommandOrControl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CommandOrControl+V', role: 'paste' },
        { label: '全选', accelerator: 'CommandOrControl+A', role: 'selectAll' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '重新加载', accelerator: 'CommandOrControl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CommandOrControl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'CommandOrControl+Shift+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CommandOrControl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CommandOrControl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CommandOrControl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '网易云音乐桌面应用',
              detail: 'Version 1.0.0\n基于 Electron 框架开发'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用生命周期管理

// 当 Electron 完成初始化并准备创建浏览器窗口时调用
app.whenReady().then(async () => {
  console.log('[应用] Electron 已准备就绪');
  console.log('[应用] 平台:', process.platform);
  console.log('[应用] Electron 版本:', process.versions.electron);
  console.log('[应用] Node 版本:', process.versions.node);
  
  // 动态导入 electron-store (ES Module)
  try {
    const ElectronStore = await import('electron-store');
    Store = ElectronStore.default;
    store = new Store();
    console.log('[存储] electron-store 初始化成功');
    
    // 初始化快捷键管理器
    shortcutManager = new ShortcutManager(store);
    console.log('[快捷键] 快捷键管理器初始化成功');
  } catch (error) {
    console.error('[错误] 导入 electron-store 失败:', error.message);
    console.error('[错误] 错误堆栈:', error.stack);
  }
  
  try {
    createWindow();
    console.log('[应用] 主窗口创建成功');
  } catch (error) {
    console.error('[错误] 创建主窗口失败:', error.message);
    console.error('[错误] 错误堆栈:', error.stack);
  }
  
  try {
    createMenu();
    console.log('[应用] 应用菜单创建成功');
  } catch (error) {
    console.error('[错误] 创建应用菜单失败:', error.message);
    console.error('[错误] 错误堆栈:', error.stack);
  }
  
  try {
    registerGlobalShortcuts();
  } catch (error) {
    console.error('[错误] 注册全局快捷键失败:', error.message);
    console.error('[错误] 错误堆栈:', error.stack);
  }

  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，重新创建窗口
  app.on('activate', () => {
    console.log('[应用] 应用被激活');
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[应用] 没有打开的窗口，创建新窗口');
      try {
        createWindow();
      } catch (error) {
        console.error('[错误] 激活时创建窗口失败:', error.message);
        console.error('[错误] 错误堆栈:', error.stack);
      }
    }
  });
}).catch((error) => {
  console.error('[错误] 应用初始化失败:', error.message);
  console.error('[错误] 错误堆栈:', error.stack);
});

// 当所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  console.log('[应用] 所有窗口已关闭');
  // 在 macOS 上，应用通常会保持活动状态，直到用户明确退出
  if (process.platform !== 'darwin') {
    console.log('[应用] 非 macOS 平台，退出应用');
    app.quit();
  } else {
    console.log('[应用] macOS 平台，保持应用运行');
  }
});

// 应用退出前注销所有全局快捷键
app.on('will-quit', () => {
  console.log('[应用] 应用即将退出，清理资源');
  try {
    if (shortcutManager) {
      shortcutManager.unregisterAll();
    } else {
      globalShortcut.unregisterAll();
    }
    console.log('[快捷键] 已注销所有全局快捷键');
  } catch (error) {
    console.error('[错误] 注销快捷键失败:', error.message);
    console.error('[错误] 错误堆栈:', error.stack);
  }
});

module.exports = {
  createWindow,
  registerGlobalShortcuts,
  handleNextTrack,
  handlePreviousTrack,
  handlePlayPause,
  handleVolumeUp,
  handleVolumeDown
};

/**
 * 渲染进程脚本
 * 
 * 负责处理音乐控制逻辑和 DOM 操作
 * 接收来自主进程的 IPC 消息并执行相应的播放控制
 */

/**
 * 初始化音乐控制功能
 * 
 * 注册 IPC 消息监听器，等待网页加载完成后处理音乐控制命令
 * 
 * 需求: 5.2, 4.4
 */
function initializeMusicControl() {
  console.log('初始化音乐控制功能...');

  // 检查 electronAPI 是否可用
  if (typeof window.electronAPI === 'undefined') {
    console.error('electronAPI 未定义，无法初始化音乐控制');
    return;
  }

  // 注册 IPC 消息监听器
  window.electronAPI.onMusicControl((message) => {
    console.log('收到音乐控制消息:', message);

    // 检查网页是否已加载完成
    if (document.readyState === 'complete') {
      executePlayControl(message.action);
    } else {
      console.warn('网页尚未完全加载，忽略控制命令');
    }
  });

  console.log('音乐控制监听器已注册');
}

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMusicControl);
} else {
  // DOM 已经加载完成
  initializeMusicControl();
}


/**
 * 查找播放控制按钮
 * 
 * 使用多个备选选择器提高鲁棒性，应对网页结构变化
 * 
 * @param {string} type - 按钮类型 ('next' | 'previous' | 'playPause' | 'volumeUp' | 'volumeDown')
 * @returns {HTMLElement|null} 找到的按钮元素，未找到则返回 null
 * 
 * 需求: 4.1, 4.2
 */
function findControlButton(type) {
  // 定义备选选择器列表
  const selectors = {
    next: [
      '.btnc-next',           // 常见的下一首按钮类名
      '.m-playbar .next',     // 播放栏中的下一首按钮
      '[title="下一首"]',     // 通过 title 属性查找
      '[aria-label="下一首"]', // 通过 aria-label 查找（无障碍）
      '.icn-next',            // 图标类名
      'a[data-action="next"]' // 通过 data 属性查找
    ],
    previous: [
      '.btnc-prev',           // 常见的上一首按钮类名
      '.m-playbar .prev',     // 播放栏中的上一首按钮
      '[title="上一首"]',     // 通过 title 属性查找
      '[aria-label="上一首"]', // 通过 aria-label 查找（无障碍）
      '.icn-prev',            // 图标类名
      'a[data-action="prev"]' // 通过 data 属性查找
    ],
    playPause: [
      '.btnc-play',           // 播放按钮
      '.btnc-pause',          // 暂停按钮
      '.m-playbar .play',     // 播放栏中的播放按钮
      '[title="播放"]',
      '[title="暂停"]',
      '[aria-label="播放"]',
      '[aria-label="暂停"]',
      'a[data-action="play"]'
    ],
    volumeUp: [
      '.volume-up',
      '[title="音量增加"]',
      '[aria-label="音量增加"]'
    ],
    volumeDown: [
      '.volume-down',
      '[title="音量减少"]',
      '[aria-label="音量减少"]'
    ]
  };

  const selectorList = selectors[type];
  if (!selectorList) {
    console.error(`未知的按钮类型: ${type}`);
    return null;
  }

  // 尝试使用每个选择器查找按钮
  for (const selector of selectorList) {
    try {
      const button = document.querySelector(selector);
      if (button) {
        console.log(`找到 ${type} 按钮，使用选择器: ${selector}`);
        return button;
      }
    } catch (error) {
      console.warn(`选择器 ${selector} 查询失败:`, error.message);
    }
  }

  console.warn(`未找到 ${type} 按钮，尝试了所有选择器`);
  return null;
}

/**
 * 执行播放控制操作
 * 
 * 根据 action 类型查找对应的播放控制按钮并触发点击事件
 * 
 * @param {string} action - 控制动作 ('next' | 'previous' | 'playPause' | 'volumeUp' | 'volumeDown')
 * 
 * 需求: 4.1, 4.2
 */
function executePlayControl(action) {
  console.log(`执行播放控制: ${action}`);

  // 特殊处理音量控制
  if (action === 'volumeUp' || action === 'volumeDown') {
    handleVolumeControl(action);
    return;
  }

  // 查找控制按钮
  const button = findControlButton(action);

  if (button) {
    try {
      // 触发点击事件
      button.click();
      console.log(`成功触发 ${action} 按钮点击`);
    } catch (error) {
      console.error(`点击 ${action} 按钮失败:`, error.message);
    }
  } else {
    console.error(`无法执行 ${action} 操作：未找到控制按钮`);
  }
}

/**
 * 处理音量控制
 * 
 * @param {string} action - 'volumeUp' 或 'volumeDown'
 */
function handleVolumeControl(action) {
  // 尝试查找音量滑块
  const volumeSlider = document.querySelector('.m-playbar .volume input[type="range"]') ||
                       document.querySelector('.volume-slider') ||
                       document.querySelector('input[type="range"][aria-label*="音量"]');

  if (volumeSlider) {
    try {
      const currentVolume = parseInt(volumeSlider.value) || 0;
      const step = 10; // 每次调整 10%
      const newVolume = action === 'volumeUp' 
        ? Math.min(100, currentVolume + step)
        : Math.max(0, currentVolume - step);
      
      volumeSlider.value = newVolume;
      
      // 触发 change 事件
      const event = new Event('input', { bubbles: true });
      volumeSlider.dispatchEvent(event);
      
      console.log(`音量已调整: ${currentVolume}% -> ${newVolume}%`);
    } catch (error) {
      console.error('调整音量失败:', error.message);
    }
  } else {
    console.warn('未找到音量控制元素');
  }
}

/**
 * 设置窗口渲染进程脚本
 */

let currentShortcuts = {};
let recordingInput = null;
let pressedKeys = new Set();

// 按键映射
const keyMap = {
  'Control': 'Ctrl',
  'Meta': 'Command',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
  ' ': 'Space'
};

// 修饰键
const modifiers = ['Control', 'Alt', 'Shift', 'Meta'];

/**
 * 初始化设置界面
 */
async function initialize() {
  try {
    currentShortcuts = await window.settingsAPI.getShortcuts();
    loadShortcuts();
    setupEventListeners();
  } catch (error) {
    console.error('初始化失败:', error);
    showToast('加载设置失败');
  }
}

/**
 * 加载快捷键到输入框
 */
function loadShortcuts() {
  document.querySelectorAll('.shortcut-input').forEach(input => {
    const action = input.dataset.action;
    input.value = currentShortcuts[action] || '';
  });
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 快捷键输入框点击事件
  document.querySelectorAll('.shortcut-input').forEach(input => {
    input.addEventListener('click', () => startRecording(input));
    input.addEventListener('blur', () => stopRecording(input));
  });

  // 保存按钮
  document.getElementById('saveBtn').addEventListener('click', saveShortcuts);

  // 取消按钮
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
  });

  // 重置按钮
  document.getElementById('resetBtn').addEventListener('click', resetShortcuts);

  // 全局键盘事件
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

/**
 * 开始录制快捷键
 */
function startRecording(input) {
  if (recordingInput && recordingInput !== input) {
    stopRecording(recordingInput);
  }

  recordingInput = input;
  input.classList.add('recording');
  input.value = '按下快捷键...';
  pressedKeys.clear();
  clearError(input);
}

/**
 * 停止录制快捷键
 */
function stopRecording(input) {
  if (recordingInput === input) {
    input.classList.remove('recording');
    recordingInput = null;
    pressedKeys.clear();
    
    // 恢复原值
    const action = input.dataset.action;
    input.value = currentShortcuts[action] || '';
  }
}

/**
 * 处理按键按下
 */
function handleKeyDown(event) {
  if (!recordingInput) return;

  event.preventDefault();
  event.stopPropagation();

  const key = event.key;

  // Escape 键清空快捷键
  if (key === 'Escape') {
    const action = recordingInput.dataset.action;
    currentShortcuts[action] = '';
    recordingInput.value = '';
    stopRecording(recordingInput);
    return;
  }

  // 记录按下的键
  pressedKeys.add(key);

  // 构建快捷键字符串
  const accelerator = buildAccelerator();
  if (accelerator) {
    recordingInput.value = accelerator;
  }
}

/**
 * 处理按键释放
 */
async function handleKeyUp(event) {
  if (!recordingInput) return;

  event.preventDefault();
  event.stopPropagation();

  const key = event.key;
  pressedKeys.delete(key);

  // 如果释放的是修饰键，继续等待
  if (modifiers.includes(key)) {
    return;
  }

  // 如果所有键都释放了，完成录制
  if (pressedKeys.size === 0) {
    const accelerator = recordingInput.value;
    
    if (accelerator && accelerator !== '按下快捷键...') {
      // 验证快捷键
      const validation = await window.settingsAPI.validateAccelerator(accelerator);
      if (!validation.valid) {
        showError(recordingInput, validation.error);
        setTimeout(() => stopRecording(recordingInput), 1500);
        return;
      }

      // 检查冲突
      const action = recordingInput.dataset.action;
      const conflict = await window.settingsAPI.checkConflict(accelerator, action);
      if (conflict.inUse) {
        showError(recordingInput, `该快捷键已被"${getActionName(conflict.action)}"使用`);
        setTimeout(() => stopRecording(recordingInput), 1500);
        return;
      }

      // 保存到临时配置
      currentShortcuts[action] = accelerator;
      clearError(recordingInput);
    }

    stopRecording(recordingInput);
  }
}

/**
 * 构建快捷键字符串
 */
function buildAccelerator() {
  const parts = [];
  const keys = Array.from(pressedKeys);

  // 添加修饰键
  if (keys.includes('Control')) {
    parts.push('Ctrl');
  }
  if (keys.includes('Alt')) {
    parts.push('Alt');
  }
  if (keys.includes('Shift')) {
    parts.push('Shift');
  }
  if (keys.includes('Meta')) {
    parts.push('Command');
  }

  // 添加主键
  const mainKey = keys.find(k => !modifiers.includes(k));
  if (mainKey) {
    const mappedKey = keyMap[mainKey] || mainKey.toUpperCase();
    parts.push(mappedKey);
  }

  return parts.length > 1 ? parts.join('+') : '';
}

/**
 * 保存快捷键配置
 */
async function saveShortcuts() {
  try {
    const result = await window.settingsAPI.saveShortcuts(currentShortcuts);
    if (result.success) {
      showToast('保存成功，重启应用后生效');
      setTimeout(() => window.close(), 1500);
    } else {
      showToast('保存失败: ' + result.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败');
  }
}

/**
 * 重置快捷键
 */
async function resetShortcuts() {
  if (!confirm('确定要恢复默认快捷键设置吗？')) {
    return;
  }

  try {
    currentShortcuts = await window.settingsAPI.resetShortcuts();
    loadShortcuts();
    showToast('已恢复默认设置');
  } catch (error) {
    console.error('重置失败:', error);
    showToast('重置失败');
  }
}

/**
 * 显示错误信息
 */
function showError(input, message) {
  input.classList.add('error');
  const errorEl = input.parentElement.querySelector('.error-message');
  errorEl.textContent = message;
}

/**
 * 清除错误信息
 */
function clearError(input) {
  input.classList.remove('error');
  const errorEl = input.parentElement.querySelector('.error-message');
  errorEl.textContent = '';
}

/**
 * 显示提示消息
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * 获取操作名称
 */
function getActionName(action) {
  const names = {
    next: '下一首',
    previous: '上一首',
    playPause: '播放/暂停',
    volumeUp: '音量增加',
    volumeDown: '音量减少'
  };
  return names[action] || action;
}

// 初始化
document.addEventListener('DOMContentLoaded', initialize);

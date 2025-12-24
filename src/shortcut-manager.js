/**
 * 快捷键管理模块
 * 
 * 负责快捷键的注册、注销和自定义配置管理
 */

const { globalShortcut } = require('electron');

class ShortcutManager {
  constructor(store) {
    this.store = store;
    this.registeredShortcuts = new Map();
    
    // 默认快捷键配置
    this.defaultShortcuts = {
      next: 'CommandOrControl+Right',
      previous: 'CommandOrControl+Left',
      playPause: '',
      volumeUp: '',
      volumeDown: ''
    };
  }

  /**
   * 获取当前快捷键配置
   */
  getShortcuts() {
    return this.store.get('shortcuts', this.defaultShortcuts);
  }

  /**
   * 保存快捷键配置
   */
  saveShortcuts(shortcuts) {
    this.store.set('shortcuts', shortcuts);
    console.log('[快捷键] 配置已保存:', shortcuts);
  }

  /**
   * 重置为默认快捷键
   */
  resetToDefaults() {
    this.saveShortcuts(this.defaultShortcuts);
    return this.defaultShortcuts;
  }

  /**
   * 注册所有快捷键
   */
  registerAll(handlers) {
    console.log('[快捷键] 开始注册所有快捷键');
    
    // 先注销所有已注册的快捷键
    this.unregisterAll();
    
    const shortcuts = this.getShortcuts();
    const results = {};

    // 注册每个快捷键
    for (const [action, accelerator] of Object.entries(shortcuts)) {
      if (!accelerator || accelerator.trim() === '') {
        console.log(`[快捷键] 跳过空快捷键: ${action}`);
        continue;
      }

      const handler = handlers[action];
      if (!handler) {
        console.warn(`[快捷键] 未找到处理函数: ${action}`);
        continue;
      }

      try {
        const success = globalShortcut.register(accelerator, handler);
        if (success) {
          this.registeredShortcuts.set(action, accelerator);
          results[action] = { success: true, accelerator };
          console.log(`[快捷键] ${action} (${accelerator}) 注册成功`);
        } else {
          results[action] = { success: false, error: '快捷键已被占用' };
          console.warn(`[快捷键] ${action} (${accelerator}) 注册失败，可能已被占用`);
        }
      } catch (error) {
        results[action] = { success: false, error: error.message };
        console.error(`[快捷键] ${action} (${accelerator}) 注册异常:`, error.message);
      }
    }

    return results;
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll() {
    console.log('[快捷键] 注销所有快捷键');
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
  }

  /**
   * 验证快捷键格式
   */
  validateAccelerator(accelerator) {
    if (!accelerator || typeof accelerator !== 'string') {
      return { valid: false, error: '快捷键不能为空' };
    }

    // 基本格式验证
    const parts = accelerator.split('+');
    if (parts.length === 0) {
      return { valid: false, error: '快捷键格式无效' };
    }

    // 检查是否包含有效的按键
    const validModifiers = ['CommandOrControl', 'Command', 'Control', 'Ctrl', 'Alt', 'Option', 'Shift', 'Super'];
    const validKeys = ['Space', 'Up', 'Down', 'Left', 'Right', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete'];
    
    const lastPart = parts[parts.length - 1];
    const isValidKey = validKeys.includes(lastPart) || 
                       /^[A-Z0-9]$/.test(lastPart) || 
                       /^F[1-9]|F1[0-2]$/.test(lastPart);

    if (!isValidKey) {
      return { valid: false, error: '无效的按键' };
    }

    return { valid: true };
  }

  /**
   * 检查快捷键是否已被使用
   */
  isAcceleratorInUse(accelerator, excludeAction = null) {
    const shortcuts = this.getShortcuts();
    for (const [action, acc] of Object.entries(shortcuts)) {
      if (action !== excludeAction && acc === accelerator) {
        return { inUse: true, action };
      }
    }
    return { inUse: false };
  }
}

module.exports = ShortcutManager;

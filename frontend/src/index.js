// 消耗性资产管理系统 - 前端主入口
import { InventoryApp } from './app.js';

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    InventoryApp(root);
  } else {
    console.error('找不到根元素 #root');
  }
});
// 前端应用主组件
import { Navigation } from './components/navigation.js';
import { Dashboard } from './pages/dashboard.js';
import { AssetsPage } from './pages/assets.js';
import { CategoriesPage } from './pages/categories.js';
import { LocationsPage } from './pages/locations.js';
import { InventoryPage } from './pages/inventory.js';
import { LoginPage } from './pages/login.js';
import { UsersPage } from './pages/users.js';

export function InventoryApp(rootElement) {
  // 检查用户认证状态
  const token = localStorage.getItem('token');
  if (!token) {
    showPage('login');
  } else {
    showPage('dashboard');
  }

  // 页面路由
  function showPage(pageName, data = null) {
    rootElement.innerHTML = '';

    switch(pageName) {
      case 'login':
        rootElement.appendChild(LoginPage());
        break;
      case 'dashboard':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(Dashboard());
        break;
      case 'assets':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(AssetsPage());
        break;
      case 'categories':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(CategoriesPage());
        break;
      case 'locations':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(LocationsPage());
        break;
      case 'inventory':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(InventoryPage());
        break;
      case 'users':
        rootElement.appendChild(Navigation());
        rootElement.appendChild(UsersPage());
        break;
      default:
        rootElement.appendChild(Navigation());
        rootElement.appendChild(Dashboard());
    }
  }

  // 设置路由事件监听
  window.addEventListener('hashchange', () => {
    const route = window.location.hash.slice(1) || 'dashboard';
    showPage(route);
  });

  // 处理初始路由
  const initialRoute = window.location.hash.slice(1) || 'dashboard';
  showPage(initialRoute);
}
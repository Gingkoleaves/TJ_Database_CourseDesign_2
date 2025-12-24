// 导航组件
export function Navigation() {
  const nav = document.createElement('nav');
  nav.className = 'header';

  // 获取用户信息以确定是否显示用户管理链接
  const token = localStorage.getItem('token');
  let isAdmin = false;

  // 简单解析JWT token来检查是否为管理员
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload.isAdmin || false;
    } catch (e) {
      console.error('解析token失败:', e);
    }
  }

  // 构建导航菜单
  let navLinks = `
    <div class="navbar">
      <h2> 消耗性资产管理系统</h2>
      <ul class="nav-links">
        <li><a href="#dashboard">仪表板</a></li>
        <li><a href="#assets">资产定义</a></li>
        <li><a href="#categories">分类管理</a></li>
        <li><a href="#locations">位置管理</a></li>
        <li><a href="#inventory">库存管理</a></li>
  `;

  // 如果是管理员，添加用户管理链接
  if (isAdmin) {
    navLinks += '<li><a href="#users">用户管理</a></li>';
  }

  navLinks += `
        <li><button id="logout-btn" class="btn btn-danger">退出</button></li>
      </ul>
    </div>
  `;

  nav.innerHTML = navLinks;

  // 添加登出功能
  const logoutBtn = nav.querySelector('#logout-btn');
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.hash = 'login';
    window.location.reload();
  });

  return nav;
}
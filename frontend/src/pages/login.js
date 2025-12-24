// 登录页面组件
import { authAPI } from '../services/api.js';

export function LoginPage() {
  const loginContainer = document.createElement('div');
  loginContainer.className = 'container';
  
  loginContainer.innerHTML = `
    <div class="card mx-auto" style="max-width: 400px; margin-top: 5rem;">
      <h3 class="text-center mb-4">登录 - 消耗性资产管理系统</h3>
      <form id="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-100">登录</button>
      </form>
      <div id="login-error" class="alert alert-error mt-3" style="display: none;"></div>
    </div>
  `;
  
  const form = loginContainer.querySelector('#login-form');
  const errorDiv = loginContainer.querySelector('#login-error');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      const result = await authAPI.login({ username, password });
      
      if (result.token) {
        localStorage.setItem('token', result.token);
        window.location.hash = 'dashboard';
        window.location.reload();
      } else {
        errorDiv.textContent = result.message || '登录失败';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = '登录请求失败，请稍后重试';
      errorDiv.style.display = 'block';
    }
  });
  
  return loginContainer;
}
// 用户管理页面组件
import { userAPI } from '../services/api.js';

export function UsersPage() {
  const usersPage = document.createElement('div');
  usersPage.className = 'container';

  usersPage.innerHTML = `
    <h2>用户管理</h2>
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link active" href="#" data-tab="users">用户列表</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="create-user">创建用户</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="roles">角色管理</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="activity">用户活动</a>
      </li>
    </ul>

    <div id="users-content">
      <!-- 用户列表标签页 -->
      <div id="users-tab" class="tab-content">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">用户列表</h5>
            <button id="refresh-users" class="btn btn-secondary">刷新</button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>用户ID</th>
                    <th>用户名</th>
                    <th>角色</th>
                    <th>管理员</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="users-table-body">
                  <!-- 数据将通过JS填充 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建用户标签页 -->
      <div id="create-user-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">创建新用户</h5>
            <form id="create-user-form">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="new-username">用户名 *</label>
                    <input type="text" id="new-username" class="form-control" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="new-password">密码 *</label>
                    <input type="password" id="new-password" class="form-control" required>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <div class="form-check">
                  <input type="checkbox" id="new-is-admin" class="form-check-input">
                  <label for="new-is-admin" class="form-check-label">设为管理员</label>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">创建用户</button>
            </form>
          </div>
        </div>
        
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">分配角色</h5>
            <form id="assign-role-form">
              <div class="row">
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="assign-user">选择用户</label>
                    <select id="assign-user" class="form-control" required>
                      <option value="">选择用户</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="assign-role">选择角色</label>
                    <select id="assign-role" class="form-control" required>
                      <option value="">选择角色</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label>&nbsp;</label>
                    <div class="d-block">
                      <button type="submit" class="btn btn-success">分配角色</button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 角色管理标签页 -->
      <div id="roles-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">创建新角色</h5>
            <form id="create-role-form">
              <div class="form-group">
                <label for="role-description">角色描述 *</label>
                <input type="text" id="role-description" class="form-control" required>
              </div>
              <button type="submit" class="btn btn-primary">创建角色</button>
            </form>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">现有角色</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>角色ID</th>
                    <th>角色描述</th>
                  </tr>
                </thead>
                <tbody id="roles-table-body">
                  <!-- 数据将通过JS填充 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">分配角色分类权限</h5>
            <form id="assign-role-category-form">
              <div class="row">
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="assign-role-category">选择角色</label>
                    <select id="assign-role-category" class="form-control" required>
                      <option value="">选择角色</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="assign-category">选择分类</label>
                    <select id="assign-category" class="form-control" required>
                      <option value="">选择分类</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="can-edit-category">可操作</label>
                    <select id="can-edit-category" class="form-control">
                      <option value="1">是</option>
                      <option value="0">否</option>
                    </select>
                  </div>
                  <button type="submit" class="btn btn-success mt-2">分配权限</button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">角色分类权限一览</h5>
          </div>
          <div class="card-body">
            <div class="form-group mb-3">
              <label for="view-role-permissions">选择角色</label>
              <select id="view-role-permissions" class="form-control" style="max-width:300px;display:inline-block;"></select>
              <button id="load-role-permissions" class="btn btn-info ml-2">查看权限</button>
            </div>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>分类ID</th>
                    <th>分类名称</th>
                  </tr>
                </thead>
                <tbody id="role-permissions-table-body">
                  <!-- 数据将通过JS填充 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户活动标签页 -->
      <div id="activity-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">用户活动记录</h5>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="activity-user">选择用户（可选）</label>
                <select id="activity-user" class="form-control">
                  <option value="">所有用户</option>
                </select>
              </div>
              <div class="col-md-6">
                <label>&nbsp;</label>
                <div class="d-block">
                  <button id="load-activity" class="btn btn-primary">加载活动记录</button>
                </div>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>操作类型</th>
                    <th>时间</th>
                    <th>数量</th>
                    <th>详情</th>
                  </tr>
                </thead>
                <tbody id="activity-table-body">
                  <!-- 数据将通过JS填充 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 初始化用户管理页面
  initializeUsersPage(usersPage);

  return usersPage;
}

async function initializeUsersPage(container) {
  // 加载所有数据
  await loadUsers(container);
  await loadRoles(container);
  await loadUsersForActivity(container);

  // 加载角色权限展示区角色选项
  if (container.querySelector('#view-role-permissions')) {
    await loadRolesForPermissionView(container);
    setupRolePermissionViewEvents(container);
  }

  // 设置标签页切换
  setupTabNavigation(container);

  // 设置表单提交事件
  setupFormSubmissions(container);

  // 加载角色-分类权限分配表单选项
  if (container.querySelector('#assign-role-category-form')) {
    await loadRoleCategoryFormOptions(container);
    setupRoleCategoryFormSubmission(container);
  }

  // 设置按钮事件
  setupButtonEvents(container);
}

// 加载所有用户
async function loadUsers(container) {
  try {
    const users = await userAPI.getAll();
    const tbody = container.querySelector('#users-table-body');

    tbody.innerHTML = '';

    if (users && users.length > 0) {
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.user_id}</td>
          <td>${user.username}</td>
          <td>${user.roles || '无角色'}</td>
          <td>${user.is_admin ? '是' : '否'}</td>
          <td>${new Date(user.created_at).toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-warning edit-user-btn" data-user-id="${user.user_id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.user_id}">删除</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // 为编辑和删除按钮添加事件
      addRowEventListeners(container);
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="text-center">没有用户信息</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载用户失败:', error);
    const tbody = container.querySelector('#users-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">加载用户失败</td></tr>';
  }
}

// 加载所有角色
async function loadRoles(container) {
  try {
    const roles = await userAPI.getRoles();
    const tbody = container.querySelector('#roles-table-body');

    tbody.innerHTML = '';

    if (roles && roles.length > 0) {
      roles.forEach(role => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${role.role_id}</td>
          <td>${role.description}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="2" class="text-center">没有角色信息</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载角色失败:', error);
    const tbody = container.querySelector('#roles-table-body');
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">加载角色失败</td></tr>';
  }
}

// 加载用户下拉列表（用于角色分配）
async function loadUsersForAssignment(container) {
  try {
    const users = await userAPI.getAll();
    const userSelect = container.querySelector('#assign-user');

    // 重置选项
    userSelect.innerHTML = '<option value="">选择用户</option>';

    if (users) {
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.user_id;
        option.textContent = user.username;
        userSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
}

// 加载角色下拉列表（用于角色分配）
async function loadRolesForAssignment(container) {
  try {
    const roles = await userAPI.getRoles();
    const roleSelect = container.querySelector('#assign-role');

    // 重置选项
    roleSelect.innerHTML = '<option value="">选择角色</option>';

    if (roles) {
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.role_id;
        option.textContent = role.description;
        roleSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
  }
}

// 加载用户下拉列表（用于活动记录）
async function loadUsersForActivity(container) {
  try {
    const users = await userAPI.getAll();
    const userSelect = container.querySelector('#activity-user');

    // 重置选项
    userSelect.innerHTML = '<option value="">所有用户</option>';

    if (users) {
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.user_id;
        option.textContent = user.username;
        userSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
}

// 加载活动记录
async function loadActivity(container, userId = null) {
  try {
    let activity;
    if (userId) {
      activity = await userAPI.getActivityByUser(userId);
    } else {
      activity = await userAPI.getAllActivity();
    }

    const tbody = container.querySelector('#activity-table-body');
    tbody.innerHTML = '';

    if (activity && activity.length > 0) {
      activity.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${record.username || 'N/A'}</td>
          <td>${record.type === 'inbound' ? '入库' : '出库'}</td>
          <td>${new Date(record.time).toLocaleString()}</td>
          <td>${record.quantity}</td>
          <td>${record.detail || 'N/A'}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="text-center">没有活动记录</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载活动记录失败:', error);
    const tbody = container.querySelector('#activity-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">加载活动记录失败</td></tr>';
  }
}

// 设置标签页切换
function setupTabNavigation(container) {
  const tabs = container.querySelectorAll('.nav-link');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();

      // 移除当前激活的标签和内容
      container.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      // 激活点击的标签
      tab.classList.add('active');

      // 显示对应的内容
      const tabName = tab.getAttribute('data-tab');
      container.querySelector(`#${tabName}-tab`).style.display = 'block';
      
      // 如果切换到角色分配或活动标签，重新加载数据
      if (tabName === 'create-user') {
        loadUsersForAssignment(container);
        loadRolesForAssignment(container);
      } else if (tabName === 'activity') {
        loadUsersForActivity(container);
      }
    });
  });

  // 刷新按钮事件
  container.querySelector('#refresh-users').addEventListener('click', () => {
    loadUsers(container);
  });
}

// 表单提交事件
function setupFormSubmissions(container) {
  // 创建用户表单提交
  const createUserForm = container.querySelector('#create-user-form');
  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const is_admin = document.getElementById('new-is-admin').checked;

    try {
      await userAPI.create({ username, password, is_admin });

      // 重置表单
      createUserForm.reset();

      // 重新加载数据
      await loadUsers(container);

      alert('用户创建成功');
    } catch (error) {
      // 专门处理密码长度不足的提示
      console.error('创建用户错误:', error);
      if (error) {
        alert('请检查密码长度，至少6位密码；其他错误请查看控制台日志');
      } 
    }
  });

  // 分配角色表单提交
  const assignRoleForm = container.querySelector('#assign-role-form');
  assignRoleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user_id = document.getElementById('assign-user').value;
    const role_id = document.getElementById('assign-role').value;

    if (!user_id || !role_id) {
      alert('请选择用户和角色');
      return;
    }

    try {
      await userAPI.assignRole({ user_id: parseInt(user_id), role_id: parseInt(role_id) });

      // 重置表单
      assignRoleForm.reset();

      // 重新加载用户数据
      await loadUsers(container);

      alert('角色分配成功');
    } catch (error) {
      alert('角色分配失败: ' + error.message);
    }
  });

  // 创建角色表单提交
  const createRoleForm = container.querySelector('#create-role-form');
  createRoleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const description = document.getElementById('role-description').value;

    try {
      await userAPI.createRole({ description });

      // 重置表单
      createRoleForm.reset();

      // 重新加载数据
      await loadRoles(container);

      alert('角色创建成功');
    } catch (error) {
      alert('角色创建失败: ' + error.message);
    }
  });
}

// 加载角色权限展示区角色选项
async function loadRolesForPermissionView(container) {
  const roles = await userAPI.getRoles();
  const roleSelect = container.querySelector('#view-role-permissions');
  roleSelect.innerHTML = '<option value="">选择角色</option>';
  roles.forEach(role => {
    const option = document.createElement('option');
    option.value = role.role_id;
    option.textContent = role.description;
    roleSelect.appendChild(option);
  });
}

// 设置角色权限展示区按钮事件
function setupRolePermissionViewEvents(container) {
  container.querySelector('#load-role-permissions').addEventListener('click', async () => {
    const role_id = container.querySelector('#view-role-permissions').value;
    if (!role_id) {
      alert('请选择角色');
      return;
    }
    const permissions = await userAPI.getRoleCategoryPermissionsNew(role_id);
    const tbody = container.querySelector('#role-permissions-table-body');
    tbody.innerHTML = '';
    if (permissions && permissions.length > 0) {
      permissions.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.category_id}</td><td>${p.category_name}</td>`;
        tbody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="2" class="text-center">无权限记录</td>';
      tbody.appendChild(row);
    }
  });
}

// 加载角色和分类选项
async function loadRoleCategoryFormOptions(container) {
  // 加载角色
  const roles = await userAPI.getRoles();
  const roleSelect = container.querySelector('#assign-role-category');
  roleSelect.innerHTML = '<option value="">选择角色</option>';
  roles.forEach(role => {
    const option = document.createElement('option');
    option.value = role.role_id;
    option.textContent = role.description;
    roleSelect.appendChild(option);
  });

  // 加载分类
  const res = await fetch('http://localhost:3000/api/categories', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  const categories = await res.json();
  const categorySelect = container.querySelector('#assign-category');
  categorySelect.innerHTML = '<option value="">选择分类</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.category_id;
    option.textContent = cat.category_name;
    categorySelect.appendChild(option);
  });
}

// 表单提交事件
function setupRoleCategoryFormSubmission(container) {
  const assignRoleCategoryForm = container.querySelector('#assign-role-category-form');
  assignRoleCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role_id = document.getElementById('assign-role-category').value;
    const category_id = document.getElementById('assign-category').value;
    const can_edit = document.getElementById('can-edit-category').value;
    if (!role_id || !category_id) {
      alert('请选择角色和分类');
      return;
    }
    console.log('提交角色分类权限:', { role_id, category_id, can_edit });
    if (can_edit === '1') {
      await userAPI.assignCategoryPermission({ role_id: parseInt(role_id), category_id: parseInt(category_id) });
      alert('权限分配成功');
    } else {
      // 删除权限
      const res = await fetch('http://localhost:3000/api/users/role-category-permission', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ role_id: parseInt(role_id), category_id: parseInt(category_id) })
      });
      const result = await res.json();
      console.log('删除权限结果:', result);
      alert('权限已移除');
    }
  });
}

function setupButtonEvents(container) {
  // 加载活动记录按钮
  container.querySelector('#load-activity').addEventListener('click', () => {
    const userId = document.getElementById('activity-user').value;
    loadActivity(container, userId || null);
  });
}

function addRowEventListeners(container) {
  // 为编辑按钮添加事件
  const editButtons = container.querySelectorAll('.edit-user-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.target.getAttribute('data-user-id');
      alert('编辑用户功能将在后续版本中实现: ' + userId);
      // 这里可以实现编辑用户的功能
    });
  });

  // 为删除按钮添加事件
  const deleteButtons = container.querySelectorAll('.delete-user-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.target.getAttribute('data-user-id');
      
      if (confirm('确定要删除此用户吗？此操作不可撤销。')) {
        try {
          await userAPI.delete(userId);
          await loadUsers(container);
          alert('用户删除成功');
        } catch (error) {
          alert('用户删除失败: ' + error.message);
        }
      }
    });
  });
}
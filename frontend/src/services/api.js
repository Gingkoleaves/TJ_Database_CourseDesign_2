// API服务
const API_BASE_URL = 'http://localhost:3000/api';

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  else{
    console.warn('No JWT token found in localStorage');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (response.status === 401) {
      console.error('JWT校验失败:', response);
      console.log("config:", config)
      // 认证失败，重定向到登录页
      localStorage.removeItem('token');
      window.location.hash = 'login';
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 认证相关API
export const authAPI = {
  login: (credentials) => 
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(res => res.json()),
  
  getMe: () => apiRequest('/auth/me')
};

// 资产相关API
export const assetAPI = {
  getAll: () => apiRequest('/assets'),
  getById: (id) => apiRequest(`/assets/${id}`),
  create: (data) => apiRequest('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/assets/${id}`, { method: 'DELETE' })
};

// 分类相关API
export const categoryAPI = {
  getAll: () => apiRequest('/categories'),
  getById: (id) => apiRequest(`/categories/${id}`),
  create: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' })
};

// 位置相关API
export const locationAPI = {
  getAll: () => apiRequest('/locations'),
  getById: (id) => apiRequest(`/locations/${id}`),
  create: (data) => apiRequest('/locations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/locations/${id}`, { method: 'DELETE' })
};

// 库存相关API
export const inventoryAPI = {
  getBatches: () => apiRequest('/inventory/batches'),
  getByAsset: (assetId) => apiRequest(`/inventory/asset/${assetId}`),
  getSummary: () => apiRequest('/inventory/summary'),
  getExpiring: () => apiRequest('/inventory/expiring'),
  getLocationDetail: () => apiRequest('/inventory/location-detail'),
  inbound: (data) => apiRequest('/inventory/inbound', { method: 'POST', body: JSON.stringify(data) }),
  outbound: (data) => apiRequest('/inventory/outbound', { method: 'POST', body: JSON.stringify(data) }),
  transfer: (data) => apiRequest('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
  search: (keyword) => apiRequest(`/inventory/search?keyword=${encodeURIComponent(keyword)}`)
};

// 用户管理相关API
export const userAPI = {
  getAll: () => apiRequest('/users'),
  getById: (id) => apiRequest(`/users/${id}`),
  create: (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  getRoles: () => apiRequest('/users/roles'),
  createRole: (data) => apiRequest('/users/roles', { method: 'POST', body: JSON.stringify(data) }),
  assignRole: (data) => apiRequest('/users/assign-role', { method: 'POST', body: JSON.stringify(data) }),
  removeRole: (data) => apiRequest('/users/remove-role', { method: 'DELETE', body: JSON.stringify(data) }),
  getActivityByUser: (userId) => apiRequest(`/users/activity/${userId}`),
  getAllActivity: () => apiRequest('/users/activity'),
  assignCategoryPermission: (data) => apiRequest('/users/role-category-permission', { method: 'POST', body: JSON.stringify(data) }),
  getRoleCategoryPermissions: (role_id) => apiRequest(`/users/role-category-permission/${role_id}`),
  getRoleCategoryPermissionsNew: (role_id) => apiRequest(`/users/role-category-permissions/${role_id}`)
};
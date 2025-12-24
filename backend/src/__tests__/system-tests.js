// 系统测试
const { runAllTests: runUnitTests } = require('./unit-tests');
const http = require('http');
const axios = require('axios');

// 系统测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000
};

// 模拟认证令牌
let authToken = null;

// 测试认证功能
async function testAuthentication() {
  console.log('开始认证功能测试...');
  
  try {
    // 尝试使用测试用户登录
    const response = await axios.post(`${TEST_CONFIG.baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'  // 使用默认密码
    }, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✓ 认证功能测试通过');
      return true;
    } else {
      console.log('✗ 认证功能测试失败: 未返回令牌');
      return false;
    }
  } catch (error) {
    console.log('✗ 认证功能测试失败:', error.message);
    return false;
  }
}

// 测试资产功能端到端
async function testAssetEndToEnd() {
  console.log('开始资产功能端到端测试...');
  
  if (!authToken) {
    console.log('✗ 未通过认证，跳过资产测试');
    return false;
  }
  
  try {
    // 获取资产列表
    let response = await axios.get(`${TEST_CONFIG.baseURL}/api/assets`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: TEST_CONFIG.timeout
    });
    
    const initialCount = response.data.length;
    console.log(`✓ 获取资产列表成功，当前有 ${initialCount} 个资产`);
    
    // 创建新资产
    const newAsset = {
      name: '系统测试资产',
      category_id: 1,
      unit: '件',
      brand: 'Test Brand',
      model: 'Test Model',
      requirement: '系统测试用'
    };
    
    response = await axios.post(`${TEST_CONFIG.baseURL}/api/assets`, newAsset, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.timeout
    });
    
    console.log('✓ 创建资产成功');
    
    // 获取更新后的资产列表
    response = await axios.get(`${TEST_CONFIG.baseURL}/api/assets`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: TEST_CONFIG.timeout
    });
    
    const updatedCount = response.data.length;
    console.log(`✓ 更新后资产数量: ${updatedCount}`);
    
    if (updatedCount === initialCount + 1) {
      console.log('✓ 资产创建验证通过');
    } else {
      console.log('✗ 资产数量验证失败');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('✗ 资产功能测试失败:', error.message);
    return false;
  }
}

// 测试库存功能端到端
async function testInventoryEndToEnd() {
  console.log('开始库存功能端到端测试...');
  
  if (!authToken) {
    console.log('✗ 未通过认证，跳过库存测试');
    return false;
  }
  
  try {
    // 获取库存汇总
    const response = await axios.get(`${TEST_CONFIG.baseURL}/api/inventory/summary`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: TEST_CONFIG.timeout
    });
    
    console.log(`✓ 获取库存汇总成功，共有 ${response.data.length} 种资产`);
    
    // 获取即将过期的资产
    const expiringResponse = await axios.get(`${TEST_CONFIG.baseURL}/api/inventory/expiring`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: TEST_CONFIG.timeout
    });
    
    console.log(`✓ 获取即将过期资产成功，共有 ${expiringResponse.data.length} 项`);
    
    return true;
  } catch (error) {
    console.log('✗ 库存功能测试失败:', error.message);
    return false;
  }
}

// 测试各API端点可用性
async function testAPIEndpoints() {
  console.log('开始API端点可用性测试...');
  
  const endpoints = [
    '/api/auth/me',
    '/api/assets',
    '/api/categories',
    '/api/locations',
    '/api/inventory/summary',
    '/api/inventory/expiring'
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${TEST_CONFIG.baseURL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: TEST_CONFIG.timeout
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✓ ${endpoint} - 状态码: ${response.status}`);
        successCount++;
      } else {
        console.log(`✗ ${endpoint} - 状态码: ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint} - 错误: ${error.message}`);
    }
  }
  
  console.log(`API端点测试完成: ${successCount}/${endpoints.length} 个端点可用`);
  return successCount === endpoints.length;
}

// 运行所有系统测试
async function runSystemTests() {
  console.log('开始运行系统测试...\n');
  
  let allTestsPassed = true;
  
  // 运行单元测试
  console.log('运行单元测试...');
  allTestsPassed &= runUnitTests();
  console.log();
  
  // 运行系统级测试
  allTestsPassed &= await testAuthentication();
  console.log();
  
  allTestsPassed &= await testAssetEndToEnd();
  console.log();
  
  allTestsPassed &= await testInventoryEndToEnd();
  console.log();
  
  allTestsPassed &= await testAPIEndpoints();
  console.log();
  
  if (allTestsPassed) {
    console.log('✓ 所有系统测试通过!');
    return true;
  } else {
    console.log('✗ 一些系统测试失败');
    return false;
  }
}

// 导出测试函数
module.exports = {
  runSystemTests,
  testAuthentication,
  testAssetEndToEnd,
  testInventoryEndToEnd,
  testAPIEndpoints
};

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runSystemTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('系统测试执行错误:', error);
    process.exit(1);
  });
}
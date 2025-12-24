// 集成测试和API端点验证
// 检查后端API是否正确运行并可以从前端访问

// 检查API连接性
async function testAPIConnection() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      console.log('API连接正常');
      return true;
    } else if (response.status === 401) {
      console.log('需要认证');
      return false;
    } else {
      console.log('API连接错误:', response.status);
      return false;
    }
  } catch (error) {
    console.error('连接API失败:', error);
    return false;
  }
}

// 测试数据加载
async function testAssetLoad() {
  try {
    const response = await fetch('http://localhost:3000/api/assets', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const assets = await response.json();
      console.log(`成功加载 ${assets.length} 个资产`);
      return assets;
    } else {
      console.error('加载资产失败:', response.status);
      return null;
    }
  } catch (error) {
    console.error('加载资产时出错:', error);
    return null;
  }
}

// 测试所有主要功能
async function runIntegrationTests() {
  console.log('开始集成测试...');
  
  // 测试API连接
  const isConnected = await testAPIConnection();
  if (!isConnected) {
    console.log('API连接测试失败');
    return false;
  }
  
  // 测试数据加载
  const assets = await testAssetLoad();
  if (!assets) {
    console.log('数据加载测试失败');
    return false;
  }
  
  console.log('集成测试完成: 所有测试通过');
  return true;
}

// 导出测试函数
export { runIntegrationTests };
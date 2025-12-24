// 测试前后端集成
const http = require('http');

// 测试后端API连接
console.log('正在测试后端API连接...');

const request = http.get('http://localhost:3000/', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('后端API响应:', data);
    console.log('后端服务运行正常');
    
    // 测试认证API
    console.log('\n正在测试认证API...');
    const authReq = http.get('http://localhost:3000/api/auth/me', (authRes) => {
      console.log('认证API状态码:', authRes.statusCode);
      
      if (authRes.statusCode === 401) {
        console.log('认证API正常工作（需要认证令牌）');
      }
    });
    
    authReq.on('error', (err) => {
      console.log('认证API测试失败:', err.message);
    });
  });
});

request.on('error', (err) => {
  console.log('后端API连接失败:', err.message);
  console.log('请确保后端服务正在运行在端口3000上');
});
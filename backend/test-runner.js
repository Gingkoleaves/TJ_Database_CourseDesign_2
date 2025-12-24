// 测试运行器
const { runSystemTests } = require('./src/__tests__/system-tests');
const { runAllTests: runUnitTests } = require('./src/__tests__/unit-tests');

// 测试配置
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
  retries: parseInt(process.env.TEST_RETRIES) || 3
};

// 运行所有测试
async function runAllTests() {
  console.log('=================================');
  console.log('    消耗性资产管理系统 - 测试套件');
  console.log('=================================\n');
  
  console.log('测试配置:');
  console.log(`- 基础URL: ${config.baseUrl}`);
  console.log(`- 超时时间: ${config.timeout}ms`);
  console.log(`- 重试次数: ${config.retries}\n`);
  
  const startTime = Date.now();
  
  try {
    // 运行单元测试
    console.log('1. 运行单元测试...');
    const unitTestResult = runUnitTests();
    console.log(`   单元测试结果: ${unitTestResult ? '通过' : '失败'}\n`);
    
    // 运行系统测试
    console.log('2. 运行系统测试...');
    const systemTestResult = await runSystemTests();
    console.log(`   系统测试结果: ${systemTestResult ? '通过' : '失败'}\n`);
    
    const totalTime = Date.now() - startTime;
    console.log(`总耗时: ${totalTime}ms`);
    
    const overallResult = unitTestResult && systemTestResult;
    
    console.log('=================================');
    console.log(`整体测试结果: ${overallResult ? '通过' : '失败'}`);
    console.log('=================================');
    
    return overallResult;
  } catch (error) {
    console.error('测试执行过程中发生错误:', error);
    console.log('=================================');
    console.log('整体测试结果: 失败');
    console.log('=================================');
    
    return false;
  }
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试套件执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
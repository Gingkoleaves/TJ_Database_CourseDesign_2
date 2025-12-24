const db = require('./src/utils/database');

async function testConnection() {
  try {
    console.log('正在测试数据库连接...');
    
    // 测试查询
    const [results] = await db.execute('SELECT 1+1 as sum');
    console.log('数据库连接测试成功:', results);
    
    // 检查表是否存在
    const [tables] = await db.execute('SHOW TABLES');
    console.log('数据库中的表:', tables);
    
    // 检查分类表是否有数据
    const [categories] = await db.query('SELECT * FROM dim_category LIMIT 5');
    console.log('分类表数据:', categories);
    
    // 检查资产表是否有数据
    const [assets] = await db.query('SELECT * FROM dim_asset_definition LIMIT 5');
    console.log('资产表数据:', assets);
    
    process.exit(0);
  } catch (error) {
    console.error('数据库测试失败:', error);
    process.exit(1);
  }
}

testConnection();
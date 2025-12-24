const mysql = require('mysql2/promise');
require('dotenv').config();

// 从环境变量获取数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'Y-0000:)',
  database: process.env.DB_NAME || 'consumable_asset_management',
  port: process.env.DB_PORT || 3306
};

async function createAdminUser() {
  let connection;
  
  try {
    console.log('正在连接到数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('连接成功，正在创建管理员用户...');
    
    // 生成密码哈希
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // 开始事务
    await connection.beginTransaction();
    
    // 创建管理员用户
    const createUserQuery = `
      INSERT IGNORE INTO sys_user (username, password_hash, is_admin) 
      VALUES (?, ?, TRUE)
    `;
    
    const [userResult] = await connection.execute(createUserQuery, [
      'admin',
      passwordHash
    ]);
    
    console.log(`管理员用户创建结果: ${userResult.affectedRows > 0 ? '成功' : '已存在'}`);
    
    // 确保必要角色存在
    const roles = ['System Administrator', 'Asset Manager', 'Inventory Operator'];
    
    for (const role of roles) {
      const createRoleQuery = 'INSERT IGNORE INTO sys_role (description) VALUES (?)';
      await connection.execute(createRoleQuery, [role]);
    }
    
    console.log('角色创建完成');
    
    // 将系统管理员角色分配给用户
    const assignRoleQuery = `
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT u.user_id, r.role_id
      FROM sys_user u, sys_role r
      WHERE u.username = 'admin' AND r.description = 'System Administrator'
    `;
    
    await connection.execute(assignRoleQuery);
    
    // 提交事务
    await connection.commit();
    
    console.log('事务提交成功');
    
    // 验证用户创建
    const verifyQuery = `
      SELECT u.user_id, u.username, u.is_admin, r.description as role
      FROM sys_user u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.role_id
      WHERE u.username = 'admin'
    `;
    
    const [verifyResult] = await connection.execute(verifyQuery);
    
    if (verifyResult.length > 0) {
      console.log('\n管理员用户创建成功!');
      console.log('用户名:', verifyResult[0].username);
      console.log('角色:', verifyResult[0].role || '未分配角色');
      console.log('\n登录信息:');
      console.log('用户名: admin');
      console.log('密码: admin123');
      console.log('\n安全提醒: 登录后请立即更改默认密码!');
    } else {
      console.log('警告: 用户可能未正确创建');
    }
    
  } catch (error) {
    console.error('创建管理员用户时发生错误:', error);
    
    // 回滚事务
    if (connection) {
      await connection.rollback();
      console.log('事务已回滚');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行脚本
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
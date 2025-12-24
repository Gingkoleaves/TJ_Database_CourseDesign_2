
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
// 删除角色-分类权限
router.delete('/role-category-permission', [
  requireAdmin,
  body('role_id').isInt(),
  body('category_id').isInt()
], async (req, res) => {
  const { role_id, category_id } = req.body;
  console.log('收到删除权限请求:', { role_id, category_id });
  await db.execute(
    'DELETE FROM role_permission WHERE role_id = ? AND category_id = ?',
    [role_id, category_id]
  );
  res.json({ message: '权限已移除' });
});

// 查看某角色所有分类权限
router.get('/role-category-permissions/:role_id', requireAdmin, async (req, res) => {
  const { role_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT rp.category_id, c.category_name
         FROM role_permission rp
         JOIN dim_category c ON rp.category_id = c.category_id
         WHERE rp.role_id = ?`,
      [role_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('获取角色分类权限错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 为角色分配分类编辑权限
router.post('/role-category-permission', [
  requireAdmin,
  body('role_id').isInt(),
  body('category_id').isInt()
], async (req, res) => {
  const { role_id, category_id } = req.body;
  await db.execute(
    'INSERT IGNORE INTO role_permission (role_id, category_id) VALUES (?, ?)',
    [role_id, category_id]
  );
  res.json({ message: '权限设置成功' });
});

// 查询角色可编辑的分类
router.get('/role-category-permission/:role_id', requireAdmin, async (req, res) => {
  const { role_id } = req.params;
  const [rows] = await db.execute(
    'SELECT category_id FROM role_permission WHERE role_id = ?',
    [role_id]
  );
  res.json(rows);
});

// 获取所有用户信息（仅管理员）
router.get('/', requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.username, u.created_at, u.updated_at, u.is_admin,
             GROUP_CONCAT(r.description SEPARATOR ', ') as roles
      FROM sys_user u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.role_id
      GROUP BY u.user_id, u.username, u.created_at, u.updated_at, u.is_admin
      ORDER BY u.username
    `;

    const [users] = await db.execute(query);
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 具体路由优先于参数路由
// 获取所有角色（仅管理员）
router.get('/roles', requireAdmin, async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT role_id, description FROM sys_role ORDER BY description');
    res.json(roles);
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新角色（仅管理员）
router.post('/roles', [
  requireAdmin,
  body('description').notEmpty().withMessage('角色描述不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;

    const query = 'INSERT INTO sys_role (description) VALUES (?)';
    const [result] = await db.execute(query, [description]);

    res.status(201).json({
      role_id: result.insertId,
      description: description,
      message: '角色创建成功'
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 为用户分配角色（仅管理员）
router.post('/assign-role', [
  requireAdmin,
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('role_id').isInt().withMessage('角色ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, role_id } = req.body;

    // 验证用户和角色是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [user_id]
    );

    const [roles] = await db.execute(
      'SELECT role_id FROM sys_role WHERE role_id = ?',
      [role_id]
    );

    if (users.length === 0 || roles.length === 0) {
      return res.status(400).json({ message: '用户或角色不存在' });
    }

    // 分配角色
    const query = 'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)';
    await db.execute(query, [user_id, role_id]);

    res.json({ message: '角色分配成功' });
  } catch (error) {
    console.error('分配角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 移除用户角色（仅管理员）
router.delete('/remove-role', [
  requireAdmin,
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('role_id').isInt().withMessage('角色ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, role_id } = req.body;

    const query = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    await db.execute(query, [user_id, role_id]);

    res.json({ message: '角色移除成功' });
  } catch (error) {
    console.error('移除角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有用户的操作记录（仅管理员）
router.get('/activity', requireAdmin, async (req, res) => {
  try {
    // 获取所有入库记录
    const inboundQuery = `
      SELECT 'inbound' as type, u.username, inbound_time as time, quantity, source as detail
      FROM fact_inbound_log il
      JOIN sys_user u ON il.operator_id = u.user_id
      ORDER BY inbound_time DESC
      LIMIT 100
    `;

    // 获取所有出库记录
    const outboundQuery = `
      SELECT 'outbound' as type, u.username, outbound_time as time, quantity, destination as detail
      FROM fact_outbound_log ol
      JOIN sys_user u ON ol.operator_id = u.user_id
      ORDER BY outbound_time DESC
      LIMIT 100
    `;

    const [inboundLogs] = await db.execute(inboundQuery);
    const [outboundLogs] = await db.execute(outboundQuery);

    // 合并并按时间排序
    const allLogs = [...inboundLogs, ...outboundLogs];
    allLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(allLogs);
  } catch (error) {
    console.error('获取用户活动记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定用户的操作记录（仅管理员）
router.get('/activity/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证用户是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 获取用户的入库记录
    const inboundQuery = `
      SELECT 'inbound' as type, inbound_time as time, quantity, source as detail
      FROM fact_inbound_log
      WHERE operator_id = ?
      ORDER BY inbound_time DESC
      LIMIT 50
    `;

    // 获取用户的出库记录
    const outboundQuery = `
      SELECT 'outbound' as type, outbound_time as time, quantity, destination as detail
      FROM fact_outbound_log
      WHERE operator_id = ?
      ORDER BY outbound_time DESC
      LIMIT 50
    `;

    const [inboundLogs] = await db.execute(inboundQuery, [userId]);
    const [outboundLogs] = await db.execute(outboundQuery, [userId]);

    // 合并并按时间排序
    const allLogs = [...inboundLogs, ...outboundLogs];
    allLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(allLogs);
  } catch (error) {
    console.error('获取用户活动记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 根据ID获取单个用户信息（仅管理员）
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT u.user_id, u.username, u.created_at, u.updated_at, u.is_admin,
             GROUP_CONCAT(r.description SEPARATOR ', ') as roles
      FROM sys_user u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id, u.username, u.created_at, u.updated_at, u.is_admin
    `;

    const [users] = await db.execute(query, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新用户（仅管理员）
router.post('/', [
  requireAdmin,
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('is_admin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 检查是否有密码长度错误
      const pwdError = errors.array().find(e => e.path === 'password');      console.error('pwdError:', pwdError);
      console.error('errors:', errors);
      console.error("pwdError",pwdError);
      if (pwdError) {
        return res.status(401).json({ message: '密码至少6个字符' });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, is_admin = false } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await db.execute(
      'SELECT user_id FROM sys_user WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const query = 'INSERT INTO sys_user (username, password_hash, is_admin) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [username, hashedPassword, is_admin]);

    res.status(201).json({
      user_id: result.insertId,
      message: '用户创建成功'
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息（仅管理员）
router.put('/:id', [
  requireAdmin,
  body('username').optional().isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('is_admin').optional().isBoolean(),
  body('password').optional().isLength({ min: 6 }).withMessage('密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username, is_admin, password } = req.body;

    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 构建更新查询
    const updates = [];
    const values = [];

    if (username !== undefined) {
      // 检查用户名是否被其他用户使用
      const [existingUsers] = await db.execute(
        'SELECT user_id FROM sys_user WHERE username = ? AND user_id != ?',
        [username, id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: '用户名已存在' });
      }

      updates.push('username = ?');
      values.push(username);
    }

    if (is_admin !== undefined) {
      updates.push('is_admin = ?');
      values.push(is_admin);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
    }

    updates.push('updated_at = NOW()');

    if (updates.length <= 1) { // 只有updated_at
      return res.status(400).json({ message: '没有提供更新字段' });
    }

    const query = `UPDATE sys_user SET ${updates.join(', ')} WHERE user_id = ?`;
    values.push(id);

    await db.execute(query, values);

    res.json({ message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 删除用户的所有角色关联
    await db.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);

    // 删除用户
    await db.execute('DELETE FROM sys_user WHERE user_id = ?', [id]);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有角色（仅管理员）
router.get('/roles', requireAdmin, async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT role_id, description FROM sys_role ORDER BY description');
    res.json(roles);
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新角色（仅管理员）
router.post('/roles', [
  requireAdmin,
  body('description').notEmpty().withMessage('角色描述不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;

    const query = 'INSERT INTO sys_role (description) VALUES (?)';
    const [result] = await db.execute(query, [description]);

    res.status(201).json({
      role_id: result.insertId,
      description: description,
      message: '角色创建成功'
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 为用户分配角色（仅管理员）
router.post('/assign-role', [
  requireAdmin,
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('role_id').isInt().withMessage('角色ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, role_id } = req.body;

    // 验证用户和角色是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [user_id]
    );

    const [roles] = await db.execute(
      'SELECT role_id FROM sys_role WHERE role_id = ?',
      [role_id]
    );

    if (users.length === 0 || roles.length === 0) {
      return res.status(400).json({ message: '用户或角色不存在' });
    }

    // 分配角色
    const query = 'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)';
    await db.execute(query, [user_id, role_id]);

    res.json({ message: '角色分配成功' });
  } catch (error) {
    console.error('分配角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 移除用户角色（仅管理员）
router.delete('/remove-role', [
  requireAdmin,
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('role_id').isInt().withMessage('角色ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, role_id } = req.body;

    const query = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    await db.execute(query, [user_id, role_id]);

    res.json({ message: '角色移除成功' });
  } catch (error) {
    console.error('移除角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定用户的操作记录（仅管理员）
router.get('/activity/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证用户是否存在
    const [users] = await db.execute(
      'SELECT user_id FROM sys_user WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 获取用户的入库记录
    const inboundQuery = `
      SELECT 'inbound' as type, inbound_time as time, quantity, source as detail
      FROM fact_inbound_log
      WHERE operator_id = ?
      ORDER BY inbound_time DESC
      LIMIT 50
    `;

    // 获取用户的出库记录
    const outboundQuery = `
      SELECT 'outbound' as type, outbound_time as time, quantity, destination as detail
      FROM fact_outbound_log
      WHERE operator_id = ?
      ORDER BY outbound_time DESC
      LIMIT 50
    `;

    const [inboundLogs] = await db.execute(inboundQuery, [userId]);
    const [outboundLogs] = await db.execute(outboundQuery, [userId]);

    // 合并并按时间排序
    const allLogs = [...inboundLogs, ...outboundLogs];
    allLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(allLogs);
  } catch (error) {
    console.error('获取用户活动记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有用户的操作记录（仅管理员）
router.get('/activity', requireAdmin, async (req, res) => {
  try {
    // 获取所有入库记录
    const inboundQuery = `
      SELECT 'inbound' as type, u.username, inbound_time as time, quantity, source as detail
      FROM fact_inbound_log il
      JOIN sys_user u ON il.operator_id = u.user_id
      ORDER BY inbound_time DESC
      LIMIT 100
    `;

    // 获取所有出库记录
    const outboundQuery = `
      SELECT 'outbound' as type, u.username, outbound_time as time, quantity, destination as detail
      FROM fact_outbound_log ol
      JOIN sys_user u ON ol.operator_id = u.user_id
      ORDER BY outbound_time DESC
      LIMIT 100
    `;

    const [inboundLogs] = await db.execute(inboundQuery);
    const [outboundLogs] = await db.execute(outboundQuery);

    // 合并并按时间排序
    const allLogs = [...inboundLogs, ...outboundLogs];
    allLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(allLogs);
  } catch (error) {
    console.error('获取用户活动记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
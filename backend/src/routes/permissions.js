const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取用户权限信息
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const query = `
      SELECT u.user_id, u.username, 
             r.role_id, r.description AS role_description,
             c.category_id, c.category_name
      FROM sys_user u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.role_id
      LEFT JOIN role_permission rp ON r.role_id = rp.role_id
      LEFT JOIN dim_category c ON rp.category_id = c.category_id
      WHERE u.user_id = ?
      ORDER BY r.role_id, c.category_name
    `;
    
    const [permissions] = await db.execute(query, [userId]);
    res.json(permissions);
  } catch (error) {
    console.error('获取用户权限错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取系统中所有角色
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT role_id, description FROM sys_role ORDER BY description');
    res.json(roles);
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户可访问的分类
router.get('/accessible-categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [categories] = await db.execute(
      `SELECT DISTINCT c.category_id, c.category_name
       FROM v_user_accessible_categories v
       JOIN dim_category c ON v.category_id = c.category_id
       WHERE v.user_id = ?`,
      [userId]
    );
    
    res.json(categories);
  } catch (error) {
    console.error('获取可访问分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 系统管理员功能：管理用户权限
// 为用户分配角色
router.post('/assign-role', [
  authenticateToken,
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('role_id').isInt().withMessage('角色ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 这里应该检查当前用户是否具有管理员权限
    // 为简化，暂时跳过此检查，实际部署时应实现
    
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

    // 检查是否已分配
    const [existing] = await db.execute(
      'SELECT user_id FROM user_roles WHERE user_id = ? AND role_id = ?',
      [user_id, role_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '角色已分配' });
    }

    await db.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [user_id, role_id]
    );

    res.json({ message: '角色分配成功' });
  } catch (error) {
    console.error('分配角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 撤销用户角色
router.delete('/revoke-role', [
  authenticateToken,
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

    await db.execute(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [user_id, role_id]
    );

    res.json({ message: '角色撤销成功' });
  } catch (error) {
    console.error('撤销角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 为角色分配分类权限
router.post('/grant-category-permission', [
  authenticateToken,
  body('role_id').isInt().withMessage('角色ID必须是整数'),
  body('category_id').isInt().withMessage('分类ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role_id, category_id } = req.body;

    // 验证角色和分类是否存在
    const [roles] = await db.execute(
      'SELECT role_id FROM sys_role WHERE role_id = ?',
      [role_id]
    );

    const [categories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_id = ?',
      [category_id]
    );

    if (roles.length === 0 || categories.length === 0) {
      return res.status(400).json({ message: '角色或分类不存在' });
    }

    // 检查是否已授权
    const [existing] = await db.execute(
      'SELECT role_id FROM role_permission WHERE role_id = ? AND category_id = ?',
      [role_id, category_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '权限已存在' });
    }

    await db.execute(
      'INSERT INTO role_permission (role_id, category_id) VALUES (?, ?)',
      [role_id, category_id]
    );

    res.json({ message: '权限授权成功' });
  } catch (error) {
    console.error('授权错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 撤销角色的分类权限
router.delete('/revoke-category-permission', [
  authenticateToken,
  body('role_id').isInt().withMessage('角色ID必须是整数'),
  body('category_id').isInt().withMessage('分类ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role_id, category_id } = req.body;

    // 验证角色和分类是否存在
    const [roles] = await db.execute(
      'SELECT role_id FROM sys_role WHERE role_id = ?',
      [role_id]
    );

    const [categories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_id = ?',
      [category_id]
    );

    if (roles.length === 0 || categories.length === 0) {
      return res.status(400).json({ message: '角色或分类不存在' });
    }

    await db.execute(
      'DELETE FROM role_permission WHERE role_id = ? AND category_id = ?',
      [role_id, category_id]
    );

    res.json({ message: '权限撤销成功' });
  } catch (error) {
    console.error('撤销权限错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
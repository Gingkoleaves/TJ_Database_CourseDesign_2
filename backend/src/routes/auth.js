const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查询用户信息
    const [users] = await db.execute(
      'SELECT user_id, username, password_hash, is_admin FROM sys_user WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 获取用户角色
    const [userRoles] = await db.execute(
      `SELECT r.description as role_name 
       FROM user_roles ur 
       JOIN sys_role r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [user.user_id]
    );

    const roles = userRoles.map(role => role.role_name);

    // 生成JWT令牌，加入is_admin字段
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        username: user.username,
        roles: roles,
        isAdmin: !!user.is_admin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        roles: roles,
        isAdmin: !!user.is_admin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT user_id, username FROM sys_user WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const [userRoles] = await db.execute(
      `SELECT r.description as role_name 
       FROM user_roles ur 
       JOIN sys_role r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [req.user.userId]
    );

    const roles = userRoles.map(role => role.role_name);

    res.json({
      ...users[0],
      roles: roles
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
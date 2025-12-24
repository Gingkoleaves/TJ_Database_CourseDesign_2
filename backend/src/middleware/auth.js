const jwt = require('jsonwebtoken');
const db = require('../utils/database');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '访问被拒绝，需要令牌' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户角色信息
    const [userRoles] = await db.execute(
      `SELECT r.description as role_name
       FROM user_roles ur
       JOIN sys_role r ON ur.role_id = r.role_id
       WHERE ur.user_id = ?`,
      [verified.userId]
    );

    verified.roles = userRoles.map(role => role.role_name);

    // 检查是否为管理员
    const [user] = await db.execute(
      'SELECT is_admin FROM sys_user WHERE user_id = ?',
      [verified.userId]
    );

    if (user.length > 0) {
      verified.isAdmin = !!user[0].is_admin;
    } else {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: '令牌无效' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '认证失败' });
    }

    if (!roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
};

const requireAdmin = async (req, res, next) => {
  // console.log('Checking admin access for user:', req.user);
  if (!req.user) {
    return res.status(401).json({ message: '认证失败' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: '仅管理员可访问' });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  requireAdmin
};
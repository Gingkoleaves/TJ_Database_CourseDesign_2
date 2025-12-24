const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const db = require('./src/utils/database');

// 路由
const authRoutes = require('./src/routes/auth');
const assetRoutes = require('./src/routes/asset');
const categoryRoutes = require('./src/routes/category');
const locationRoutes = require('./src/routes/location');
const inventoryRoutes = require('./src/routes/inventory');
const permissionRoutes = require('./src/routes/permissions');

const { authenticateToken } = require('./src/middleware/auth');
const userRoutes = require('./src/routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: '消耗性资产管理系统 API' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

const PORT = process.env.PORT || 3000;

// 测试数据库连接
db.query('SELECT 1')
  .then(() => {
    console.log('已连接到MySQL数据库');

    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });
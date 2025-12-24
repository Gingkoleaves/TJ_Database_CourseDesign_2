# 消耗性资产管理系统 - 技术文档

## 1. 系统架构

### 1.1 整体架构
本系统采用前后端分离架构：
- **前端**: 原生JavaScript + HTML + CSS
- **后端**: Node.js + Express.js 框架
- **数据库**: MySQL
- **通信协议**: RESTful API

### 1.2 技术栈
- **后端**: 
  - Node.js (v16+)
  - Express.js (web框架)
  - mysql2 (数据库连接)
  - bcryptjs (密码加密)
  - jsonwebtoken (JWT认证)
  - cors (跨域处理)
  - dotenv (环境变量管理)
  - express-validator (输入验证)

- **前端**:
  - 原生JavaScript (ES6+)
  - HTML5
  - CSS3 (Bootstrap 5)
  - Fetch API (网络请求)

- **数据库**:
  - MySQL 5.7+

### 1.3 项目结构
```
D:/Tongji/DataBasesDesign/
├── database/                 # 数据库相关脚本
│   ├── schema.sql           # 数据库表结构
│   ├── views.sql            # 视图定义
│   └── stored_procedures.sql # 存储过程
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   └── utils/           # 工具函数
│   ├── server.js            # 服务器入口
│   └── package.json
├── frontend/                # 前端代码
│   ├── public/              # 静态资源
│   └── src/
│       ├── components/      # 组件
│       ├── pages/           # 页面
│       ├── services/        # API服务
│       └── styles/          # 样式
└── docs/                    # 文档
    ├── database_design.md   # 数据库设计
    ├── deployment_guide.md  # 部署指南
    ├── performance_optimization.md # 性能优化
    ├── user_manual.md       # 用户手册
    └── technical_documentation.md # 技术文档
```

## 2. 数据库设计详述

### 2.1 表结构

#### 2.1.1 维度表 (Dimension Tables)
- **dim_asset_definition**: 资产定义表
  - 存储资产的类型信息（名称、分类、品牌、型号等）
  - 通过category_id关联分类表

- **dim_category**: 分类表
  - 资产分类信息
  - 支持多级分类（通过层级设计）

- **dim_location**: 位置表
  - 存储资产存放位置（房间、柜子、货架）
  - 支持多级位置管理

#### 2.1.2 事实表 (Fact Tables)
- **fact_stock_batch**: 库存批次表
  - 记录每个库存批次的详细信息
  - 包含数量、有效期、位置等

- **fact_inbound_log**: 入库日志表  
  - 记录所有入库操作
  - 包含操作员、时间、数量等信息

- **fact_outbound_log**: 出库日志表
  - 记录所有出库操作
  - 跟踪资产去向

#### 2.1.3 系统表 (System Tables)
- **sys_user**: 用户表
  - 存储系统用户信息
  - 包含密码哈希

- **sys_role**: 角色表
  - 定义系统角色

- **user_roles**: 用户角色关联表
  - 多对多关系：用户<->角色

- **role_permission**: 角色权限表
  - 定义角色对分类的访问权限

### 2.2 约束和关系

#### 2.2.1 外键关系
- dim_asset_definition.category_id → dim_category.category_id
- fact_stock_batch.asset_id → dim_asset_definition.asset_id
- fact_stock_batch.location_id → dim_location.location_id
- fact_inbound_log.batch_id → fact_stock_batch.batch_id
- fact_outbound_log.batch_id → fact_stock_batch.batch_id

#### 2.2.2 检查约束
- fact_stock_batch.current_quantity >= 0
- fact_inbound_log.quantity > 0
- fact_outbound_log.quantity > 0

#### 2.2.3 唯一约束
- dim_asset_definition: (category_id, name, brand, model) 复合唯一
- dim_location: (room, cabinet, shelf) 位置唯一

### 2.3 索引设计
- **性能索引**:
  - fact_stock_batch.current_quantity
  - dim_asset_definition.category_id
  - fact_stock_batch(asset_id, location_id)
  - fact_stock_batch.expiry_date
  - fact_inbound_log(batch_id, inbound_time)
  - fact_outbound_log(batch_id, outbound_time)

- **唯一索引**:
  - 资产定义组合索引
  - 位置组合索引

## 3. API接口设计

### 3.1 认证接口
```
POST /api/auth/login - 用户登录
GET  /api/auth/me - 获取当前用户信息
```

### 3.2 资产管理接口
```
GET    /api/assets - 获取所有资产
GET    /api/assets/:id - 获取特定资产
POST   /api/assets - 创建新资产
PUT    /api/assets/:id - 更新资产
DELETE /api/assets/:id - 删除资产
```

### 3.3 分类管理接口
```
GET    /api/categories - 获取所有分类
GET    /api/categories/:id - 获取特定分类
POST   /api/categories - 创建新分类
PUT    /api/categories/:id - 更新分类
DELETE /api/categories/:id - 删除分类
```

### 3.4 位置管理接口
```
GET    /api/locations - 获取所有位置
GET    /api/locations/:id - 获取特定位置
POST   /api/locations - 创建新位置
PUT    /api/locations/:id - 更新位置
DELETE /api/locations/:id - 删除位置
```

### 3.5 库存管理接口
```
GET    /api/inventory/batches - 获取所有库存批次
GET    /api/inventory/asset/:assetId - 获取特定资产库存
GET    /api/inventory/summary - 库存汇总
GET    /api/inventory/expiring - 即将过期的资产
GET    /api/inventory/location-detail - 位置库存明细
POST   /api/inventory/inbound - 入库操作
POST   /api/inventory/outbound - 出库操作
POST   /api/inventory/transfer - 位置转移
```

## 4. 安全设计

### 4.1 认证机制
- 基于JWT的Token认证
- 密码使用bcrypt进行哈希存储
- Token有效期管理

### 4.2 授权机制
- 基于角色的访问控制(RBAC)
- 分类级别的权限控制
- 支持权限继承和分配

### 4.3 数据安全
- 输入验证和过滤
- SQL注入防护
- XSS防护

## 5. 存储过程设计

### 5.1 事务处理
- **sp_inbound_transaction**: 入库事务
- **sp_new_inbound_transaction**: 新资产入库事务
- **sp_outbound_transaction**: 出库事务
- **sp_stock_transfer**: 库存转移事务
- **sp_adjust_permission**: 权限调整事务

### 5.2 事务特性
- 原子性：所有操作作为一个事务单元
- 一致性：维护数据一致性约束
- 隔离性：防止并发问题
- 持久性：操作结果持久保存

## 6. 性能优化

### 6.1 数据库优化
- 合理的索引设计
- 查询优化
- 表分区（建议）

### 6.2 应用层优化
- 连接池管理
- 缓存策略
- 异步处理

### 6.3 前端优化
- 数据分页
- 懒加载
- 请求合并

## 7. 扩展性考虑

### 7.1 水平扩展
- 数据库读写分离
- 应用服务器集群
- 负载均衡

### 7.2 垂直扩展
- 模块化设计便于功能扩展
- API接口的可扩展性
- 数据模型的扩展性

## 8. 维护和监控

### 8.1 日志管理
- 操作日志记录
- 错误日志收集
- 性能日志监控

### 8.2 备份策略
- 数据库定期备份
- 配置文件版本控制
- 代码版本管理

## 9. 部署建议

### 9.1 服务器配置
- Linux服务器推荐
- SSL证书配置
- 反向代理设置

### 9.2 安全配置
- 防火墙规则
- 定期更新
- 访问控制

---

此技术文档涵盖了系统的整体架构、数据库设计、API接口、安全机制以及性能优化等关键方面，为系统的维护和二次开发提供了完整的技术参考。
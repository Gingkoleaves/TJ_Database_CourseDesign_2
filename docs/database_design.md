# 消耗性资产管理系统 - 数据库设计方案

## 项目概述
本系统用于管理实验室或其他机构的消耗性资产，包括入库、出库、库存管理、有效期预警和权限控制等功能。

## 数据库设计

### 表结构设计

#### 1. dim_asset_definition (资产定义表)
- asset_id (INT, PK, AUTO_INCREMENT) - 资产ID
- name (VARCHAR(255), NOT NULL) - 资产名称
- category_id (INT, NOT NULL, FK) - 分类ID
- brand (VARCHAR(255)) - 品牌
- model (VARCHAR(255)) - 型号
- unit (VARCHAR(50)) - 单位
- requirement (TEXT) - 领用要求
- is_active (BOOLEAN, DEFAULT TRUE) - 资产有效性
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间
- remark - 备注

#### 2. dim_category (分类表)
- category_id (INT, PK, AUTO_INCREMENT) - 分类ID
- category_name (VARCHAR(255), NOT NULL, UNIQUE) - 分类名称

#### 3. dim_location (位置表)
- location_id (INT, PK, AUTO_INCREMENT) - 位置ID
- room (VARCHAR(100), NOT NULL) - 房间号
- cabinet (VARCHAR(100)) - 柜子号
- shelf (VARCHAR(100)) - 货架号
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

#### 4. fact_stock_batch (批信息表)
- batch_id (INT, PK, AUTO_INCREMENT) - 批次ID
- asset_id (INT, NOT NULL, FK) - 资产ID
- location_id (INT, NOT NULL, FK) - 位置ID
- expiry_date (DATE) - 过期日期
- current_quantity (INT, NOT NULL, DEFAULT 0) - 剩余数量
- remarks (TEXT) - 备注
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间

#### 5. fact_inbound_log (入库明细表)
- inbound_id (INT, PK, AUTO_INCREMENT) - 入库ID
- batch_id (INT, NOT NULL, FK) - 批次ID
- source (VARCHAR(255)) - 来源
- quantity (INT, NOT NULL) - 数量
- inbound_time (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 入库时间
- operator_id (INT, NOT NULL, FK) - 操作员ID
- remarks (TEXT) - 备注
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

#### 6. fact_outbound_log (出库明细表)
- outbound_id (INT, PK, AUTO_INCREMENT) - 出库ID
- batch_id (INT, NOT NULL, FK) - 批次ID
- destination (VARCHAR(255)) - 去向
- quantity (INT, NOT NULL) - 数量
- outbound_time (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 出库时间
- operator_id (INT, NOT NULL, FK) - 操作员ID
- remarks (TEXT) - 备注
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

#### 7. sys_user (用户元数据表)
- user_id (INT, PK, AUTO_INCREMENT) - 用户ID
- username (VARCHAR(255), NOT NULL, UNIQUE) - 用户名
- password_hash (VARCHAR(255), NOT NULL) - 密码哈希值
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间
- is_admin (INT) - 管理员

#### 8. sys_role (职属元数据表)
- role_id (INT, PK, AUTO_INCREMENT) - 角色ID
- description (VARCHAR(255), NOT NULL) - 角色描述

#### 9. role_permission (职属权限表)
- role_id (INT, NOT NULL, FK) - 角色ID
- category_id (INT, NOT NULL, FK) - 分类ID
- granted_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 授权时间
- (role_id, category_id) - 复合主键

#### 10. user_roles (用户职属表)
- user_id (INT, NOT NULL, FK) - 用户ID
- role_id (INT, NOT NULL, FK) - 角色ID
- assigned_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 分配时间
- (user_id, role_id) - 复合主键

### 约束和索引

#### 检查约束
- fact_stock_batch.current_quantity >= 0
- fact_inbound_log.quantity > 0
- fact_outbound_log.quantity > 0

#### 唯一索引
- dim_asset_definition(category_id, name, brand, model)
- dim_location(room, cabinet, shelf)

#### 性能索引
- fact_stock_batch(current_quantity)
- dim_asset_definition(category_id)
- fact_stock_batch(asset_id)
- fact_stock_batch(location_id)
- fact_stock_batch(expiry_date)
- fact_inbound_log(batch_id)
- fact_outbound_log(batch_id)
- fact_inbound_log(inbound_time)
- fact_outbound_log(outbound_time)
- fact_inbound_log(operator_id)
- fact_outbound_log(operator_id)
- sys_user(username)
- dim_category(category_name)

### 视图设计

#### 1. v_asset_inventory_summary (资产库存总览)
屏蔽"批次"概念，直接展示每种资产在全库的总数

#### 2. v_expiring_assets_alert (有效期预警视图)
列出所有即将到期（如30天内）或已过期的库存

#### 3. v_user_accessible_categories (用户授权分类视图)
快速查询特定用户拥有管理权限的分类详情

#### 4. v_location_stock_detail (库位明细视图)
展示【房间-箱柜-隔板】层级下的资产分布

### 存储过程和事务设计

#### T1: 入库事务 (Inbound Transaction)
- 向现有批次添加库存或创建新批次
- 记录入库日志
- 更新库存数量

#### T2: 出库事务 (Outbound Transaction)
- 从指定批次减少库存
- 记录出库日志
- 更新库存数量

#### T3: 库位转移事务 (Stock Transfer)
- 将库存从一个位置转移到另一个位置
- 可以是全部或部分转移
- 记录相应的出入库日志

#### T4: 权限变更事务 (Permission Adjustment)
- 授予或撤销用户对特定分类的访问权限
- 管理用户角色分配
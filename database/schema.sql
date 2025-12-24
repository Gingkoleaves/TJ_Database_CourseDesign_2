-- 消耗性资产管理系统数据库架构脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS consumable_asset_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE consumable_asset_management;

-- dim_asset_definition (资产定义表)
CREATE TABLE IF NOT EXISTS dim_asset_definition (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    brand VARCHAR(255),
    model VARCHAR(255),
    unit VARCHAR(50),
    requirement TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- dim_category (分类表)
CREATE TABLE IF NOT EXISTS dim_category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

-- dim_location (位置表)
CREATE TABLE IF NOT EXISTS dim_location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    room VARCHAR(100) NOT NULL,
    cabinet VARCHAR(100),
    shelf VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sys_user (用户元数据)
CREATE TABLE IF NOT EXISTS sys_user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
);

-- sys_role (职属元数据)
CREATE TABLE IF NOT EXISTS sys_role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL
);

-- fact_stock_batch (批信息)
CREATE TABLE IF NOT EXISTS fact_stock_batch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    location_id INT NOT NULL,
    expiry_date DATE,
    current_quantity INT NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- fact_inbound_log (入库明细)
CREATE TABLE IF NOT EXISTS fact_inbound_log (
    inbound_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    source VARCHAR(255),
    quantity INT NOT NULL,
    inbound_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operator_id INT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- fact_outbound_log (出库明细)
CREATE TABLE IF NOT EXISTS fact_outbound_log (
    outbound_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    destination VARCHAR(255),
    quantity INT NOT NULL,
    outbound_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operator_id INT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user_roles (用户职属)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT,
    role_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- role_permission (职属权限)
CREATE TABLE IF NOT EXISTS role_permission (
    role_id INT,
    category_id INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, category_id)
);

-- 添加外键约束
ALTER TABLE dim_asset_definition 
ADD CONSTRAINT fk_asset_category 
FOREIGN KEY (category_id) REFERENCES dim_category(category_id);

ALTER TABLE fact_stock_batch 
ADD CONSTRAINT fk_batch_asset 
FOREIGN KEY (asset_id) REFERENCES dim_asset_definition(asset_id);

ALTER TABLE fact_stock_batch 
ADD CONSTRAINT fk_batch_location 
FOREIGN KEY (location_id) REFERENCES dim_location(location_id);

ALTER TABLE fact_inbound_log 
ADD CONSTRAINT fk_inbound_batch 
FOREIGN KEY (batch_id) REFERENCES fact_stock_batch(batch_id);

ALTER TABLE fact_inbound_log 
ADD CONSTRAINT fk_inbound_operator 
FOREIGN KEY (operator_id) REFERENCES sys_user(user_id);

ALTER TABLE fact_outbound_log 
ADD CONSTRAINT fk_outbound_batch 
FOREIGN KEY (batch_id) REFERENCES fact_stock_batch(batch_id);

ALTER TABLE fact_outbound_log 
ADD CONSTRAINT fk_outbound_operator 
FOREIGN KEY (operator_id) REFERENCES sys_user(user_id);

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_user 
FOREIGN KEY (user_id) REFERENCES sys_user(user_id);

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_role 
FOREIGN KEY (role_id) REFERENCES sys_role(role_id);

ALTER TABLE role_permission 
ADD CONSTRAINT fk_role_perm_role 
FOREIGN KEY (role_id) REFERENCES sys_role(role_id);

ALTER TABLE role_permission 
ADD CONSTRAINT fk_role_perm_category 
FOREIGN KEY (category_id) REFERENCES dim_category(category_id);

-- 添加检查约束（如果MySQL版本支持）
-- 对于不支持CHECK约束的MySQL版本，可以使用触发器
-- MySQL 8.0.16+ 支持CHECK约束
-- 对于较早版本，建议使用触发器或在应用层验证

DELIMITER //

-- 创建触发器确保current_quantity >= 0
CREATE TRIGGER tr_check_stock_quantity 
BEFORE UPDATE ON fact_stock_batch
FOR EACH ROW
BEGIN
    IF NEW.current_quantity < 0 THEN
        SET NEW.current_quantity = 0;
    END IF;
END//

-- 创建触发器确保inbound quantity > 0
CREATE TRIGGER tr_check_inbound_quantity 
BEFORE INSERT ON fact_inbound_log
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inbound quantity must be greater than 0';
    END IF;
END//

-- 创建触发器确保outbound quantity > 0
CREATE TRIGGER tr_check_outbound_quantity 
BEFORE INSERT ON fact_outbound_log
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Outbound quantity must be greater than 0';
    END IF;
END//

DELIMITER ;

-- 创建唯一索引
CREATE UNIQUE INDEX idx_unique_asset ON dim_asset_definition(category_id, name, brand, model);
CREATE UNIQUE INDEX idx_unique_location ON dim_location(room, cabinet, shelf);

-- 创建性能索引
CREATE INDEX idx_current_quantity ON fact_stock_batch(current_quantity);
CREATE INDEX idx_asset_category ON dim_asset_definition(category_id);
CREATE INDEX idx_batch_asset ON fact_stock_batch(asset_id);
CREATE INDEX idx_batch_location ON fact_stock_batch(location_id);
CREATE INDEX idx_expiry_date ON fact_stock_batch(expiry_date);
CREATE INDEX idx_inbound_batch ON fact_inbound_log(batch_id);
CREATE INDEX idx_outbound_batch ON fact_outbound_log(batch_id);
CREATE INDEX idx_inbound_time ON fact_inbound_log(inbound_time);
CREATE INDEX idx_outbound_time ON fact_outbound_log(outbound_time);
CREATE INDEX idx_operator_inbound ON fact_inbound_log(operator_id);
CREATE INDEX idx_operator_outbound ON fact_outbound_log(operator_id);
CREATE INDEX idx_username ON sys_user(username);
CREATE INDEX idx_category_name ON dim_category(category_name);
-- 消耗性资产管理系统 - 存储过程和事务处理函数

USE consumable_asset_management;

DELIMITER //

-- T1: 入库事务 (Inbound Transaction)
-- 处理现有批次的入库或创建新批次
CREATE PROCEDURE sp_inbound_transaction(
    IN p_batch_id INT,
    IN p_source VARCHAR(255),
    IN p_quantity INT,
    IN p_operator_id INT,
    IN p_remarks TEXT,
    OUT p_result VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '事务失败：发生错误';
    END;
    
    START TRANSACTION;
    
    -- 验证数量
    IF p_quantity <= 0 THEN
        SET p_result = '错误：入库数量必须大于0';
        ROLLBACK;
    ELSE
        -- 检查批次是否存在
        IF p_batch_id IS NOT NULL AND EXISTS (SELECT 1 FROM fact_stock_batch WHERE batch_id = p_batch_id) THEN
            -- 对现有批次进行入库
            UPDATE fact_stock_batch 
            SET current_quantity = current_quantity + p_quantity
            WHERE batch_id = p_batch_id;
            
            -- 记录入库日志
            INSERT INTO fact_inbound_log (batch_id, source, quantity, operator_id, remarks)
            VALUES (p_batch_id, p_source, p_quantity, p_operator_id, p_remarks);
            
            SET p_result = '入库成功';
        ELSE
            SET p_result = '错误：批次不存在';
            ROLLBACK;
        END IF;
    END IF;
    
    COMMIT;
END//

-- T1: 新增资产入库事务
CREATE PROCEDURE sp_new_inbound_transaction(
    IN p_asset_id INT,
    IN p_location_id INT,
    IN p_source VARCHAR(255),
    IN p_quantity INT,
    IN p_expiry_date DATE,
    IN p_operator_id INT,
    IN p_remarks TEXT,
    OUT p_new_batch_id INT,
    OUT p_result VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '事务失败：发生错误';
    END;
    
    START TRANSACTION;
    
    -- 验证数量
    IF p_quantity <= 0 THEN
        SET p_result = '错误：入库数量必须大于0';
        SET p_new_batch_id = NULL;
        ROLLBACK;
    ELSE
        -- 创建新批次
        INSERT INTO fact_stock_batch (asset_id, location_id, expiry_date, current_quantity, remarks)
        VALUES (p_asset_id, p_location_id, p_expiry_date, p_quantity, p_remarks);
        
        SET p_new_batch_id = LAST_INSERT_ID();
        
        -- 记录入库日志
        INSERT INTO fact_inbound_log (batch_id, source, quantity, operator_id, remarks)
        VALUES (p_new_batch_id, p_source, p_quantity, p_operator_id, p_remarks);
        
        SET p_result = '新增入库成功';
    END IF;
    
    COMMIT;
END//

-- T2: 出库事务 (Outbound Transaction)
CREATE PROCEDURE sp_outbound_transaction(
    IN p_batch_id INT,
    IN p_destination VARCHAR(255),
    IN p_quantity INT,
    IN p_operator_id INT,
    IN p_remarks TEXT,
    OUT p_result VARCHAR(255)
)
BEGIN
    DECLARE v_current_quantity INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '事务失败：发生错误';
    END;
    
    START TRANSACTION;
    
    -- 获取当前库存数量
    SELECT current_quantity INTO v_current_quantity
    FROM fact_stock_batch
    WHERE batch_id = p_batch_id;
    
    -- 验证数量
    IF p_quantity <= 0 THEN
        SET p_result = '错误：出库数量必须大于0';
        ROLLBACK;
    ELSEIF v_current_quantity < p_quantity THEN
        SET p_result = '错误：库存不足';
        ROLLBACK;
    ELSE
        -- 更新库存
        UPDATE fact_stock_batch
        SET current_quantity = current_quantity - p_quantity
        WHERE batch_id = p_batch_id;
        
        -- 记录出库日志
        INSERT INTO fact_outbound_log (batch_id, destination, quantity, operator_id, remarks)
        VALUES (p_batch_id, p_destination, p_quantity, p_operator_id, p_remarks);
        
        SET p_result = '出库成功';
    END IF;
    
    COMMIT;
END//

-- T3: 库位转移事务 (Stock Transfer)
CREATE PROCEDURE sp_stock_transfer(
    IN p_batch_id INT,
    IN p_new_location_id INT,
    IN p_quantity INT,
    IN p_operator_id INT,
    IN p_remarks TEXT,
    OUT p_result VARCHAR(255)
)
BEGIN
    DECLARE v_current_quantity INT DEFAULT 0;
    DECLARE v_asset_id INT DEFAULT 0;
    DECLARE v_expiry_date DATE;
    DECLARE v_batch_remarks TEXT;
    DECLARE v_new_batch_id INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '事务失败：发生错误';
    END;
    
    START TRANSACTION;
    
    -- 获取当前批次信息
    SELECT current_quantity, asset_id, expiry_date, remarks 
    INTO v_current_quantity, v_asset_id, v_expiry_date, v_batch_remarks
    FROM fact_stock_batch
    WHERE batch_id = p_batch_id;
    
    -- 验证数量
    IF p_quantity <= 0 THEN
        SET p_result = '错误：转移数量必须大于0';
        ROLLBACK;
    ELSEIF v_current_quantity < p_quantity THEN
        SET p_result = '错误：转移数量超过当前库存';
        ROLLBACK;
    ELSE
        -- 如果是全部转移，则直接更新位置
        IF v_current_quantity = p_quantity THEN
            UPDATE fact_stock_batch
            SET location_id = p_new_location_id
            WHERE batch_id = p_batch_id;
            
            -- 记录入库日志(作为转移到新位置)
            INSERT INTO fact_inbound_log (batch_id, source, quantity, operator_id, remarks)
            VALUES (p_batch_id, 'TRANSFER', p_quantity, p_operator_id, CONCAT('Transfer to location ', p_new_location_id, ': ', p_remarks));
            
            -- 记录出库日志(从原位置)
            INSERT INTO fact_outbound_log (batch_id, destination, quantity, operator_id, remarks)
            VALUES (p_batch_id, 'TRANSFER', p_quantity, p_operator_id, CONCAT('Transfer from location ', (SELECT location_id FROM fact_stock_batch WHERE batch_id = p_batch_id), ': ', p_remarks));
            
            SET p_result = '整批转移成功';
        ELSE
            -- 部分转移：创建新批次，减少原批次数量
            INSERT INTO fact_stock_batch (asset_id, location_id, expiry_date, current_quantity, remarks)
            VALUES (v_asset_id, p_new_location_id, v_expiry_date, p_quantity, CONCAT('Split from batch ', p_batch_id, ': ', p_remarks));
            
            SET v_new_batch_id = LAST_INSERT_ID();
            
            -- 减少原批次数量
            UPDATE fact_stock_batch
            SET current_quantity = current_quantity - p_quantity
            WHERE batch_id = p_batch_id;
            
            -- 记录出库日志(从原批次)
            INSERT INTO fact_outbound_log (batch_id, destination, quantity, operator_id, remarks)
            VALUES (p_batch_id, 'TRANSFER', p_quantity, p_operator_id, CONCAT('Partial transfer to batch ', v_new_batch_id, ': ', p_remarks));
            
            -- 记录入库日志(到新批次)
            INSERT INTO fact_inbound_log (batch_id, source, quantity, operator_id, remarks)
            VALUES (v_new_batch_id, 'TRANSFER', p_quantity, p_operator_id, CONCAT('Partial transfer from batch ', p_batch_id, ': ', p_remarks));
            
            SET p_result = '部分转移成功';
        END IF;
    END IF;
    
    COMMIT;
END//

-- T4: 权限变更事务 (Permission Adjustment)
CREATE PROCEDURE sp_adjust_permission(
    IN p_operation_type ENUM('GRANT', 'REVOKE'),
    IN p_user_id INT,
    IN p_role_id INT,
    IN p_category_id INT,
    IN p_operator_id INT,
    OUT p_result VARCHAR(255)
)
BEGIN
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_role_exists INT DEFAULT 0;
    DECLARE v_category_exists INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '事务失败：发生错误';
    END;
    
    START TRANSACTION;
    
    -- 验证实体存在性
    SELECT COUNT(*) INTO v_user_exists FROM sys_user WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_role_exists FROM sys_role WHERE role_id = p_role_id;
    SELECT COUNT(*) INTO v_category_exists FROM dim_category WHERE category_id = p_category_id;
    
    IF v_user_exists = 0 OR v_role_exists = 0 OR v_category_exists = 0 THEN
        SET p_result = '错误：用户、角色或分类不存在';
        ROLLBACK;
    ELSE
        CASE p_operation_type
            WHEN 'GRANT' THEN
                -- 授予权限：添加角色权限和/或用户角色
                INSERT IGNORE INTO role_permission (role_id, category_id) 
                VALUES (p_role_id, p_category_id);
                
                INSERT IGNORE INTO user_roles (user_id, role_id) 
                VALUES (p_user_id, p_role_id);
                
                IF ROW_COUNT() > 0 THEN
                    SET p_result = '权限授予成功';
                ELSE
                    SET p_result = '权限已存在';
                END IF;
                
            WHEN 'REVOKE' THEN
                -- 撤销权限
                DELETE FROM role_permission 
                WHERE role_id = p_role_id AND category_id = p_category_id;
                
                -- 检查是否需要移除用户的角色（如果没有其他权限）
                -- 这里可以根据业务规则决定是否移除用户的角色
                -- 为简单起见，我们只移除权限，保留角色分配
                
                SET p_result = '权限撤销成功';
                
            ELSE
                SET p_result = '错误：无效操作类型，应为 GRANT 或 REVOKE';
                ROLLBACK;
        END CASE;
    END IF;
    
    COMMIT;
END//

DELIMITER ;
-- 消耗性资产管理系统 - 视图定义

USE consumable_asset_management;

-- v_asset_inventory_summary (资产库存总览)
-- 屏蔽"批次"概念，直接展示每种资产在全库的总数
CREATE OR REPLACE VIEW v_asset_inventory_summary AS
SELECT 
    ad.asset_id,
    ad.name,
    c.category_name,
    ad.brand,
    ad.model,
    ad.unit,
    SUM(sb.current_quantity) AS total_quantity,
    ad.requirement,
    ad.is_active
FROM dim_asset_definition ad
JOIN dim_category c ON ad.category_id = c.category_id
LEFT JOIN fact_stock_batch sb ON ad.asset_id = sb.asset_id
GROUP BY ad.asset_id, ad.name, c.category_name, ad.brand, ad.model, ad.unit, ad.requirement, ad.is_active;

-- v_expiring_assets_alert (有效期预警视图)
-- 列出所有即将到期（如30天内）或已过期的库存
CREATE OR REPLACE VIEW v_expiring_assets_alert AS
SELECT 
    ad.asset_id,
    ad.name,
    c.category_name,
    ad.brand,
    ad.model,
    sb.batch_id,
    sb.expiry_date,
    sb.current_quantity,
    sb.location_id,
    l.room,
    l.cabinet,
    l.shelf,
    CASE 
        WHEN sb.expiry_date < CURDATE() THEN 'EXPIRED'
        WHEN sb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING_SOON'
    END AS status
FROM dim_asset_definition ad
JOIN dim_category c ON ad.category_id = c.category_id
JOIN fact_stock_batch sb ON ad.asset_id = sb.asset_id
JOIN dim_location l ON sb.location_id = l.location_id
WHERE sb.current_quantity > 0
AND sb.expiry_date IS NOT NULL
AND sb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY sb.expiry_date ASC;

-- v_user_accessible_categories (用户授权分类视图)
-- 快速查询特定用户拥有管理权限的分类详情
CREATE OR REPLACE VIEW v_user_accessible_categories AS
SELECT DISTINCT
    u.user_id,
    u.username,
    r.role_id,
    r.description AS role_description,
    c.category_id,
    c.category_name
FROM sys_user u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN sys_role r ON ur.role_id = r.role_id
JOIN role_permission rp ON r.role_id = rp.role_id
JOIN dim_category c ON rp.category_id = c.category_id;

-- v_location_stock_detail (库位明细视图)
-- 展示【房间-箱柜-隔板】层级下的资产分布
CREATE OR REPLACE VIEW v_location_stock_detail AS
SELECT 
    l.location_id,
    l.room,
    l.cabinet,
    l.shelf,
    ad.asset_id,
    ad.name,
    c.category_name,
    ad.brand,
    ad.model,
    ad.unit,
    SUM(sb.current_quantity) AS total_quantity,
    MIN(sb.expiry_date) AS earliest_expiry,
    COUNT(sb.batch_id) AS batch_count
FROM dim_location l
LEFT JOIN fact_stock_batch sb ON l.location_id = sb.location_id
LEFT JOIN dim_asset_definition ad ON sb.asset_id = ad.asset_id
LEFT JOIN dim_category c ON ad.category_id = c.category_id
WHERE ad.is_active = TRUE OR ad.is_active IS NULL
GROUP BY l.location_id, l.room, l.cabinet, l.shelf, ad.asset_id, ad.name, c.category_name, ad.brand, ad.model, ad.unit
ORDER BY l.room, l.cabinet, l.shelf, ad.name;
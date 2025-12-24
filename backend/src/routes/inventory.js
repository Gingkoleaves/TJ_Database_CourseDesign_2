
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 库存模糊搜索
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: '缺少搜索关键字' });
    }
    // 可根据实际表结构调整字段
    const query = `
      SELECT * FROM v_asset_inventory_summary
      WHERE name LIKE ? OR category_name LIKE ? OR brand LIKE ? OR model LIKE ?
      ORDER BY name
    `;
    const like = `%${keyword}%`;
    const [results] = await db.execute(query, [like, like, like, like]);
    res.json(results);
  } catch (error) {
    console.error('库存模糊搜索错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有库存批次
router.get('/batches', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT sb.batch_id, sb.asset_id, ad.name as asset_name, 
             sb.location_id, l.room, l.cabinet, l.shelf,
             sb.expiry_date, sb.current_quantity, sb.remarks, sb.created_at
      FROM fact_stock_batch sb
      JOIN dim_asset_definition ad ON sb.asset_id = ad.asset_id
      JOIN dim_location l ON sb.location_id = l.location_id
      ORDER BY sb.created_at DESC
    `;
    
    const [batches] = await db.execute(query);
    res.json(batches);
  } catch (error) {
    console.error('获取库存批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 根据资产ID获取库存
router.get('/asset/:assetId', authenticateToken, async (req, res) => {
  try {
    const { assetId } = req.params;
    
    const query = `
      SELECT sb.batch_id, sb.asset_id, ad.name as asset_name,
             sb.location_id, l.room, l.cabinet, l.shelf,
             sb.expiry_date, sb.current_quantity, sb.remarks, sb.created_at
      FROM fact_stock_batch sb
      JOIN dim_asset_definition ad ON sb.asset_id = ad.asset_id
      JOIN dim_location l ON sb.location_id = l.location_id
      WHERE sb.asset_id = ?
      ORDER BY sb.expiry_date
    `;
    
    const [batches] = await db.execute(query, [assetId]);
    res.json(batches);
  } catch (error) {
    console.error('获取资产库存错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取库存汇总视图
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const [summary] = await db.execute('SELECT * FROM v_asset_inventory_summary ORDER BY name');
    res.json(summary);
  } catch (error) {
    console.error('获取库存汇总错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取即将过期的库存
router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const [expiring] = await db.execute('SELECT * FROM v_expiring_assets_alert ORDER BY expiry_date ASC');
    res.json(expiring);
  } catch (error) {
    console.error('获取即将过期库存错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取位置库存明细
router.get('/location-detail', authenticateToken, async (req, res) => {
  try {
    const [details] = await db.execute('SELECT * FROM v_location_stock_detail ORDER BY room, cabinet, shelf, name');
    res.json(details);
  } catch (error) {
    console.error('获取位置库存明细错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 执行入库操作
router.post('/inbound', [
  authenticateToken,
  body('batch_id').optional().isInt().withMessage('批次ID必须是整数'),
  body('asset_id').optional().isInt().withMessage('资产ID必须是整数'),
  body('location_id').optional().isInt().withMessage('位置ID必须是整数'),
  body('source').notEmpty().withMessage('来源不能为空'),
  body('quantity').isInt({ min: 1 }).withMessage('数量必须是大于0的整数'),
  body('operator_id').isInt().withMessage('操作员ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { batch_id, asset_id, location_id, source, quantity, operator_id, remarks, expiry_date } = req.body;

    // 如果提供了batch_id，执行现有批次入库
    if (batch_id) {
      // 验证批次是否存在
      const [batches] = await db.execute(
        'SELECT batch_id FROM fact_stock_batch WHERE batch_id = ?',
        [batch_id]
      );

      if (batches.length === 0) {
        return res.status(400).json({ message: '批次不存在' });
      }

      // 调用入库存储过程
      const [result] = await db.execute(
        'CALL sp_inbound_transaction(?, ?, ?, ?, ?, @result)',
        [batch_id, source, quantity, operator_id, remarks || null]
      );

      const [[output]] = await db.execute('SELECT @result as result');
      
      if (output.result.startsWith('错误')) {
        return res.status(400).json({ message: output.result });
      }

      res.json({ message: output.result });
    } 
    // 否则创建新批次
    else if (asset_id && location_id) {
      // 验证资产和位置是否存在
      const [assets] = await db.execute(
        'SELECT asset_id FROM dim_asset_definition WHERE asset_id = ?',
        [asset_id]
      );

      const [locations] = await db.execute(
        'SELECT location_id FROM dim_location WHERE location_id = ?',
        [location_id]
      );

      if (assets.length === 0) {
        return res.status(400).json({ message: '资产不存在' });
      }

      if (locations.length === 0) {
        return res.status(400).json({ message: '位置不存在' });
      }

      // 调用新增入库存储过程
      const [result] = await db.execute(
        'CALL sp_new_inbound_transaction(?, ?, ?, ?, ?, ?, ?, @new_batch_id, @result)',
        [asset_id, location_id, source, quantity, expiry_date || null, operator_id, remarks || null]
      );

      const [[output]] = await db.execute('SELECT @new_batch_id as new_batch_id, @result as result');
      
      if (output.result.startsWith('错误')) {
        return res.status(400).json({ message: output.result });
      }

      res.json({ 
        message: output.result,
        new_batch_id: output.new_batch_id 
      });
    } else {
      return res.status(400).json({ message: '需要提供批次ID或资产ID和位置ID' });
    }
  } catch (error) {
    console.error('执行入库操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 执行出库操作
router.post('/outbound', [
  authenticateToken,
  body('batch_id').isInt().withMessage('批次ID必须是整数'),
  body('destination').notEmpty().withMessage('去向不能为空'),
  body('quantity').isInt({ min: 1 }).withMessage('数量必须是大于0的整数'),
  body('operator_id').isInt().withMessage('操作员ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { batch_id, destination, quantity, operator_id, remarks } = req.body;

    // 验证批次是否存在
    const [batches] = await db.execute(
      'SELECT batch_id, current_quantity FROM fact_stock_batch WHERE batch_id = ?',
      [batch_id]
    );

    if (batches.length === 0) {
      return res.status(400).json({ message: '批次不存在' });
    }

    if (batches[0].current_quantity < quantity) {
      return res.status(400).json({ message: '库存不足' });
    }

    // 调用出库存储过程
    const [result] = await db.execute(
      'CALL sp_outbound_transaction(?, ?, ?, ?, ?, @result)',
      [batch_id, destination, quantity, operator_id, remarks || null]
    );

    const [[output]] = await db.execute('SELECT @result as result');
    
    if (output.result.startsWith('错误')) {
      return res.status(400).json({ message: output.result });
    }

    res.json({ message: output.result });
  } catch (error) {
    console.error('执行出库操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 执行库位转移操作
router.post('/transfer', [
  authenticateToken,
  body('batch_id').isInt().withMessage('批次ID必须是整数'),
  body('new_location_id').isInt().withMessage('新位置ID必须是整数'),
  body('quantity').isInt({ min: 1 }).withMessage('数量必须是大于0的整数'),
  body('operator_id').isInt().withMessage('操作员ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { batch_id, new_location_id, quantity, operator_id, remarks } = req.body;

    // 验证批次和位置是否存在
    const [batches] = await db.execute(
      'SELECT batch_id, current_quantity FROM fact_stock_batch WHERE batch_id = ?',
      [batch_id]
    );

    const [locations] = await db.execute(
      'SELECT location_id FROM dim_location WHERE location_id = ?',
      [new_location_id]
    );

    if (batches.length === 0) {
      return res.status(400).json({ message: '批次不存在' });
    }

    if (locations.length === 0) {
      return res.status(400).json({ message: '新位置不存在' });
    }

    if (batches[0].current_quantity < quantity) {
      return res.status(400).json({ message: '转移数量超过当前库存' });
    }

    // 调用转移存储过程
    const [result] = await db.execute(
      'CALL sp_stock_transfer(?, ?, ?, ?, ?, @result)',
      [batch_id, new_location_id, quantity, operator_id, remarks || null]
    );

    const [[output]] = await db.execute('SELECT @result as result');
    
    if (output.result.startsWith('错误')) {
      return res.status(400).json({ message: output.result });
    }

    res.json({ message: output.result });
  } catch (error) {
    console.error('执行转移操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
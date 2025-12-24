const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有位置
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [locations] = await db.execute(
      'SELECT location_id, room, cabinet, shelf FROM dim_location ORDER BY room, cabinet, shelf'
    );
    res.json(locations);
  } catch (error) {
    console.error('获取位置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 根据ID获取单个位置
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [locations] = await db.execute(
      'SELECT location_id, room, cabinet, shelf, created_at FROM dim_location WHERE location_id = ?',
      [id]
    );
    
    if (locations.length === 0) {
      return res.status(404).json({ message: '位置未找到' });
    }
    
    res.json(locations[0]);
  } catch (error) {
    console.error('获取位置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新位置
router.post('/', [
  authenticateToken,
  body('room').notEmpty().withMessage('房间号不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room, cabinet, shelf } = req.body;

    // 检查位置是否已存在
    const [existingLocations] = await db.execute(
      'SELECT location_id FROM dim_location WHERE room = ? AND COALESCE(cabinet, "") = COALESCE(?, "") AND COALESCE(shelf, "") = COALESCE(?, "")',
      [room, cabinet || null, shelf || null]
    );

    if (existingLocations.length > 0) {
      return res.status(400).json({ message: '位置已存在' });
    }

    const query = 'INSERT INTO dim_location (room, cabinet, shelf) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [room, cabinet || null, shelf || null]);

    res.status(201).json({
      location_id: result.insertId,
      message: '位置创建成功'
    });
  } catch (error) {
    console.error('创建位置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新位置
router.put('/:id', [
  authenticateToken,
  body('room').notEmpty().withMessage('房间号不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { room, cabinet, shelf } = req.body;

    // 检查位置是否存在
    const [locations] = await db.execute(
      'SELECT location_id FROM dim_location WHERE location_id = ?',
      [id]
    );

    if (locations.length === 0) {
      return res.status(404).json({ message: '位置未找到' });
    }

    // 检查新位置信息是否与其他位置冲突
    const [existingLocations] = await db.execute(
      'SELECT location_id FROM dim_location WHERE room = ? AND COALESCE(cabinet, "") = COALESCE(?, "") AND COALESCE(shelf, "") = COALESCE(?, "") AND location_id != ?',
      [room, cabinet || null, shelf || null, id]
    );

    if (existingLocations.length > 0) {
      return res.status(400).json({ message: '位置已存在' });
    }

    const query = 'UPDATE dim_location SET room = ?, cabinet = ?, shelf = ? WHERE location_id = ?';
    await db.execute(query, [room, cabinet || null, shelf || null, id]);

    res.json({ message: '位置更新成功' });
  } catch (error) {
    console.error('更新位置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除位置
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [locations] = await db.execute(
      'SELECT location_id FROM dim_location WHERE location_id = ?',
      [id]
    );

    if (locations.length === 0) {
      return res.status(404).json({ message: '位置未找到' });
    }

    // 检查是否有库存批次使用此位置
    const [batches] = await db.execute(
      'SELECT batch_id FROM fact_stock_batch WHERE location_id = ?',
      [id]
    );

    if (batches.length > 0) {
      return res.status(400).json({ message: '无法删除：仍有库存批次使用此位置' });
    }

    await db.execute('DELETE FROM dim_location WHERE location_id = ?', [id]);
    
    res.json({ message: '位置删除成功' });
  } catch (error) {
    console.error('删除位置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
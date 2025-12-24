const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有分类
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT category_id, category_name FROM dim_category ORDER BY category_name'
    );
    res.json(categories);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 根据ID获取单个分类
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [categories] = await db.execute(
      'SELECT category_id, category_name FROM dim_category WHERE category_id = ?',
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ message: '分类未找到' });
    }
    
    res.json(categories[0]);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新分类
router.post('/', [
  authenticateToken,
  body('category_name').notEmpty().withMessage('分类名称不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_name } = req.body;

    // 检查分类名称是否已存在
    const [existingCategories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_name = ?',
      [category_name]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({ message: '分类名称已存在' });
    }

    const query = 'INSERT INTO dim_category (category_name) VALUES (?)';
    const [result] = await db.execute(query, [category_name]);

    res.status(201).json({
      category_id: result.insertId,
      message: '分类创建成功'
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新分类
router.put('/:id', [
  authenticateToken,
  body('category_name').notEmpty().withMessage('分类名称不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { category_name } = req.body;

    // 检查分类是否存在
    const [categories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: '分类未找到' });
    }

    // 检查新分类名称是否与其他分类冲突
    const [existingCategories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_name = ? AND category_id != ?',
      [category_name, id]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({ message: '分类名称已存在' });
    }

    const query = 'UPDATE dim_category SET category_name = ? WHERE category_id = ?';
    await db.execute(query, [category_name, id]);

    res.json({ message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除分类
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: '分类未找到' });
    }

    // 检查是否有资产使用此分类
    const [assets] = await db.execute(
      'SELECT asset_id FROM dim_asset_definition WHERE category_id = ?',
      [id]
    );

    if (assets.length > 0) {
      return res.status(400).json({ message: '无法删除：仍有资产使用此分类' });
    }

    await db.execute('DELETE FROM dim_category WHERE category_id = ?', [id]);
    
    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
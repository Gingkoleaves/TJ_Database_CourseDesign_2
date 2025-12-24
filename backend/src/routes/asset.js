const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有资产定义
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT ad.asset_id, ad.name, c.category_name, ad.brand, ad.model, 
             ad.unit, ad.requirement, ad.is_active, ad.created_at, ad.updated_at
      FROM dim_asset_definition ad
      JOIN dim_category c ON ad.category_id = c.category_id
      ORDER BY ad.name
    `;
    
    const [assets] = await db.execute(query);
    res.json(assets);
  } catch (error) {
    console.error('获取资产定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 根据ID获取单个资产定义
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT ad.asset_id, ad.name, ad.category_id, c.category_name, 
             ad.brand, ad.model, ad.unit, ad.requirement, ad.is_active,
             ad.created_at, ad.updated_at
      FROM dim_asset_definition ad
      JOIN dim_category c ON ad.category_id = c.category_id
      WHERE ad.asset_id = ?
    `;
    
    const [assets] = await db.execute(query, [id]);
    
    if (assets.length === 0) {
      return res.status(404).json({ message: '资产定义未找到' });
    }
    
    res.json(assets[0]);
  } catch (error) {
    console.error('获取资产定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新资产定义
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('资产名称不能为空'),
  body('category_id').isInt().withMessage('分类ID必须是整数'),
  body('unit').notEmpty().withMessage('单位不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category_id, brand, model, unit, requirement } = req.body;

    // 检查分类是否存在
    const [categories] = await db.execute(
      'SELECT category_id FROM dim_category WHERE category_id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({ message: '分类不存在' });
    }

    const query = `
      INSERT INTO dim_asset_definition (name, category_id, brand, model, unit, requirement, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      name, category_id, brand, model, unit, requirement || null, true
    ]);

    res.status(201).json({
      asset_id: result.insertId,
      message: '资产定义创建成功'
    });
  } catch (error) {
    console.error('创建资产定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新资产定义
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty().withMessage('资产名称不能为空'),
  body('category_id').optional().isInt().withMessage('分类ID必须是整数'),
  body('unit').optional().notEmpty().withMessage('单位不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, category_id, brand, model, unit, requirement, is_active } = req.body;

    // 检查资产是否存在
    const [assets] = await db.execute(
      'SELECT asset_id FROM dim_asset_definition WHERE asset_id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ message: '资产定义未找到' });
    }

    // 构建更新查询
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (category_id !== undefined) {
      // 检查分类是否存在
      const [categories] = await db.execute(
        'SELECT category_id FROM dim_category WHERE category_id = ?',
        [category_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ message: '分类不存在' });
      }
      
      updates.push('category_id = ?');
      values.push(category_id);
    }
    if (brand !== undefined) {
      updates.push('brand = ?');
      values.push(brand);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      values.push(model);
    }
    if (unit !== undefined) {
      updates.push('unit = ?');
      values.push(unit);
    }
    if (requirement !== undefined) {
      updates.push('requirement = ?');
      values.push(requirement);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    updates.push('updated_at = NOW()');

    if (updates.length === 1) { // 只有updated_at
      return res.status(400).json({ message: '没有提供更新字段' });
    }

    const query = `UPDATE dim_asset_definition SET ${updates.join(', ')} WHERE asset_id = ?`;
    values.push(id);

    await db.execute(query, values);

    res.json({ message: '资产定义更新成功' });
  } catch (error) {
    console.error('更新资产定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除资产定义（软删除，设置is_active为false）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [assets] = await db.execute(
      'SELECT asset_id FROM dim_asset_definition WHERE asset_id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ message: '资产定义未找到' });
    }

    await db.execute(
      'UPDATE dim_asset_definition SET is_active = FALSE WHERE asset_id = ?',
      [id]
    );

    res.json({ message: '资产定义删除成功' });
  } catch (error) {
    console.error('删除资产定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
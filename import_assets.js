const XLSX = require('xlsx');
const fs = require('fs');

// 读取Excel文件并导入资产数据的脚本
async function importAssetsFromExcel(excelFilePath, token) {
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile(excelFilePath);
    
    // 假设第一个工作表包含资产数据
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`找到 ${jsonData.length} 条资产记录`);
    
    // 验证必要的列是否存在
    const requiredColumns = ['name', 'category', 'brand', 'model', 'unit', 'requirement'];
    
    // 尝试检测实际的列名（可能与标准名称不同）
    const dataKeys = Object.keys(jsonData[0] || {});
    console.log('检测到的列名:', dataKeys);
    
    // 映射实际的列名到标准字段
    const columnMappings = {
      name: ['消耗性资产名称', '名称', 'name', 'asset_name', 'assetname', '资产名称', 'asset Name', 'Asset Name'],
      category: ['物耗分类', '分类', 'category', 'category_name', 'categoryname', '资产分类', 'category Name', 'Asset Category'],
      brand: ['商家/厂家/品牌', '品牌', 'brand', 'asset_brand', 'assetbrand', '资产品牌', 'brand Name', 'Brand Name'],
      model: ['规格型号', '型号', 'model', '规格', 'asset_model', 'assetmodel', '资产型号', 'model Number', 'Model Number'],
      unit: ['入库单位', '单位', 'unit', 'asset_unit', 'assetunit', '计量单位', 'unit of measure', 'Unit'],
      requirement: ['领用要求', '使用要求', 'requirement', 'requirement_desc', 'usage_requirement', 'Requirement', 'Usage Requirement'],
      quantity: ['入库总量', '数量', 'quantity', 'total', 'amount', '入库数量'],
      source: ['来源', 'source', 'origin', 'from'],
      remarks: ['备注说明信息', '备注', '说明', 'remarks', 'notes', 'description', 'description']
    };
    
    // 确定实际使用的列名
    const actualColumns = {};
    for (const [standardName, possibleNames] of Object.entries(columnMappings)) {
      actualColumns[standardName] = possibleNames.find(name => dataKeys.includes(name));
    }
    
    console.log('映射的列:', actualColumns);
    
    // 检查是否找到了必要的列
    const missingColumns = [];
    for (const [standardName, actualName] of Object.entries(actualColumns)) {
      if (!actualName) {
        missingColumns.push(standardName);
      }
    }
    
    if (missingColumns.length > 0) {
      console.warn(`警告: 以下必要列未找到: ${missingColumns.join(', ')}`);
      console.log('请确保Excel文件包含资产名称、分类等必要信息');
      return;
    }
    
    // 导入资产数据
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // 根据映射获取数据
      const assetData = {
        name: row[actualColumns.name],
        category_name: row[actualColumns.category], // 我们需要先确保分类存在
        brand: row[actualColumns.brand] || '',
        model: row[actualColumns.model] || '',
        unit: row[actualColumns.unit],
        requirement: row[actualColumns.requirement] || '',
        remarks: row[actualColumns.remarks] || ''
      };

      // 验证必要字段
      if (!assetData.name || !assetData.category_name || !assetData.unit) {
        console.warn(`跳过第 ${i + 1} 行: 缺少必要字段`, assetData);
        continue;
      }

      try {
        // 首先检查分类是否存在，如果不存在则创建
        const categoryId = await ensureCategoryExists(assetData.category_name, token);

        // 创建资产
        const assetResult = await createAsset({
          name: assetData.name,
          category_id: categoryId,
          brand: assetData.brand,
          model: assetData.model,
          unit: assetData.unit,
          requirement: assetData.requirement
        }, token);

        console.log(`成功导入资产: ${assetData.name}`);

        // 如果有入库总量和来源信息，可以进一步处理库存入库
        if (actualColumns.quantity && row[actualColumns.quantity] && actualColumns.source && row[actualColumns.source]) {
          const quantity = parseFloat(row[actualColumns.quantity]);
          const source = row[actualColumns.source];

          if (!isNaN(quantity) && source) {
            await createInventoryInbound(assetResult.asset_id, quantity, source, token);
            console.log(`已为资产 ${assetData.name} 创建入库记录: ${quantity} ${assetData.unit}`);
          }
        }
      } catch (error) {
        console.error(`导入资产失败 (第 ${i + 1} 行):`, assetData.name, error.message);
      }
    }
    
    console.log('资产导入完成');
  } catch (error) {
    console.error('导入过程中发生错误:', error);
  }
}

// 确保分类存在的辅助函数
async function ensureCategoryExists(categoryName, token) {
  try {
    // 首先尝试获取现有分类
    const response = await fetch('http://localhost:3000/api/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const categories = await response.json();
      const existingCategory = categories.find(cat => cat.category_name === categoryName);
      
      if (existingCategory) {
        return existingCategory.category_id;
      }
    }
    
    // 如果分类不存在，则创建新分类
    const createResponse = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category_name: categoryName,
        description: `自动创建的分类: ${categoryName}`
      })
    });
    
    if (createResponse.ok) {
      const newCategory = await createResponse.json();
      console.log(`创建新分类: ${categoryName}`);
      return newCategory.category_id;
    } else {
      throw new Error(`创建分类失败: ${createResponse.status}`);
    }
  } catch (error) {
    console.error(`处理分类 "${categoryName}" 时出错:`, error);
    throw error;
  }
}

// 创建资产的辅助函数
async function createAsset(assetData, token) {
  try {
    const response = await fetch('http://localhost:3000/api/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assetData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 创建库存入库记录的辅助函数
async function createInventoryInbound(assetId, quantity, source, token) {
  try {
    const response = await fetch('http://localhost:3000/api/inventory/inbound', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset_id: assetId,
        quantity: quantity,
        source: source,
        operator_id: 1 // 假设默认操作员ID为1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node import_assets.js <excel_file_path> <auth_token>');
    console.log('示例: node import_assets.js ./plain_example.xlsx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    return;
  }
  
  const excelFilePath = args[0];
  const token = args[1];
  
  // 检查文件是否存在
  if (!fs.existsSync(excelFilePath)) {
    console.error(`错误: 文件不存在 ${excelFilePath}`);
    return;
  }
  
  console.log('开始导入资产数据...');
  await importAssetsFromExcel(excelFilePath, token);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { importAssetsFromExcel, ensureCategoryExists, createAsset };
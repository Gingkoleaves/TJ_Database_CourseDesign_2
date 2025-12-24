// 资产管理页面组件
import { assetAPI, categoryAPI } from '../services/api.js';

export function AssetsPage() {
  const assetsPage = document.createElement('div');
  assetsPage.className = 'container';
  
  assetsPage.innerHTML = `
    <h2>资产定义管理</h2>
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">添加新资产</h5>
        <form id="asset-form">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="asset-name">资产名称 *</label>
                <input type="text" id="asset-name" class="form-control" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="asset-category">分类 *</label>
                <select id="asset-category" class="form-control" required>
                  <option value="">选择分类</option>
                </select>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label for="asset-brand">品牌</label>
                <input type="text" id="asset-brand" class="form-control">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="asset-model">型号</label>
                <input type="text" id="asset-model" class="form-control">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="asset-unit">单位 *</label>
                <input type="text" id="asset-unit" class="form-control" required>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="asset-requirement">领用要求</label>
            <textarea id="asset-requirement" class="form-control"></textarea>
          </div>
          <button type="submit" class="btn btn-primary mt-3">添加资产</button>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">资产列表</h5>
        <button id="refresh-assets" class="btn btn-secondary">刷新</button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>分类</th>
                <th>品牌</th>
                <th>型号</th>
                <th>单位</th>
                <th>领用要求</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="assets-table-body">
              <!-- 数据将通过JS填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // 加载分类选项和资产列表
  loadCategoriesAndAssets(assetsPage);
  
  // 处理表单提交
  const form = assetsPage.querySelector('#asset-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('asset-name').value;
    const categoryId = document.getElementById('asset-category').value;
    const brand = document.getElementById('asset-brand').value;
    const model = document.getElementById('asset-model').value;
    const unit = document.getElementById('asset-unit').value;
    const requirement = document.getElementById('asset-requirement').value;
    
    try {
      await assetAPI.create({
        name,
        category_id: parseInt(categoryId),
        brand,
        model,
        unit,
        requirement
      });
      
      // 重置表单
      form.reset();
      
      // 刷新资产列表
      loadAssets(assetsPage);
    } catch (error) {
      alert('添加资产失败: ' + error.message);
    }
  });
  
  // 刷新按钮事件
  assetsPage.querySelector('#refresh-assets').addEventListener('click', () => {
    loadAssets(assetsPage);
  });
  
  return assetsPage;
}

async function loadCategoriesAndAssets(container) {
  try {
    // 加载分类
    const categories = await categoryAPI.getAll();
    const categorySelect = container.querySelector('#asset-category');
    categorySelect.innerHTML = '<option value="">选择分类</option>';
    
    if (categories) {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.category_id;
        option.textContent = category.category_name;
        categorySelect.appendChild(option);
      });
    }
    
    // 加载资产
    await loadAssets(container);
  } catch (error) {
    console.error('加载分类和资产失败:', error);
  }
}

async function loadAssets(container) {
  try {
    const assets = await assetAPI.getAll();
    const tbody = container.querySelector('#assets-table-body');
    
    tbody.innerHTML = '';
    
    if (assets && assets.length > 0) {
      assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${asset.name}</td>
          <td>${asset.category_name}</td>
          <td>${asset.brand || ''}</td>
          <td>${asset.model || ''}</td>
          <td>${asset.unit || ''}</td>
          <td>${asset.requirement || ''}</td>
          <td>
            <span class="badge ${asset.is_active ? 'bg-success' : 'bg-secondary'}">
              ${asset.is_active ? '有效' : '无效'}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-warning edit-asset" data-id="${asset.asset_id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-asset" data-id="${asset.asset_id}">删除</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // 添加编辑和删除事件
      attachAssetEventListeners(container);
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="8" class="text-center">没有找到资产</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载资产失败:', error);
  }
}

function attachAssetEventListeners(container) {
  // 编辑按钮事件
  container.querySelectorAll('.edit-asset').forEach(button => {
    button.addEventListener('click', async () => {
      const assetId = button.getAttribute('data-id');
      // 实现编辑功能
      const asset = await assetAPI.getById(assetId);
      
      // 填充表单进行编辑
      document.getElementById('asset-name').value = asset.name;
      document.getElementById('asset-category').value = asset.category_id;
      document.getElementById('asset-brand').value = asset.brand || '';
      document.getElementById('asset-model').value = asset.model || '';
      document.getElementById('asset-unit').value = asset.unit || '';
      document.getElementById('asset-requirement').value = asset.requirement || '';
      
      // 修改表单提交行为以更新资产
      const originalForm = container.querySelector('#asset-form');
      const originalSubmit = originalForm.onsubmit;
      
      originalForm.onsubmit = async (e) => {
        e.preventDefault();
        
        try {
          await assetAPI.update(assetId, {
            name: document.getElementById('asset-name').value,
            category_id: parseInt(document.getElementById('asset-category').value),
            brand: document.getElementById('asset-brand').value,
            model: document.getElementById('asset-model').value,
            unit: document.getElementById('asset-unit').value,
            requirement: document.getElementById('asset-requirement').value
          });
          
          // 重置表单和提交行为
          originalForm.reset();
          originalForm.onsubmit = originalSubmit;
          
          // 刷新资产列表
          loadAssets(container);
        } catch (error) {
          alert('更新资产失败: ' + error.message);
        }
      };
    });
  });
  
  // 删除按钮事件
  container.querySelectorAll('.delete-asset').forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('确定要删除这个资产吗？')) {
        const assetId = button.getAttribute('data-id');
        try {
          await assetAPI.delete(assetId);
          loadAssets(container); // 刷新列表
        } catch (error) {
          alert('删除资产失败: ' + error.message);
        }
      }
    });
  });
}
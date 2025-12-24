// 分类管理页面组件
import { categoryAPI } from '../services/api.js';

export function CategoriesPage() {
  const categoriesPage = document.createElement('div');
  categoriesPage.className = 'container';
  
  categoriesPage.innerHTML = `
    <h2>分类管理</h2>
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">添加新分类</h5>
        <form id="category-form">
          <div class="form-group">
            <label for="category-name">分类名称 *</label>
            <input type="text" id="category-name" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary">添加分类</button>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">分类列表</h5>
        <button id="refresh-categories" class="btn btn-secondary">刷新</button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>分类名称</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="categories-table-body">
              <!-- 数据将通过JS填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // 加载分类列表
  loadCategories(categoriesPage);
  
  // 处理表单提交
  const form = categoriesPage.querySelector('#category-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value;
    
    try {
      await categoryAPI.create({ category_name: name });
      
      // 重置表单
      form.reset();
      
      // 刷新分类列表
      loadCategories(categoriesPage);
    } catch (error) {
      alert('添加分类失败: ' + error.message);
    }
  });
  
  // 刷新按钮事件
  categoriesPage.querySelector('#refresh-categories').addEventListener('click', () => {
    loadCategories(categoriesPage);
  });
  
  return categoriesPage;
}

async function loadCategories(container) {
  try {
    const categories = await categoryAPI.getAll();
    const tbody = container.querySelector('#categories-table-body');
    
    tbody.innerHTML = '';
    
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${category.category_id}</td>
          <td>${category.category_name}</td>
          <td>
            <button class="btn btn-sm btn-warning edit-category" data-id="${category.category_id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-category" data-id="${category.category_id}">删除</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // 添加编辑和删除事件
      attachCategoryEventListeners(container);
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" class="text-center">没有找到分类</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

function attachCategoryEventListeners(container) {
  // 编辑按钮事件
  container.querySelectorAll('.edit-category').forEach(button => {
    button.addEventListener('click', async () => {
      const categoryId = button.getAttribute('data-id');
      // 实现编辑功能
      const category = await categoryAPI.getById(categoryId);
      
      // 填充表单进行编辑
      document.getElementById('category-name').value = category.category_name;
      
      // 修改表单提交行为以更新分类
      const originalForm = container.querySelector('#category-form');
      const originalSubmit = originalForm.onsubmit;
      
      originalForm.onsubmit = async (e) => {
        e.preventDefault();
        
        try {
          await categoryAPI.update(categoryId, {
            category_name: document.getElementById('category-name').value
          });
          
          // 重置表单和提交行为
          originalForm.reset();
          originalForm.onsubmit = originalSubmit;
          
          // 刷新分类列表
          loadCategories(container);
        } catch (error) {
          alert('更新分类失败: ' + error.message);
        }
      };
    });
  });
  
  // 删除按钮事件
  container.querySelectorAll('.delete-category').forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('确定要删除这个分类吗？注意：如果有资产使用此分类，则无法删除！')) {
        const categoryId = button.getAttribute('data-id');
        try {
          await categoryAPI.delete(categoryId);
          loadCategories(container); // 刷新列表
        } catch (error) {
          alert('删除分类失败: ' + error.message);
        }
      }
    });
  });
}
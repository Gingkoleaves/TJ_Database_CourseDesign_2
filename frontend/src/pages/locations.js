// 位置管理页面组件
import { locationAPI } from '../services/api.js';

export function LocationsPage() {
  const locationsPage = document.createElement('div');
  locationsPage.className = 'container';
  
  locationsPage.innerHTML = `
    <h2>位置管理</h2>
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">添加新位置</h5>
        <form id="location-form">
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label for="room">房间号 *</label>
                <input type="text" id="room" class="form-control" required>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="cabinet">柜子号</label>
                <input type="text" id="cabinet" class="form-control">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="shelf">货架号</label>
                <input type="text" id="shelf" class="form-control">
              </div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">添加位置</button>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">位置列表</h5>
        <button id="refresh-locations" class="btn btn-secondary">刷新</button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>房间</th>
                <th>柜子</th>
                <th>货架</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="locations-table-body">
              <!-- 数据将通过JS填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // 加载位置列表
  loadLocations(locationsPage);
  
  // 处理表单提交
  const form = locationsPage.querySelector('#location-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const room = document.getElementById('room').value;
    const cabinet = document.getElementById('cabinet').value || null;
    const shelf = document.getElementById('shelf').value || null;
    
    try {
      await locationAPI.create({ room, cabinet, shelf });
      
      // 重置表单
      form.reset();
      
      // 刷新位置列表
      loadLocations(locationsPage);
    } catch (error) {
      alert('添加位置失败: ' + error.message);
    }
  });
  
  // 刷新按钮事件
  locationsPage.querySelector('#refresh-locations').addEventListener('click', () => {
    loadLocations(locationsPage);
  });
  
  return locationsPage;
}

async function loadLocations(container) {
  try {
    const locations = await locationAPI.getAll();
    const tbody = container.querySelector('#locations-table-body');
    
    tbody.innerHTML = '';
    
    if (locations && locations.length > 0) {
      locations.forEach(location => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${location.location_id}</td>
          <td>${location.room}</td>
          <td>${location.cabinet || ''}</td>
          <td>${location.shelf || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning edit-location" data-id="${location.location_id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-location" data-id="${location.location_id}">删除</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // 添加编辑和删除事件
      attachLocationEventListeners(container);
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="text-center">没有找到位置</td>';
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('加载位置失败:', error);
  }
}

function attachLocationEventListeners(container) {
  // 编辑按钮事件
  container.querySelectorAll('.edit-location').forEach(button => {
    button.addEventListener('click', async () => {
      const locationId = button.getAttribute('data-id');
      // 实现编辑功能
      const location = await locationAPI.getById(locationId);
      
      // 填充表单进行编辑
      document.getElementById('room').value = location.room;
      document.getElementById('cabinet').value = location.cabinet || '';
      document.getElementById('shelf').value = location.shelf || '';
      
      // 修改表单提交行为以更新位置
      const originalForm = container.querySelector('#location-form');
      const originalSubmit = originalForm.onsubmit;
      
      originalForm.onsubmit = async (e) => {
        e.preventDefault();
        
        try {
          await locationAPI.update(locationId, {
            room: document.getElementById('room').value,
            cabinet: document.getElementById('cabinet').value || null,
            shelf: document.getElementById('shelf').value || null
          });
          
          // 重置表单和提交行为
          originalForm.reset();
          originalForm.onsubmit = originalSubmit;
          
          // 刷新位置列表
          loadLocations(container);
        } catch (error) {
          alert('更新位置失败: ' + error.message);
        }
      };
    });
  });
  
  // 删除按钮事件
  container.querySelectorAll('.delete-location').forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('确定要删除这个位置吗？注意：如果有库存使用此位置，则无法删除！')) {
        const locationId = button.getAttribute('data-id');
        try {
          await locationAPI.delete(locationId);
          loadLocations(container); // 刷新列表
        } catch (error) {
          alert('删除位置失败: ' + error.message);
        }
      }
    });
  });
}
// 仪表板页面组件
import { inventoryAPI, locationAPI } from '../services/api.js';

export function Dashboard() {
  const dashboard = document.createElement('div');
  dashboard.className = 'container';
  
  dashboard.innerHTML = `
    <h2>仪表板</h2>
    <div class="row">
      <div class="col-md-3 mb-4">
        <div class="card text-center bg-primary text-white">
          <div class="card-body">
            <h5 class="card-title">总库存</h5>
            <p class="card-text display-4" id="total-inventory">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card text-center bg-warning text-white">
          <div class="card-body">
            <h5 class="card-title">即将过期</h5>
            <p class="card-text display-4" id="expiring-count">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card text-center bg-success text-white">
          <div class="card-body">
            <h5 class="card-title">资产种类</h5>
            <p class="card-text display-4" id="asset-types">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card text-center bg-info text-white">
          <div class="card-body">
            <h5 class="card-title">存储位置</h5>
            <p class="card-text display-4" id="location-count">0</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h5>即将过期的资产</h5>
          </div>
          <div class="card-body">
            <table class="table">
              <thead>
                <tr>
                  <th>资产名称</th>
                  <th>分类</th>
                  <th>品牌型号</th>
                  <th>剩余数量</th>
                  <th>到期日期</th>
                </tr>
              </thead>
              <tbody id="expiring-assets-body">
                <!-- 数据将通过JS填充 -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5>快速操作</h5>
          </div>
          <div class="card-body">
            <div class="list-group">
              <a href="#inventory" class="list-group-item list-group-item-action">查看库存</a>
              <a href="#assets" class="list-group-item list-group-item-action">管理资产</a>
              <a href="#categories" class="list-group-item list-group-item-action">管理分类</a>
              <a href="#locations" class="list-group-item list-group-item-action">管理位置</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 加载仪表板数据
  loadDashboardData(dashboard);
  
  return dashboard;
}

async function loadDashboardData(container) {
  try {
    // 加载库存汇总
    const summary = await inventoryAPI.getSummary();
    container.querySelector('#total-inventory').textContent = summary ? summary.length : 0;
    container.querySelector('#asset-types').textContent = summary ? summary.length : 0;

    // 加载所有存储位置数量
    const locations = await locationAPI.getAll();
    container.querySelector('#location-count').textContent = locations ? locations.length : 0;

    // 加载即将过期的资产
    const expiring = await inventoryAPI.getExpiring();
    container.querySelector('#expiring-count').textContent = expiring ? expiring.length : 0;

    // 填充即将过期的资产表格
    const expiringBody = container.querySelector('#expiring-assets-body');
    expiringBody.innerHTML = '';

    if (expiring && expiring.length > 0) {
      expiring.slice(0, 5).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.category_name}</td>
          <td>${item.brand} ${item.model}</td>
          <td>${item.current_quantity}</td>
          <td>${item.expiry_date || 'N/A'}</td>
        `;
        expiringBody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="text-center">没有即将过期的资产</td>';
      expiringBody.appendChild(row);
    }
  } catch (error) {
    console.error('加载仪表板数据失败:', error);
  }
}
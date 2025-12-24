// 库存管理页面组件
import { inventoryAPI, assetAPI, locationAPI } from '../services/api.js';

export function InventoryPage() {
  const inventoryPage = document.createElement('div');
  inventoryPage.className = 'container';
  
  inventoryPage.innerHTML = `
    <h2>库存管理</h2>
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link active" href="#" data-tab="overview">库存总览</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="inbound">入库操作</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="outbound">出库操作</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" data-tab="transfer">转移操作</a>
      </li>
    </ul>
    
    <div id="inventory-content">
      <!-- 库存总览标签页 -->
      <div id="overview-tab" class="tab-content">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">库存总览</h5>
            <div>
              <input type="text" id="inventory-search-input" class="form-control d-inline-block" style="width:200px" placeholder="模糊搜索...">
              <button id="inventory-search-btn" class="btn btn-primary ml-2">搜索</button>
              <button id="refresh-overview" class="btn btn-secondary ml-2">刷新</button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>资产名称</th>
                    <th>分类</th>
                    <th>品牌</th>
                    <th>型号</th>
                    <th>单位</th>
                    <th>总数量</th>
                  </tr>
                </thead>
                <tbody id="overview-table-body">
                  <!-- 数据将通过JS填充 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 入库操作标签页 -->
      <div id="inbound-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">入库操作</h5>
            <form id="inbound-form">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="inbound-asset">资产 *</label>
                    <select id="inbound-asset" class="form-control" required>
                      <option value="">选择资产</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="inbound-location">位置 *</label>
                    <select id="inbound-location" class="form-control" required>
                      <option value="">选择位置</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="inbound-quantity">数量 *</label>
                    <input type="number" id="inbound-quantity" class="form-control" min="1" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="inbound-expiry">过期日期</label>
                    <input type="date" id="inbound-expiry" class="form-control">
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="inbound-source">来源</label>
                <input type="text" id="inbound-source" class="form-control">
              </div>
              <div class="form-group">
                <label for="inbound-remarks">备注</label>
                <textarea id="inbound-remarks" class="form-control"></textarea>
              </div>
              <input type="hidden" id="inbound-operator" value="1"> <!-- 操作员ID，实际应用中应从用户信息获取 -->
              <button type="submit" class="btn btn-success">执行入库</button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- 出库操作标签页 -->
      <div id="outbound-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">出库操作</h5>
            <form id="outbound-form">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="outbound-batch">库存批次 *</label>
                    <select id="outbound-batch" class="form-control" required>
                      <option value="">选择批次</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="outbound-quantity">数量 *</label>
                    <input type="number" id="outbound-quantity" class="form-control" min="1" required>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="outbound-destination">去向 *</label>
                <input type="text" id="outbound-destination" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="outbound-remarks">备注</label>
                <textarea id="outbound-remarks" class="form-control"></textarea>
              </div>
              <input type="hidden" id="outbound-operator" value="1"> <!-- 操作员ID -->
              <button type="submit" class="btn btn-warning">执行出库</button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- 转移操作标签页 -->
      <div id="transfer-tab" class="tab-content" style="display: none;">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">库存转移</h5>
            <form id="transfer-form">
              <div class="row">
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="transfer-batch">库存批次 *</label>
                    <select id="transfer-batch" class="form-control" required>
                      <option value="">选择批次</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="transfer-new-location">新位置 *</label>
                    <select id="transfer-new-location" class="form-control" required>
                      <option value="">选择位置</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="transfer-quantity">转移数量 *</label>
                    <input type="number" id="transfer-quantity" class="form-control" min="1" required>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="transfer-remarks">备注</label>
                <textarea id="transfer-remarks" class="form-control"></textarea>
              </div>
              <input type="hidden" id="transfer-operator" value="1"> <!-- 操作员ID -->
              <button type="submit" class="btn btn-info">执行转移</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 初始化库存管理页面
  initializeInventoryPage(inventoryPage);
  
  return inventoryPage;
}

async function initializeInventoryPage(container) {
  // 加载资产和位置选项
  await loadAssetsAndLocations(container);

  // 加载库存总览
  await loadInventoryOverview(container);

  // 设置标签页切换
  setupTabNavigation(container);

  // 设置表单提交事件
  setupFormSubmissions(container);

  // 设置模糊搜索事件
  const searchBtn = container.querySelector('#inventory-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const keyword = container.querySelector('#inventory-search-input').value.trim();
      if (!keyword) {
        alert('请输入搜索关键字');
        return;
      }
      const results = await inventoryAPI.search(keyword);
      renderInventoryOverview(container, results);
    });
  }
}

// 渲染库存总览表格（支持复用）
function renderInventoryOverview(container, summary) {
  const tbody = container.querySelector('#overview-table-body');
  tbody.innerHTML = '';
  if (summary && summary.length > 0) {
    summary.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category_name}</td>
        <td>${item.brand || ''}</td>
        <td>${item.model || ''}</td>
        <td>${item.unit || ''}</td>
        <td>${item.total_quantity}</td>
      `;
      tbody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">没有库存信息</td>';
    tbody.appendChild(row);
  }
}

async function loadAssetsAndLocations(container) {
  try {
    // 加载资产选项，支持模糊搜索
    const assets = await assetAPI.getAll();
    const inboundAssetSelect = container.querySelector('#inbound-asset');
    const outboundBatchSelect = container.querySelector('#outbound-batch');
    const transferBatchSelect = container.querySelector('#transfer-batch');

    // 增加资产模糊搜索输入框
    let searchInput = container.querySelector('#inbound-asset-search');
    if (!searchInput) {
      const label = inboundAssetSelect.parentElement.querySelector('label');
      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'form-control mb-2';
      searchInput.placeholder = '输入资产名称/厂家/型号进行搜索';
      searchInput.id = 'inbound-asset-search';
      label.parentElement.insertBefore(searchInput, inboundAssetSelect);
    }

    // 重置选项
    function renderAssetOptions(filter = '') {
      inboundAssetSelect.innerHTML = '<option value="">选择资产</option>';
      if (assets) {
        assets.filter(asset => {
          const key = `${asset.name} ${asset.brand || ''} ${asset.model || ''}`.toLowerCase();
          return key.includes(filter.toLowerCase());
        }).forEach(asset => {
          const option = document.createElement('option');
          option.value = asset.asset_id;
          option.textContent = `${asset.name} / ${asset.brand || ''} / ${asset.model || ''}`;
          inboundAssetSelect.appendChild(option);
        });
      }
    }
    renderAssetOptions();
    searchInput.addEventListener('input', e => {
      renderAssetOptions(e.target.value);
    });

    outboundBatchSelect.innerHTML = '<option value="">选择批次</option>';
    transferBatchSelect.innerHTML = '<option value="">选择批次</option>';
    
    // 加载位置选项
    const locations = await locationAPI.getAll();
    const inboundLocationSelect = container.querySelector('#inbound-location');
    const transferLocationSelect = container.querySelector('#transfer-new-location');
    
    // 重置选项
    inboundLocationSelect.innerHTML = '<option value="">选择位置</option>';
    transferLocationSelect.innerHTML = '<option value="">选择位置</option>';
    
    if (locations) {
      locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.location_id;
        option.textContent = `${location.room} - ${location.cabinet || 'N/A'} - ${location.shelf || 'N/A'}`;
        
        inboundLocationSelect.appendChild(option.cloneNode(true));
        transferLocationSelect.appendChild(option);
      });
    }
    
    // 加载库存批次用于出库和转移
    const batches = await inventoryAPI.getBatches();
    if (batches) {
      batches.forEach(batch => {
        if (batch.current_quantity > 0) { // 只显示有库存的批次
          const option1 = document.createElement('option');
          option1.value = batch.batch_id;
          option1.textContent = `${batch.asset_name} - ${batch.current_quantity} ${batch.unit} - ${batch.room}`;
          
          const option2 = option1.cloneNode(true);
          
          outboundBatchSelect.appendChild(option1);
          transferBatchSelect.appendChild(option2);
        }
      });
    }
  } catch (error) {
    console.error('加载资产和位置失败:', error);
  }
}

async function loadInventoryOverview(container) {
  try {
    const summary = await inventoryAPI.getSummary();
    renderInventoryOverview(container, summary);
  } catch (error) {
    console.error('加载库存总览失败:', error);
  }
}

function setupTabNavigation(container) {
  const tabs = container.querySelectorAll('.nav-link');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 移除当前激活的标签和内容
      container.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      
      // 激活点击的标签
      tab.classList.add('active');
      
      // 显示对应的内容
      const tabName = tab.getAttribute('data-tab');
      container.querySelector(`#${tabName}-tab`).style.display = 'block';
    });
  });
  
  // 刷新按钮事件
  container.querySelector('#refresh-overview').addEventListener('click', () => {
    loadInventoryOverview(container);
  });
}

function setupFormSubmissions(container) {
  // 入库表单提交
  const inboundForm = container.querySelector('#inbound-form');
  inboundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const assetId = document.getElementById('inbound-asset').value;
    const locationId = document.getElementById('inbound-location').value;
    const quantity = document.getElementById('inbound-quantity').value;
    const expiry = document.getElementById('inbound-expiry').value;
    const source = document.getElementById('inbound-source').value;
    const remarks = document.getElementById('inbound-remarks').value;
    const operatorId = document.getElementById('inbound-operator').value;
    
    try {
      await inventoryAPI.inbound({
        asset_id: parseInt(assetId),
        location_id: parseInt(locationId),
        quantity: parseInt(quantity),
        expiry_date: expiry || null,
        source: source || 'Unknown',
        remarks: remarks || null,
        operator_id: parseInt(operatorId)
      });
      
      // 重置表单
      inboundForm.reset();
      
      // 重新加载数据
      await loadAssetsAndLocations(container);
      await loadInventoryOverview(container);
      
      alert('入库操作成功');
    } catch (error) {
      alert('入库操作失败: ' + error.message);
    }
  });
  
  // 出库表单提交
  const outboundForm = container.querySelector('#outbound-form');
  outboundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const batchId = document.getElementById('outbound-batch').value;
    const quantity = document.getElementById('outbound-quantity').value;
    const destination = document.getElementById('outbound-destination').value;
    const remarks = document.getElementById('outbound-remarks').value;
    const operatorId = document.getElementById('outbound-operator').value;
    
    if (parseInt(quantity) <= 0) {
      alert('出库数量必须大于0');
      return;
    }
    
    try {
      await inventoryAPI.outbound({
        batch_id: parseInt(batchId),
        quantity: parseInt(quantity),
        destination: destination || 'Unknown',
        remarks: remarks || null,
        operator_id: parseInt(operatorId)
      });
      
      // 重置表单
      outboundForm.reset();
      
      // 重新加载数据
      await loadAssetsAndLocations(container);
      await loadInventoryOverview(container);
      
      alert('出库操作成功');
    } catch (error) {
      alert('出库操作失败: ' + error.message);
    }
  });
  
  // 转移表单提交
  const transferForm = container.querySelector('#transfer-form');
  transferForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const batchId = document.getElementById('transfer-batch').value;
    const newLocationId = document.getElementById('transfer-new-location').value;
    const quantity = document.getElementById('transfer-quantity').value;
    const remarks = document.getElementById('transfer-remarks').value;
    const operatorId = document.getElementById('transfer-operator').value;
    
    if (parseInt(quantity) <= 0) {
      alert('转移数量必须大于0');
      return;
    }
    
    try {
      await inventoryAPI.transfer({
        batch_id: parseInt(batchId),
        new_location_id: parseInt(newLocationId),
        quantity: parseInt(quantity),
        remarks: remarks || null,
        operator_id: parseInt(operatorId)
      });
      
      // 重置表单
      transferForm.reset();
      
      // 重新加载数据
      await loadAssetsAndLocations(container);
      await loadInventoryOverview(container);
      
      alert('转移操作成功');
    } catch (error) {
      alert('转移操作失败: ' + error.message);
    }
  });
}
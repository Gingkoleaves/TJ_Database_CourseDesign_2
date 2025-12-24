# 消耗性资产管理系统 - 部署指南

## 部署前准备

### 系统要求
- 操作系统: Windows 7+ / Linux / macOS
- Node.js: v16.0.0 或更高版本
- MySQL: v5.7 或更高版本
- 内存: 2GB RAM 最低，推荐 4GB+
- 磁盘空间: 至少 1GB 可用空间

## 1. 数据库部署

### 1.1 安装MySQL
- 从 https://dev.mysql.com/downloads/mysql/ 下载并安装MySQL
- 记录root用户密码

### 1.2 创建数据库
```bash
mysql -u root -p
```

```sql
CREATE DATABASE consumable_asset_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'Y-0000:)';
GRANT ALL PRIVILEGES ON consumable_asset_management.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.3 导入数据库结构
```bash
mysql -u inventory_user -p consumable_asset_management < database/schema.sql
mysql -u inventory_user -p consumable_asset_management < database/views.sql
mysql -u inventory_user -p consumable_asset_management < database/stored_procedures.sql
```

## 2. 后端部署

### 2.1 安装依赖
```bash
cd backend
npm install
```

### 2.2 配置环境变量
创建 `.env` 文件:
```
DB_HOST=localhost
DB_USER=inventory_user
DB_PASSWORD=Y-0000:)
DB_NAME=consumable_asset_management
DB_PORT=3306
JWT_SECRET=your_very_secure_jwt_secret_key_here
PORT=3000
NODE_ENV=production
```

### 2.3 启动后端服务
```bash
npm start
```

或者使用PM2进行进程管理:
```bash
npm install -g pm2
pm2 start server.js --name "inventory-backend"
pm2 startup
pm2 save
```

## 3. 前端部署

### 3.1 静态文件服务
前端可以部署到任何静态文件服务器，如Nginx、Apache或使用Node.js的serve工具：

```bash
npm install -g serve
npx live-server ./public --port=3001
```

### 3.2 配置API代理（如果需要）
如果前端和后端部署在不同端口，需要配置代理或CORS。

## 4. Nginx反向代理配置（可选）

创建nginx配置文件:
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;  # 前端端口
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;  # 后端端口
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. 系统配置

### 5.1 安全配置
- 设置强密码策略
- 配置防火墙限制访问端口
- 启用HTTPS（推荐使用Let's Encrypt）

### 5.2 性能配置
- 配置数据库连接池大小
- 设置适当的内存限制
- 配置日志轮转

## 6. 启动脚本

### Windows批处理文件 (start-app.bat)
```batch
@echo off
echo 启动消耗性资产管理系统...

cd /d "D:\Tongji\DataBasesDesign\backend"
start "Backend Server" cmd /k "npm start"

timeout /t 5 /nobreak >nul

cd /d "D:\Tongji\DataBasesDesign\frontend"
start "Frontend Server" cmd /k "npx serve -s . -l 3001"

echo 系统已启动！
echo 后端访问地址: http://localhost:3000
echo 前端访问地址: http://localhost:3001
pause
```

### Linux启动脚本 (start-app.sh)
```bash
#!/bin/bash
cd /path/to/your/project/backend
pm2 start server.js --name "inventory-backend"

cd /path/to/your/project/frontend
npx serve -s . -l 3001 > frontend.log 2>&1 &
```

## 7. 备份和维护

### 7.1 数据库备份
```bash
mysqldump -u inventory_user -p consumable_asset_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 7.2 定期维护
- 定期检查数据库性能
- 监控系统资源使用
- 定期更新依赖包
- 定期备份数据

## 8. 疑难解答

### 常见问题
- 如果无法连接数据库，检查MySQL是否运行且防火墙允许连接
- 如果API调用失败，确认CORS设置和后端服务运行状态
- 如果前端无法访问，确认服务端口和网络连接

### 日志文件
- 后端日志: backend/logs/
- 数据库日志: MySQL数据目录
- 系统日志: 根据操作系统位置

## 9. 升级指南

### 版本升级
1. 备份数据库和配置文件
2. 下载新版本代码
3. 安装新依赖
4. 执行数据库迁移脚本（如果有的话）
5. 重启服务

### 数据库升级
- 升级前务必备份数据
- 根据版本发布说明执行特定的升级脚本
- 测试升级后的系统功能

此系统已准备就绪，可以根据以上说明进行部署。
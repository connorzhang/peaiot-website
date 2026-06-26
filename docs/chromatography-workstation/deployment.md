# 部署指南

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 环境要求

### 硬件要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | ARMv7 / ARM64 | ARM64 |
| 内存 | 256MB | 512MB |
| 存储 | 1GB | 4GB |

### 软件要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Linux | Debian/Ubuntu | 推荐 |
| Go | 1.22+ | 编译环境 |

---

## 编译指南

### 1. 交叉编译（Windows）

```powershell
cd src/edge
$env:CGO_ENABLED=0
$env:GOOS="linux"
$env:GOARCH="arm64"
go build -trimpath -ldflags "-s -w" -o ../../collector-linux-arm64 ./cmd/collector
```

### 2. 使用 Makefile（Linux/macOS）

```bash
cd src/edge

# 编译当前平台
make build

# 交叉编译 Linux ARM64
make build-arm64

# 交叉编译 Linux AMD64
make build-linux
```

### 3. 编译产物

| 文件 | 平台 | 说明 |
|------|------|------|
| `collector-linux-amd64` | Linux x86_64 | 桌面/服务器 |
| `collector-linux-arm64` | Linux ARM64 | ARM设备 |
| `collector-linux-armv7` | Linux ARMv7 | 旧ARM设备 |

---

## 部署方式

### 1. 手动部署

```bash
# 创建安装目录
mkdir -p /opt/edge-collector

# 复制二进制文件
cp collector-linux-arm64 /opt/edge-collector/

# 设置权限
chmod +x /opt/edge-collector/collector-linux-arm64

# 运行
cd /opt/edge-collector
EDGE_HTTP_BIND=0.0.0.0 EDGE_ALLOW_CONTROL=1 ./collector-linux-arm64
```

### 2. 系统服务部署

**创建 systemd 服务文件** `/etc/systemd/system/edge-collector.service`：

```ini
[Unit]
Description=VOCs Chromatography Edge Collector
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/edge-collector
ExecStart=/opt/edge-collector/collector-linux-arm64
Environment=EDGE_HTTP_BIND=0.0.0.0
Environment=EDGE_ALLOW_CONTROL=1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**启动服务**：

```bash
systemctl daemon-reload
systemctl enable edge-collector
systemctl start edge-collector
```

### 3. 使用部署脚本

项目提供 PowerShell 部署脚本：

```powershell
.\src\edge\scripts\deploy-test-screen.ps1
```

脚本会：
- 通过 SSH 连接测试机
- 停止现有服务
- 上传新二进制文件
- 重启服务

---

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `EDGE_HTTP_BIND` | `127.0.0.1` | HTTP 服务绑定地址 |
| `EDGE_HTTP_PORT` | `8080` | HTTP 服务端口 |
| `EDGE_ALLOW_CONTROL` | `0` | 是否允许控制指令 |
| `EDGE_DATA_DIR` | `.run` | 数据存储目录 |

### 配置文件

配置文件位于 `.run/db/kv.json`：

```json
{
  "sys.config": "{\"driver_mode\":\"FID (Legacy Board)\",\"mqtt_enabled\":false}"
}
```

---

## 启动验证

### 检查服务状态

```bash
# 检查进程
ps aux | grep collector

# 检查端口
netstat -tulnp | grep 8080

# 检查日志
cat /opt/edge-collector/collector.log
```

### 健康检查

```bash
curl http://localhost:8080/api/v1/health
```

**响应示例**：
```json
{"status": "healthy", "version": "v0.3.88"}
```

---

## 升级指南

### 标准升级流程

```bash
# 1. 停止服务
systemctl stop edge-collector

# 2. 备份配置
cp -r /opt/edge-collector/.run /opt/edge-collector/.run.bak

# 3. 上传新二进制
cp collector-linux-arm64 /opt/edge-collector/

# 4. 启动服务
systemctl start edge-collector

# 5. 验证
curl http://localhost:8080/api/v1/health
```

### 自动升级脚本

项目提供快速部署脚本：

```powershell
.\src\edge\scripts\fast-deploy.ps1
```
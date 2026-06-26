# 故障排查

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 常见问题

### 1. 谱图无法进入循环分析

**现象**：点击开始后，单次分析完成但不自动进入下一次循环。

**原因分析**：
- 循环配置未正确设置
- DriverMode 配置问题导致自动循环逻辑未触发
- 硬件未发送 Cmd 150 开始确认

**解决方案**：

1. 检查循环配置：
```bash
curl http://localhost:8080/api/control/cycle
# 预期响应: {"cycleCount": 9999, "cycleInterval": 2}
```

2. 检查系统配置：
```bash
curl -u admin:123456 http://localhost:8080/api/sysconfig
# 确认 driver_mode 为 "FID (Legacy Board)" 或空字符串
```

3. 查看日志确认 Cmd 150 是否收到：
```bash
grep "cmd150" collector.log
```

**修复代码**（`engine_scheduler.go`）：
```go
// 修改前
if sysConfig.DriverMode == "modular" { ... }

// 修改后
isModular := sysConfig.DriverMode == "modular"
if isModular || sysConfig.DriverMode == "" { ... }
```

---

### 2. 方法中打开谱图显示无历史记录

**现象**：报表查询可以看到历史记录，但方法页面打开谱图时列表为空。

**原因分析**：
- 前端传递的 deviceId 与实际存储的 device_id 不匹配
- 前端使用了默认 deviceId=1，但数据库中存储的是真实设备ID

**解决方案**：

检查前端代码（`method.js`）：
```javascript
// 修改前
if (deviceId) { url += '&deviceId=' + encodeURIComponent(deviceId); }

// 修改后
if (deviceId && deviceId !== '1') { url += '&deviceId=' + encodeURIComponent(deviceId); }
```

**验证**：
```bash
curl "http://localhost:8080/api/animl/v1/HistoryService/Results?deviceId=GC97002020100110"
```

---

### 3. 服务无法启动

**现象**：运行 `collector.exe` 后立即退出。

**原因分析**：
- 端口被占用
- 数据目录权限问题
- 配置文件损坏

**解决方案**：

1. 检查端口占用：
```bash
netstat -tulnp | grep 8080
```

2. 更换端口启动：
```bash
EDGE_HTTP_PORT=8081 ./collector-linux-arm64
```

3. 检查数据目录权限：
```bash
ls -la .run/db/
```

4. 查看启动日志：
```bash
./collector-linux-arm64 2>&1 | head -50
```

---

### 4. 无法连接到硬件

**现象**：界面显示"未连接"状态。

**原因分析**：
- 串口配置错误
- 硬件未上电
- 驱动模式不匹配

**解决方案**：

1. 检查串口配置：
```bash
ls /dev/tty*
```

2. 检查驱动模式配置：
```bash
curl -u admin:123456 http://localhost:8080/api/sysconfig
# driver_mode 应与硬件匹配：
# - FID 检测器: "FID (Legacy Board)" 或空字符串
# - TCD 检测器: "modular"
```

3. 测试串口连接：
```bash
echo "测试" > /dev/ttyS0
```

---

### 5. SiLA 2 客户端无法连接

**现象**：gRPC 客户端连接失败。

**原因分析**：
- gRPC 端口未开放
- 防火墙阻止连接
- 服务未正确启动

**解决方案**：

1. 检查 gRPC 端口：
```bash
netstat -tulnp | grep 50051
```

2. 测试连接：
```bash
grpcurl -plaintext localhost:50051 list
```

3. 检查防火墙：
```bash
ufw allow 50051/tcp
```

---

## 日志分析

### 日志级别

通过环境变量控制日志级别：

```bash
# 调试模式（详细日志）
EDGE_LOG_LEVEL=debug ./collector-linux-arm64

# 生产模式（仅警告和错误）
EDGE_LOG_LEVEL=warn ./collector-linux-arm64
```

### 日志关键字搜索

```bash
# 搜索错误
grep "ERROR" collector.log

# 搜索警告
grep "WARN" collector.log

# 搜索特定指令
grep "cmd143\|cmd147\|cmd150" collector.log

# 搜索循环相关
grep "cycle\|auto" collector.log
```

---

## 数据恢复

### 备份数据库

```bash
cp .run/db/data.sqlite .run/db/data.sqlite.bak
```

### 恢复数据库

```bash
cp .run/db/data.sqlite.bak .run/db/data.sqlite
```

### 清理数据库（重置）

```bash
rm -rf .run/db/
mkdir -p .run/db/
```

---

## 性能优化

### 内存使用

**问题**：长时间运行后内存占用过高。

**解决方案**：
- 定期清理历史数据
- 调整日志级别为 warn
- 限制保留的历史记录数量

### CPU 使用

**问题**：CPU 占用率过高。

**解决方案**：
- 检查是否有无限循环
- 优化积分算法
- 调整采样频率

---

## 网络问题

### SSE 连接断开

**现象**：实时谱图数据停止更新。

**原因分析**：
- 网络不稳定
- 服务器超时配置
- 客户端断开

**解决方案**：

1. 检查 SSE 连接状态：
```bash
curl -N http://localhost:8080/events
```

2. 调整服务器超时配置（环境变量）：
```bash
EDGE_SSE_TIMEOUT=300 ./collector-linux-arm64
```

3. 客户端重连逻辑：
```javascript
const connect = () => {
  const eventSource = new EventSource('/events');
  eventSource.onerror = () => {
    setTimeout(connect, 5000);
  };
};
connect();
```

---

## 硬件兼容性

### FID 检测器

**配置要求**：
- driver_mode: `"FID (Legacy Board)"` 或空字符串
- 串口: `/dev/ttyS0` (通常)
- 波特率: 9600

### TCD 检测器

**配置要求**：
- driver_mode: `"modular"`
- 使用 Modbus/TCP 协议
- 需要配置 OPC-UA 服务器

---

## 联系支持

如遇到无法解决的问题，请提供以下信息：

1. **系统信息**：
   - 操作系统版本
   - CPU 架构
   - 内存大小

2. **服务日志**：
   ```bash
   cat collector.log | tail -100
   ```

3. **配置文件**：
   ```bash
   cat .run/db/kv.json
   ```

4. **问题描述**：
   - 问题现象
   - 复现步骤
   - 预期结果
   - 实际结果
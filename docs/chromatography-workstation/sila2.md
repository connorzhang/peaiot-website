# SiLA 2 集成

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 概述

SiLA 2 (Standardization in Lab Automation) 是实验室自动化领域的国际标准通信协议。本系统实现了 SiLA 2 标准接口，支持与符合 SiLA 2 标准的上位系统通信。

---

## 实现的接口

### 1. ChromatographService

**服务描述**：色谱仪控制接口

**命令**：

| 命令 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `StartRun` | 开始分析 | `NoParameters` | `StartedRun` |
| `StopRun` | 停止分析 | `NoParameters` | `StoppedRun` |
| `PauseRun` | 暂停分析 | `NoParameters` | `PausedRun` |
| `ResumeRun` | 恢复分析 | `NoParameters` | `ResumedRun` |
| `AbortRun` | 中止分析 | `NoParameters` | `AbortedRun` |
| `GetState` | 获取状态 | `NoParameters` | `ChromatographState` |

### 2. DetectorService

**服务描述**：检测器控制接口

**命令**：

| 命令 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `Ignite` | 点火控制 | `Ignite_Parameters` | `Ignite_Responses` |

**属性**：

| 属性 | 说明 | 类型 |
|------|------|------|
| `DetectorType` | 检测器类型 | String |
| `IgnitionState` | 点火状态 | Boolean |
| `SignalLevel` | 信号电平 | Double |

### 3. TemperatureController

**服务描述**：温度控制接口

**属性**：

| 属性 | 说明 | 类型 |
|------|------|------|
| `TemperatureSetpoint` | 温度设定值 | Double |
| `ActualTemperature` | 实际温度 | Double |
| `TemperatureStatus` | 温度状态 | String |

### 4. PneumaticController

**服务描述**：气路控制接口

**属性**：

| 属性 | 说明 | 类型 |
|------|------|------|
| `PressureSetpoint` | 压力设定值 | Double |
| `ActualPressure` | 实际压力 | Double |
| `FlowRate` | 流量 | Double |

### 5. HistoryService

**服务描述**：历史数据查询接口

**命令**：

| 命令 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `GetResults` | 查询历史结果 | `ResultQuery` | `[]AnalysisResult` |
| `GetRun` | 查询单条记录 | `RunQuery` | `AnalysisRun` |

---

## gRPC 接口

### 连接地址

```
grpc://host:50051
```

### 协议文件

协议定义位于 `src/edge/internal/sila2/proto/`：

| 文件 | 说明 |
|------|------|
| `chromatograph.proto` | 色谱仪服务 |
| `detector.proto` | 检测器服务 |
| `temperature.proto` | 温度控制服务 |
| `pneumatic.proto` | 气路控制服务 |

### 客户端示例

```go
import (
    "context"
    pb "chromatography-workstation/edge/internal/sila2/pb"
    "google.golang.org/grpc"
)

func main() {
    conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
    if err != nil {
        panic(err)
    }
    defer conn.Close()
    
    client := pb.NewChromatographServiceClient(conn)
    _, err = client.StartRun(context.Background(), &pb.StartRun_Parameters{})
}
```

---

## HTTP 网关

为方便集成，系统提供 SiLA 2 HTTP 网关：

### 基础路径

```
/api/sila2/v1/
```

### 接口映射

| HTTP 端点 | SiLA 2 命令 | 方法 |
|-----------|-------------|------|
| `/ChromatographService/StartRun` | `StartRun` | POST |
| `/ChromatographService/StopRun` | `StopRun` | POST |
| `/ChromatographService/GetState` | `GetState` | GET |
| `/DetectorService/Ignite` | `Ignite` | POST |
| `/SystemDiscoveryService/Capabilities` | `GetCapabilities` | GET |

### 使用示例

```bash
# 开始分析
curl -X POST http://localhost:8080/api/sila2/v1/ChromatographService/StartRun

# 获取状态
curl http://localhost:8080/api/sila2/v1/ChromatographService/GetState

# 点火控制
curl -X POST http://localhost:8080/api/sila2/v1/DetectorService/Ignite \
  -H "Content-Type: application/json" \
  -d '{"Ignite": true}'
```

---

## ANIML 数据格式

系统支持 ANIML (Analytical Information Markup Language) 标准数据格式。

### 结果结构

```json
{
  "schema": "voc-result.v1",
  "deviceId": "GC97002020100110",
  "traceId": "GC97002020100110-0-1781244750403763550",
  "createdAt": "2026-06-12T06:12:30Z",
  "engine": {
    "name": "edge-analyzer",
    "version": "0.3.88",
    "gitSha": "dev"
  },
  "methodId": "default",
  "methodVersion": 1,
  "pollutants": [
    {
      "name": "THC",
      "code": "THC",
      "rtS": 4.9,
      "area": 4.55,
      "height": 10.19,
      "amount": 1.98,
      "status": "detected"
    }
  ],
  "groups": [
    {"name": "NMHC", "code": "NMHC", "amount": 0.98}
  ],
  "stationId": "GC97002020100110"
}
```

---

## 安全考虑

### 认证

SiLA 2 gRPC 接口支持：
- 无认证模式（默认）
- TLS 加密（可选）

### 控制权限

通过环境变量控制：

```bash
# 允许控制指令
EDGE_ALLOW_CONTROL=1

# 只读模式
EDGE_ALLOW_CONTROL=0
```
# API 接口文档

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 概述

本系统提供 RESTful API 和 SSE 实时事件两种接口方式。

### 基础路径

- REST API: `http://host:8080/api/`
- SSE Events: `http://host:8080/events`

---

## 历史数据接口

### 1. 查询历史结果

**GET** `/api/animl/v1/HistoryService/Results`

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量限制，默认 100 |
| deviceId | string | 否 | 设备ID过滤 |
| from | string | 否 | 开始时间 (RFC3339) |
| to | string | 否 | 结束时间 (RFC3339) |

**响应示例**：
```json
[
  {
    "trace_id": "GC97002020100110-0-1781244750403763550",
    "device_id": "GC97002020100110",
    "created_at": "2026-06-12T06:12:30Z",
    "result": {...}
  }
]
```

### 2. 查询单条记录

**GET** `/api/animl/v1/HistoryService/Run/{traceId}`

**路径参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| traceId | string | 谱图唯一标识 |

**响应示例**：
```json
{
  "traceId": "GC97002020100110-0-1781244750403763550",
  "deviceId": "GC97002020100110",
  "createdAt": "2026-06-12T06:12:30Z",
  "pollutants": [
    {"name": "THC", "amount": 1.98, "rtS": 4.9}
  ],
  "engine": {"name": "edge-analyzer", "version": "0.3.88"}
}
```

---

## 方法管理接口

### 1. 获取当前方法

**GET** `/api/method`

**响应示例**：
```json
{
  "id": "default",
  "name": "标准方法",
  "compounds": [
    {"name": "THC", "retain_time": 0.08, "left_window": 0.01, "right_window": 0.016}
  ],
  "calibration": [...]
}
```

### 2. 更新方法

**PUT** `/api/method`

**请求体**：
```json
{
  "id": "default",
  "name": "标准方法",
  "compounds": [...],
  "calibration": [...]
}
```

**响应**：`{"status": "ok"}`

---

## 循环控制接口

### 1. 获取循环配置

**GET** `/api/control/cycle`

**响应示例**：
```json
{"cycleCount": 9999, "cycleInterval": 2}
```

### 2. 设置循环配置

**POST** `/api/control/cycle`

**请求体**：
```json
{"cycleCount": 9999, "cycleInterval": 2}
```

**响应**：`{"status": "ok"}`

---

## 系统配置接口

### 1. 获取系统配置

**GET** `/api/sysconfig`

**认证要求**：Basic Auth (admin/123456)

**响应示例**：
```json
{
  "driver_mode": "FID (Legacy Board)",
  "mqtt_enabled": false,
  "mqtt_broker": "tcp://127.0.0.1:1883"
}
```

### 2. 更新系统配置

**PUT** `/api/sysconfig`

**认证要求**：Basic Auth

**请求体**：
```json
{
  "driver_mode": "FID (Legacy Board)",
  "mqtt_enabled": true,
  "mqtt_broker": "tcp://broker.example.com:1883"
}
```

---

## SiLA 2 网关接口

### 1. 开始分析

**POST** `/api/sila2/v1/ChromatographService/StartRun`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | string | 否 | 目标设备ID |

**响应**：`{"status": "ok"}`

### 2. 停止分析

**POST** `/api/sila2/v1/ChromatographService/StopRun`

**响应**：`{"status": "ok"}`

### 3. 获取状态

**GET** `/api/sila2/v1/ChromatographService/GetState`

**响应示例**：
```json
{"state": "Running", "cycleCount": 1, "cycleTime": 30.5}
```

---

## 实时事件 (SSE)

### 连接地址

```
GET /events
Accept: text/event-stream
```

### 事件类型

| 事件 | 说明 | 数据结构 |
|------|------|----------|
| cmd143 | 实时采样数据 | `{type, deviceId, samples[], t0s, dts}` |
| cmd147 | 采集结束 | `{type, deviceId}` |
| cmd159 | 温度数据 | `{type, deviceId, temps[]}` |
| result | 分析结果 | `{type, deviceId, traceId, pollutants[]}` |
| state | 状态变更 | `{type, deviceId, state}` |

### 示例代码

```javascript
const eventSource = new EventSource('/events');
eventSource.addEventListener('cmd143', (event) => {
  const data = JSON.parse(event.data);
  console.log('实时数据:', data);
});
```

---

## 错误响应格式

所有 API 错误响应统一格式：

```json
{
  "error": "错误描述",
  "code": "错误码",
  "timestamp": "2026-06-12T06:12:30Z"
}
```

**HTTP 状态码**：
| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
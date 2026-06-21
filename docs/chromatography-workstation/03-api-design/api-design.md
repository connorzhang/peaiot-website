# API 接口设计契约 (API_DESIGN)

基于“后端主导”及“SPA 单页应用”的原则，本文档定义了前端与 Go 边缘节点之间的核心交互接口。
通信协议分为两类：**SSE (Server-Sent Events)** 用于高频实时数据推送，**RESTful API** 用于配置的下发和读取。

## 1. SSE 实时数据流 (已存在并扩展)

**Endpoint:** `GET /api/stream`

后端以流的形式向前端推送当前硬件状态、波形数据和最新的浓度计算结果。前端只需挂载 `EventSource` 即可。

### 推送事件类型 (Event Type)
- **`event: telemetry`**: 高频波形和实时硬件数据（原逻辑已实现）。
- **`event: analysis_result`**: 单次进样分析结束时触发，推送本次的峰面积、浓度等。
- **`event: alarm`**: 硬件报警（如 FID 熄火、控温异常）触发。

---

## 2. RESTful API (配置与控制)

### 2.1 分析方法与校准 (Method)

负责读取和保存组分表、积分参数等。

- **获取当前分析方法**
  - `GET /api/method`
  - 返回: 包含 `Compound` 数组、`Integration` 阈值的完整 JSON。

- **保存/更新分析方法**
  - `POST /api/method`
  - 载荷: 完整的 Method JSON 对象。后端收到后执行本地持久化 (SQLite/JSON)。

- **执行手动/自动校准**
  - `POST /api/method/calibrate`
  - 载荷: `{ "level": 1, "run_id": "xxx" }` (指定用某次分析的结果更新某一个级别的校准表)。

### 2.2 硬件反控 (Control)

负责前端按钮点击后的参数下发。

- **下发控温参数**
  - `POST /api/control/temp`
  - 载荷: `{ "zone": "Inj1", "target": 150.0 }`

- **控制 FID 点火**
  - `POST /api/control/ignite`
  - 载荷: `{ "action": "start", "detector": "FID1" }`
  - 后端将该指令翻译为 `Cmd 20` 并通过 TCP 下发。

- **下发气路/EPC 参数**
  - `POST /api/control/epc`
  - 载荷: `{ "channel": "Carrier1", "pressure": 50.0 }`

- **下发时间事件表 (多位阀)**
  - `POST /api/control/events`
  - 载荷: `[ { "time": 0.5, "event_mask": 1 }, ... ]`

### 2.3 历史记录 (History)

用于“记录报表”界面的查询。

- **查询历史分析结果**
  - `GET /api/history/results?start_time=xxx&end_time=xxx&page=1&size=20`
  - 返回: 指定时间段内的进样批次及核心浓度列表。

- **获取单次进样的完整图谱与峰数据**
  - `GET /api/history/run/:run_id`
  - 返回: 该次进样的完整 XML/JSON 图谱数据和 `Peak` 列表，供“谱图处理”界面重绘使用。

---
*注：所有的 POST 接口在 Go 后端接收到后，除了进行必要的持久化存储外，还需负责将其转化为相应的 TCP Modbus/GCKC 协议帧，异步下发给色谱主板，确保前端点击即生效。*
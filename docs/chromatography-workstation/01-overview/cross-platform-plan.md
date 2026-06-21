# 跨平台 VOCs 色谱工作站重构开发文档（边缘节点 + 云平台）

## 目标与约束

本次重构目标是将现有 Windows 工作站升级为跨平台（Linux/macOS/Windows）可运行的“边缘节点工作站”，并为后续云平台化做准备。

约束与已确认前提：

- 采集层：与色谱仪的连接使用网口协议（TCP），无需依赖 Windows 专有驱动。
- 报表层：不需要复刻原系统的 Word/Excel 互操作与复杂报表，允许使用新语言重新实现简单报表。
- 算法一致性：重构版本需要**严格参考现有 Windows 版本的分析逻辑**。对关键输出（RT/面积/峰高/峰数/定量结果），需在约定的误差阈值内与基线一致，并通过固定数据集的对照测试持续回归。
- UI：不复刻原 WinForms/DevExpress 界面；只需实现谱图展示与标定/套峰交互达到同等效果。
- 技术选型：分析内核使用 Go；未来要支持云平台化（方法下发、结果上报、云端重算）。

## 现有版本流程复盘（用于迁移对照）

现有版本已经实现“TCP 采集 → 实时显示 → 自动保存 → 停止后分析并打开谱图”的闭环链路。关键路径如下：

- 启动 TCP Server：`FormMain.StartTcpServer()`，创建采集端口 `25001` 与相关端口 `502/503`。
- 采集数据接收与解析：`TcpServerSocket.OneDataReceive()` → `AnalyseReceivedData()`。
- 开始/停止采集：UI 发送 cmd 22/23；应答 `Answer150/146` 将 `Signal.simple=true` 进入采集态；`Answer147` 触发 `StoptAllGather()` 保存。
- 实时曲线：采集包处理过程中调用 `Signal.AddDots(...)` 增长点列；`ChromAcqCtrl.timer_0_Tick` 定时 `Refresh()` 触发绘制。
- 落盘与分析：`TcpServerSocket.Save(...)` 构建 `Chromatogram`，调用 `Chromatogram.Process(...)` 完成积分/结果计算，然后落盘 `.sda`；若启用 `StopAutoAlalyse` 则自动打开谱图窗体。

迁移策略：保留“采集→显示→周期结束保存→分析→标注结果”的用户体验，但在新架构中拆分为独立模块与统一数据契约。

## 总体架构（边缘节点 + 可云化）

边缘节点建议按“采集 / 分析 / UI”三层解耦，可部署为多进程或同进程多模块：

1) 采集服务（TCP Ingest）
- 连接色谱仪（TCP），协议解析、重连、心跳。
- 将原始数据流切片为“一个测量周期”的谱图记录。
- 本地落盘：同步生成 XML + JSON。
- 对外发布：向本地 UI 推送实时点列/周期结束事件（WebSocket/IPC）。

2) 分析内核（Analyzer Core，Go）
- 输入：谱图记录（trace）+ 方法（method）。
- 输出：分析结果（result）。
- 对外形式：
  - 库模式（in-process）：低延迟。
  - 服务模式（out-of-process）：HTTP/gRPC，利于云化与多 UI。

3) UI
- Realtime Monitor：实时展示、选择方法、周期结束自动分析并标注结果。
- Method Editor：离线打开谱图、标定套峰、保存方法版本。

## 数据标准与文件格式（XML + JSON）

### 谱图 XML（已存在行业标准）

示例结构：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Voc>
  <DataTime>yyyymmddhhmmss</DataTime>
  <TimeSpan>120</TimeSpan>
  <Datas Count="600" Unit="pA">
    <Data Seq="0" Value="5" />
    <Data Seq="1" Value="10" />
    ...
  </Datas>
  <Pollutants>
    <Data PollCode="a05002" StartTime="34" EndTime="40" />
    <Data PollCode="a25003" StartTime="50" EndTime="56" />
  </Pollutants>
</Voc>
```

约定：

- X 轴生成规则（统一）：
  - `dt = TimeSpan / Datas.Count`（单位秒）
  - 第 `Seq=i` 点时间：`t[i] = i * dt`
- `Pollutants` 允许为空，表示未标定。

### JSON（推荐的通用格式）

JSON 与 XML 同源，建议将点序列展开为数组以提升性能：

```json
{
  "schema": "voc-trace.v1",
  "dataTime": "yyyymmddhhmmss",
  "timeSpanS": 120,
  "datas": {
    "count": 600,
    "unit": "pA",
    "values": [5, 10, 12]
  },
  "pollutants": [
    { "code": "a05002", "name": "总烃", "startS": 34, "endS": 40 },
    { "code": "a25003", "name": "甲烷", "startS": 50, "endS": 56 }
  ]
}
```

说明：

- `code` 是环保因子编码（如 `a05002`），`name` 是因子名称（如“总烃/甲烷”）。
- 结果换算系数（如 k/b）不与“因子编码/名称”混用，单独放在 method 的 quant 区。

## 方法（标定）与套峰分析

### 业务流程

1) 标定（Method Editor）：
- 打开历史谱图（XML/JSON）。
- 对每个污染物（因子）框选套峰窗口：`StartTime/EndTime`。
- 配置漂移鲁棒参数（padding、对齐策略）与基线策略。
- 保存为方法文件（JSON + XML），并做版本化（method_id/version）。

2) 实时分析（Realtime Monitor）：
- 采集服务持续输出实时点列；UI 实时绘制。
- 每个周期结束后自动：
  - 写入 trace（XML/JSON）。
  - 使用已选择的方法调用分析内核生成 result。
  - UI 将污染物窗口与结果（RT/面积/高度/状态）叠加标注。

### 漂移补偿（“套峰加峰宽”）

目的：周期性测量时 RT 小漂移导致窗口切峰不准。

机制建议同时具备：

- 窗口扩展：左右各加 `paddingS`，扩大积分范围。
- 窗口对齐：在扩展窗口内找峰顶（peakmax），并可选将窗口中心向峰顶对齐（限制最大平移量）。

默认推荐：`alignMode=peakmax` + 适度 `paddingS`。

### 目标积分（Targeted Integration）算法最小闭环

对每个污染物（code）执行：

- 取窗口：`[startS-paddingS, endS+paddingS]`（裁剪到 `[0, timeSpan]`）。
- 峰顶：窗口内取最大值点（正峰）或按配置支持负峰。
- 基线：默认用窗口两端点连线（linear_endpoints）；可选 robust_endpoints。
- 面积：对 `max(0, y-baseline)` 做梯形积分；高度：峰顶相对基线高度；RT：峰顶时间。
- 缺峰判定：`max_height < threshold` → `not_detected`。

该模式与“全谱自动检峰”解耦，适合云端批处理与现场稳定运行。

## 模块拆分与职责

### 边缘节点

**采集服务**
- 输入：TCP 数据流（仪器协议）。
- 输出：实时点列推送；周期 trace（XML/JSON）落盘；周期结束事件；可选上报云端。

**分析服务/库（Go）**
- 输入：trace + method。
- 输出：result（JSON，必要时可输出 XML）。

**Realtime Monitor UI**
- 实时曲线；选择 method；周期结束自动分析；叠加标注；本地基本操作（开始/停止、导出、上传、告警）。

### 方法编辑器（可与边缘 UI 同壳不同模块，也可独立应用）

**Method Editor UI**
- 打开历史谱图；框选污染物套峰；配置 padding/align/baseline；保存方法版本。

## API（本地与云端统一）

建议将分析内核以 HTTP/gRPC 暴露，便于边缘与云统一：

- `POST /trace`：上传 trace（JSON）。
- `POST /method`：上传/发布 method（JSON）。
- `POST /analyze`：入参 trace + method_id/version 或 method 内容，返回 result。
- `GET /result?...`：查询结果。

边缘可选择：

- 本地分析后只上报 result（节省云算力）。
- 或上传 trace 由云端统一分析（便于集中升级算法）。

## MODBUS（标准 Modbus/TCP，实现寄存器地址映射）

目标：对外提供**标准 Modbus/TCP**（MBAP 头 + Function Code），外部系统仅需按“寄存器地址”读取/写入。

关键约定：

- 连接：TCP 端口建议默认 `1502`（Linux 下避免绑定 502 的权限问题），支持配置为 `502`。
- 多仪器：使用 Modbus/TCP 的 `Unit Identifier`（MBAP Header 里的 UnitId，1 字节）选择仪器实例；单仪器可固定 `UnitId=1`。
- 通道分段：按 `base = channelIndex * 10000` 的方式做寄存器分段（0/1/2/3 通道分别在 0/10000/20000/30000 段）。
- StationId：Holding Register `801~812`（共 12 寄存器，24 ASCII），每寄存器 2 字节，顺序见 [docs/DEVICE_ID_STATIONID.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/DEVICE_ID_STATIONID.md)。

寄存器映射建议（MVP）：

- **Coils（01/05/15）**：状态位与控制位（地址沿用现有定义，便于对照）
  - `10000`：控温状态（读）
  - `10001`：分析/采集中状态（读）
  - `10002..10005`：通道 0..3 采集态（读）
  - `10006`：点火状态 1（读）
  - `10007`：点火状态 2（读）
  - `10008`：事件状态 bit1（读）
  - 对应“写入控制”统一用 05/15 写 coil，边缘节点再映射为主站下行命令（如 16/17、18/19、22/23、20 等）
- **Holding Registers（03/06/16）**：关键只做“读寄存器”
  - `base + 0..7`：设备/通道描述（16 字节 ASCII）
  - `base + 8..15`：状态文本（16 字节 ASCII）
  - `base + 16..21`：采集时间 `yyMMddHHmmss`（12 字节 ASCII）
  - `base + 22`：检测器标识 `detMark`（uint16）
  - `base + 24`：进样次数 `injNo`（uint16）
  - `base + 25`：峰数 `peakCount`（uint16）
  - `base + 26..27`：炉温/加热值 1（float32，2 寄存器）
  - `base + 28..29`：炉温/加热值 2（float32，2 寄存器）
  - `base + 801..812`：StationId（24 ASCII，12 寄存器）
  - 峰表建议从 `base + 1000` 开始（每峰 40 寄存器，最多 20 峰，预留扩展）

浮点端序（必须写死并文档化）：
- 建议默认：寄存器高字在前（Big-Endian word order），每寄存器内部高字节在前（标准 Modbus 习惯）。
- 如现场 PLC/采集卡需要 swap，可在边缘节点提供“字序/端序”配置项，但对外文档仍只给出默认。

## 分析内核（已确认：Go）

- 已确认：分析内核使用 **Go**。
- MVP 统一用 **Go** 实现 Collector/Edge API/Analyzer/Telemetry（减少语言栈数量）。
- Analyzer 对外接口固定为 HTTP（可预留 gRPC），便于解耦 UI/采集与分析实现，并支撑云端重算与回归测试基线对照。

## 版本治理与审计

- 方法文件必须版本化：`method_id + version`。
- 结果必须引用方法版本：result 内写明 `method_id/version`。
- trace + method 可重放得到同结果（强调确定性与可复现）。

## 可交付里程碑（一步一步完成并测试）

每一步都必须满足：能运行、可观测（日志/指标/可复现输入输出）、有自动化测试（至少 golden fixtures）。

### Step 0：契约固化（Schema + Fixtures）
- 产出：`voc-trace.v1 / voc-method.v1 / voc-result.v1` 的 JSON Schema + 3~5 份示例数据（含缺峰/漂移/噪声场景）
- 测试：Schema 校验 + 示例反序列化/序列化一致性测试

### Step 1：Analyzer v1（离线可测 + 对齐 Win 基线）
- 产出：
  - Analyzer（Go）提供 `POST /analyze`
  - 基线导出器：从现有 Windows 版本（C# 引擎）对同一份 trace+method 导出“基线结果 JSON”
  - 对照器：新 Analyzer 输出与“基线结果 JSON”自动对比（误差阈值、差异报告）
- 测试：
  - golden test：对固定 trace+method 的结果 JSON 做回归
  - 基线一致性测试：RT/面积/峰高/峰数/定量等关键字段在约定误差阈值内与基线一致
  - 确定性测试：同输入多次输出一致（字段级稳定）

### Step 2：Collector v1（用“仪器模拟器”先跑通）
- 产出：
  - GCKC 协议最小实现（接收点列、周期切片、落盘 trace JSON/XML、WebSocket 推送）
  - 仪器模拟器：可模拟“主板连接 + 连续上报点列 + 周期结束事件”
- 测试：
  - 协议编解码 golden bytes
  - 模拟器集成测试：collector 能稳定跑 N 个周期不丢包
  - 可视化冒烟：UI 打开后能看到“设备在线/心跳”状态（先用最简页面也可）

### Step 3：Realtime Monitor UI MVP
- 产出：实时曲线 + 方法选择 + 周期结束自动分析 + 结果叠加标注
- 测试：
  - 端到端集成测试（模拟器→collector→analyzer→ui 可完成一个周期闭环）
  - 冒烟验收用例（必须可重复执行）：
    - 打开界面后能自动发现设备在线
    - 点击“开始/停止”后主站命令下发与应答状态正确
    - 实时曲线连续滚动、采样点数持续增长、Y 轴自动缩放不抖动
    - 周期结束自动保存 trace，并自动触发 analyze，结果能叠加显示

### Step 4：Modbus/TCP（标准协议）
- 产出：标准 Modbus/TCP Server（03/01/05/15 等）+ 寄存器映射（含 StationId 801~812）
- 测试：Modbus 客户端脚本集成测试（读写地址/边界/异常码）；与模拟器联动验证状态位与结果字段更新

### Step 5：Telemetry（MQTT→EMQX→ES）与运维反控
- 产出：结果增量上报、心跳、告警；运维反控命令链路（云→边缘→主站下行命令）
- 测试：离线消息回放 + 断网重连/补发策略测试；权限与审计测试（仅运维命令可达）

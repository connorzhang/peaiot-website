# 色谱工作站标准协议化及开发进度里程碑报告

## 1. 项目背景与开发模式
本项目旨在将传统的色谱工作站重构为符合现代实验室自动化标准的物联网智能边缘节点。
**开发模式**：AI 辅助单兵敏捷开发（AI Pair Programming）。摒弃繁杂的团队管理流程，采用“需求直达代码”、“边跑边重构”的极简流程。所有的业务目标转化为精确的 TODO 步骤并全自动闭环执行。

## 2. 国际标准协议实现现状及对比矩阵
根据对代码库（`standard_proxy.go`、`sila2/server.go`、`opcua/server.go`）的深度分析，当前标准协议实现进度如下：

| 标准/协议 | 目标规范 | 当前实现状态 | 待开发 / 缺失部分 |
| --- | --- | --- | --- |
| **SiLA 2** | gRPC / 实验室自动化标准 | **部分完成 (API层代理)**<br>- 完成了遗留 REST API 到 SiLA 2 的 URI 代理映射<br>- 建立了基础的 gRPC Server (Start/Stop/State) | **待补全 (强标准化对接 LIMS 必需)**<br>- 缺少完整功能(Features)的 `.proto` 定义（如温度/阀门/EPC服务）<br>- 需要将内部组件的控制逻辑直接接入 gRPC 服务层 |
| **OPC-UA LADS** | 实验室分析设备标准模型 | **雏形阶段**<br>- 搭建了 OPC-UA Server 基础框架<br>- 映射了顶层状态 (TwinState) 和 循环次数 | **重点攻坚 (根据最新需求)**<br>- **完整的设备报警树 (Alarm & Condition Tree)**<br>- **安全审计追踪 (Audit Trail)** 模型<br>- 内部模块（如检测器、柱箱）细分层级节点映射 |
| **AnIML** | 分析数据结构化标准 | **JSON 兼容 (完成度较高)**<br>- Method, Process, History 的核心结构已采用 AnIML 概念重构<br>- 前后端交互以 AnIML 语义的 JSON 格式传输 | **迭代优化**<br>- (根据决策) 暂不需要严格的 XML 导出，保持高效的 JSON 即可<br>- 需要在数据结构中补充审计信息(User, Timestamp, Reason)以配合 LADS 审计要求 |
| **外部扩展接口** | 工业现场泛用总线 | **部分实现 (MQTT预留)**<br>- 仅存在环境变量 `MQTT_CLIENT_ID` 预留 | **新增规划 (核心数据外发需求)**<br>- 需设计统一的 `DataPublisher` 扩展接口<br>- 补充实现 Modbus RTU / Modbus TCP / CAN 总线对外数据及分析结果的实时下发 |

## 3. 已完成功能清单 (Completed)
- [x] **底层硬件解耦 (HAL)**：完成遗留协议驱动 (`LegacyGCKCDriver`) 和散件模块化驱动 (`ModularDriver`) 的彻底分离，建立统一的 `DigitalTwin` 数字孪生层。
- [x] **标准路由代理网关**：在 `standard_proxy.go` 中，将历史包袱接口完美无感映射至 `/api/sila2/v1/...` 和 `/api/animl/v1/...`。
- [x] **全自动化CI/CD流**：基于红线规则，实现一键交叉编译、增量极速部署 (rsync over SSH)、非阻塞后台服务重启及版本号自动递增。
- [x] **前端业务逻辑标准化适配**：`settings.js` / `live.js` / `method.js` 等核心交互页面已切换至标准化 API URI，并修复了本地 TCD 与测试机 FID 在散件与遗留模式下并发引起的事件控制和波形刷新重置的严重 Bug。

## 4. 缺失与未来规划功能 (Pending & Future)
结合最新的系统级需求反馈（“需要强标准化对接LIMS”、“需要完整报警与审计树”、“需要扩展接口发送数据”），梳理出以下演进方向：

### 4.1 深度 SiLA 2 集成 (面向 LIMS/CDS 强对接)
- 编写规范的 SiLA 2 `.proto` 文件集合，涵盖 `ValveControllerService`、`TemperatureControllerService`、`PneumaticControllerService`、`DetectorService` 等。
- 将 gRPC Handler 与 `DigitalTwin` 模块深度绑定，替代当前仅作为 HTTP 路由映射的浅层集成方案。

### 4.2 OPC-UA LADS 完整报警与审计体系
- **报警系统**：在现有的 OPC-UA 树中建立标准的 `Alarms & Conditions` 模型，当硬件或系统出现异常（如连接断开、温度超限报警、基线异常）时，触发符合规范的 OPC-UA Event。
- **审计追踪 (Audit Trail)**：将每一次人为的参数修改（如改变分析方法设定、修改保护温度）、启动/停止操作进行留痕，并以标准的 OPC-UA 事件或 AnIML JSON 节点持久化保存，实现全流程防篡改与溯源。

### 4.3 工业现场扩展网关接口 (Extension Data Publisher)
- 建立基于 Go 语言 Interface 的插件化 `DataPublisher` 发布者机制。
- **MQTT**：实现分析结果(Pollutants)和设备实时运行状态的云端上报。
- **Modbus TCP / RTU (Slave 模式)**：将最终的分析含量（如 CH4、NMHC 的浓度值 mg/m³）以及基础状态映射为标准的保持寄存器 (Holding Registers)，供外部环境监测站 PLC 或工控上位机直接拉取读取。
- **CAN 总线**：预留基于 SocketCAN 或串口透传的实时广播扩展能力。

## 5. 开发里程碑规划 (Milestones)

- **Milestone 1: 标准协议完善与后端状态机自主运行 (已完成)**
  - 修复 `opcua/server.go` 的编译错误，成功将 LADS 状态机、目标循环次数、报警占位及审计占位节点接入 DigitalTwin。
  - 将前端请求全面对齐 SiLA 2/OPC-UA 标准：修改 `app.js`, `process.js`, `report.js` 所有的内部接口为 `api/sila2/v1/...` 与 `api/animl/v1/...`。
  - 修正了 SiLA2 代理中 `StartAnalysis` 缺失重置会话导致的 TCD 谱图不刷新 Bug（在 `sila2_binding.go` 中主动触发 `resetAllSessions`）。
  - 后端引擎 `engine_scheduler.go` 已实现完全自主运行。基于 `DigitalTwin` 配置，循环分析将完全在后台执行，前端即便关闭也绝不影响色谱运行流转。

- **Milestone 2: MQTT/Modbus及数采仪扩展物联网能力 (已完成)**
  - 设计了统一对外发送数据的 `DataPublisher` 接口及 `GlobalPublisher` 全局单例。
  - 完成对工厂车间级通用协议的支持：基于 `paho.mqtt` 上报实时结果、状态与报警；基于 `mbserver` 建立 Modbus TCP/RTU 从机模式暴露核心状态。
  - 深度整合高级配置：MQTT 与数采仪强绑定用户配置的设备唯一编码 (`DeviceNo` / `ClientID`) 及自定义 `MqttTopic`，并彻底清除了旧版代码中散落的数据外发碎片，实现统一网关路由。
  - 修复了环保数采仪（HJ212）谱图文件上传功能，对齐了标准的 `/cgi-bin/mediafileupload/file` 接口。

## 6. 即时可执行待办事项 (TODO List)

1. [x] **修复编译错误**：处理 `opcua/server.go` 中的 `alarmsNode` 与 `auditNode` 变量声明未使用问题。
2. [x] **完善 OPC-UA LADS 节点**：扩写 `DigitalTwin` 模型以包含 `ActiveAlarms` 与 `LastAuditLog` 并同步更新节点状态。
3. [x] **修复 TCD 谱图重启问题**：在 `sila2_binding.go` 的 `StartAnalysis` API 中加入 `resetAllSessions` 逻辑，确保循环流转重置时间戳。
4. [x] **前端全面对齐标准协议**：重构 `app.js`（特别是 `sendCmd`），`process.js` 和 `report.js`，全部替换为 `SiLA 2` 与 `AnIML` 代理路由。
5. [x] **后端自主运行验证**：确认 `engine_scheduler.go` 的循环计算机制脱离前端依赖，完全根据底层 `DigitalTwin` 及 `CycleCount` 独立运行。
6. [x] **Milestone 2 数据分发机制**：设计并完成了 MQTT 及 Modbus 外发数据的 `GlobalPublisher` 机制。
7. [x] **扩展接口联调与修正**：修复 MQTT 唯一编码读取遗漏问题，修复 MQTT Topic 层级拼装问题，修复环保数采仪 HTTP 谱图上传 501 路径报错问题，确保对接标准外部系统。

- **Milestone 3: 数据导出接口彻底原生标准化 (已完成)**
  - 彻底废弃了遗留的 /api/v1/results/nmhc/export.csv 和 /api/history/export.csv 导出路由及其代理转发。
  - 将 CSV 导出、NMHC 专用 CSV 导出和 XML (AnIML) 导出直接重构并挂载到标准的 DataExportService 命名空间下：
    - /api/animl/v1/DataExportService/ExportCSV
    - /api/animl/v1/DataExportService/ExportNMHC
    - /api/animl/v1/DataExportService/ExportXML
  - 修复了因为依赖旧版内存存储 (
mhcStore) 导致导出 CSV 文件为空（只有表头）的严重 Bug，现已直接对接底层的 SQLite JSON 存储引擎 (pstore) 并动态解析数据字段。
  - 彻底解决了 update_frontend_api.ps1 在 Windows 下追加多重 BOM 导致前端页面黑屏的语法错误。

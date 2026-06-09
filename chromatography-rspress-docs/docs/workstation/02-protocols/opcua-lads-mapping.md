# OPC-UA LADS 动态映射架构重构记录 (v0.3.83)

## 1. 背景与目标
在先前的版本中，色谱仪后端与底层硬件的 OPC-UA 映射存在以下局限性：
- 目录结构使用了自定义的临时域名，不符合 OPC 基金会官方 LADS (Laboratory and Analytical Device Standard) 规范。
- OPC-UA Server 初始化时强绑定了伪 DeviceID（`"1"`），导致使用老主板（Legacy Board）时，底层真实 MAC 地址（如 `GC97002020100110`）采集的温度、FID 信号和循环次数等状态，无法映射到 OPC-UA 暴露的节点中。
- 底层第三方库 `gopcua` 在动态生成 `NewFolderNode` 文件夹节点时存在 `Variant` 类型断言导致的 Panic 崩溃漏洞。

**目标**：完全遵循国际标准协议（OPC-UA LADS），重构设备目录树，支持多设备动态绑定（Dynamic Twins），确保物理层的数据（采集时间、温度PV/SV、FID信号等）全量且实时地映射到标准模型中。

## 2. 架构重构与改动说明

### 2.1 命名空间与目录标准化
- 废除原有的私有命名空间，切换为官方标准命名空间：`http://opcfoundation.org/UA/LADS/`。
- 构建了规范的设备目录树。所有的分析仪器均严格挂载在 `Root -> Objects -> AnalyticalDevices -> [DeviceID]` 目录下。

### 2.2 动态多核映射 (Dynamic Twins)
- 重构了 `src/edge/internal/opcua/server.go`。
- 原本强绑定的单一 `*models.DigitalTwin` 变更为支持多设备并发监控的 `*sync.Map` (`globalTwins`)。
- 当底层通过串口或网络侦测到硬件接入时，OPC-UA Server 守护协程会自动在 `AnalyticalDevices` 下为其创建以真实 MAC 地址命名的独立设备目录，并实时桥接该设备的真实运行状态。

### 2.3 老主板 (Legacy Board) 组件代理
- 对于通过 Cmd 143 / Cmd 128 上报状态的遗留主板，新增了 `legacyTempComp` (温度组件) 和 `legacyDetComp` (检测器组件) 代理模型 (`src/edge/cmd/collector/legacy_components.go`)。
- 确保每次主板上报状态时，真实温度 (PV)、设定温度 (SV) 及 FID (pA) 能够实时推送到对应 DeviceID 的 `DigitalTwin`，再由 OPC-UA 引擎向外暴露，解决了无真实数据跳动的 Bug。

### 2.4 参数查漏补缺
新增并确立了对以下重要参数的映射：
- `CurrentCycleCount` (当前循环次数，跟随底层 Cmd 物理信号递增)
- `SamplingInterval` (采样周期 / dtS，真实配置映射如 0.05s)
- 各个组件的实时 State (状态)、PV (真实值)、SV (设定值)

### 2.5 gopcua 底层库修复
在 vendor 模式下，直接修改了 `src/edge/vendor_local/gopcua/server/node.go`。
修复了 `NewFolderNode` 函数内部给 NodeClass 和 LocalizedText 设置 Value 时，类型不匹配导致的 `panic: trying to create a variant from a type that it is not supported` 致命错误。

## 3. 复盘结论
通过本次重构，系统成功实现了“脱虚向实”。色谱工作站彻底摆脱了前端的逻辑依赖与假数据绑定，后端核心自主状态机配合完全标准化的 OPC-UA LADS 协议，具备了真正的即插即用和数字孪生（Digital Twin）能力。
### 2.6 LADS 目录树规范化与多通道扩充 (v0.3.83)
- 将 LADS 文件夹 (ParameterSet, ComponentSet, ResultSet 等) 的挂载方式由 HasComponent 修正为更符合层级规范的 Organizes。
- 将原本仅包含 Col (柱箱) 等少量温度信号的模拟数据，全量扩充了 FID (通道0)、FID2 (通道1)、Inj1、Inj2、Det1、Det2、Det3 等真实的硬件实时信号，确保所有数据均来自于下位机的实时解析。

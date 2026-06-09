# 硬件抽象层 (HAL) 与散件模块化演进架构规划

## 1. 背景与痛点
目前工作站（Edge Collector）强依赖于特定的高度集成色谱主板及其私有协议（GCKC 协议）。该协议存在诸多历史包袱（如 BCD 码编码、单包 96 字节长度限制、事件矩阵双表拆分等），这使得：
1. **硬件成本高昂**：被单一主板供应商绑定，无法利用市面上性价比更高的通用模块（如 Modbus 温控表、IO 继电器、高精度 ADC 等）。
2. **扩展性极差**：如果要增加温控通道或外部事件通道，老协议的数据帧根本塞不下，几乎无法平滑升级。
3. **开发维护痛苦**：大量的代码消耗在复杂的协议拼装与解析中，而不是业务逻辑上。

## 2. 演进目标
**核心战略**：在 Go 后端（Collector）中引入**硬件抽象层 (HAL)**。
将“集成主板”拆解为“通用散件模块”，实现**“软件定义硬件”**。前端 UI 与核心分析逻辑保持不变，底层根据配置加载不同的硬件驱动。

## 3. 架构设计 (方案 B：内置驱动架构)

摒弃开发独立协议转换中间件（方案 A）的想法，直接在 Go 后端引擎内部实现设备驱动的解耦，原因在于：
- **避免多级网络跳转**，降低延迟，提高数据流稳定性。
- **开发更直接**：Go 原生处理并发串口和 TCP/Modbus 能力极强。

### 3.1 核心抽象接口 (`InstrumentDriver`)
在 `src/edge/internal/hal`（计划创建的目录）下定义统一的仪器接口：

```go
type InstrumentDriver interface {
    // 基础生命周期
    Connect() error
    Disconnect() error
    
    // 温控模块接口
    SetTemperatures(targets map[string]float64) error
    StartTempControl() error
    StopTempControl() error
    
    // 事件与继电器接口 (IO 模块)
    SetEvents(matrix [8][8]float64) error
    
    // 气路与 EPC 接口
    SetEPC(channels map[string]float64) error
    
    // 数据采集与分析控制
    StartAnalysis() error
    StopAnalysis() error
}
```

### 3.2 驱动层实现（隔离历史包袱）
**核心理念：主程序（Frontend + Backend Core）将彻底消除 `Cmd 143`、`Cmd 128` 等概念，所有指令体系仅存在于特定的底层驱动中。**

- **老主板驱动 (`driver_gckc_legacy.go`)**：将目前写死在 `main.go` 里的 `Cmd 128`、`Cmd 143`、双表合并逻辑全部剥离到此。这是整个系统中**唯一**知道 "Cmd" 是什么东西的地方。确保对老设备的完美向后兼容。
- **通用模块化驱动 (`driver_modular.go`)**：当使用散件时启用此驱动。**这里完全没有 Cmd 128 或 143 的概念。**
  - 温控：将 `SetTemperatures` 翻译为 `Modbus RTU Write Multiple Registers (0x10)` 发送给第三方温控表。
  - IO：将 `SetEvents` 翻译为 `Modbus Write Coil (0x05)` 发送给继电器模块。
  - ADC：从高精度采集卡的独立串口读取微伏/皮安级信号。

## 4. 演进实施路线图

### Phase 1：解耦准备 (代码重构)
1. 在 `main.go` 中剥离硬件协议相关代码。
2. 建立 `InstrumentDriver` 接口。
3. 将现有的代码平移封装为 `LegacyGCKCDriver`。
4. **验证**：确保重构后，连接现有的色谱主板，各项功能（控温、点火、采集）依然正常。

### Phase 2：引入首个散件模块 (温控模块试点)
1. 采购第三方通用 Modbus 温控模块（如 8 路温控表）。
2. 在前端“高级设置”中新增“底层硬件模式”切换开关（A: 原厂主板, B: 散件模块）。
3. 编写 `ModbusTempDriver`。当切换到模式 B 时，温度设定和查询指令直接通过串口发送给温控模块，而其他操作（如事件、点火）暂时仍发给老主板（混合模式），或使用对应的 IO 模块。
4. **验证**：前端下发 250℃，第三方温控模块成功升温并回传实时温度。

### Phase 3：全面模块化与降本
1. 逐步替换 IO 模块、EPC 控制模块和信号放大器（ADC 模块）。
2. 将各种模块的通信协议集成到 `ModularDriver` 中统一调度。
3. **验证**：彻底拔掉老色谱主板，整个系统仅靠边缘工控机（Edge Collector）+ USB 转多路 485 HUB + 散件模块 即可完美运行全套色谱分析流程。

## 5. 预期收益
- **硬件降本**：整机 BOM 成本有望断崖式下降。
- **供应链安全**：摆脱单一厂商锁定，任何模块坏了都可以用市面上同类标准品替换。
- **产品升维**：软件从“定制工具”升级为“通用色谱仪平台底座”，具备赋能其他仪器厂家的潜力。

---

## 6. 深入设计：模块化下的关键技术挑战与解决

将“单一高集成主板”拆解为“多厂商散件模块”的过程中，会面临数据同步、配置管理等工程挑战。针对此，HAL 的进阶完善方案如下：

### 6.1 接口细化与组合模式 (Composition over Inheritance)
不要将所有功能塞进一个庞大的 `InstrumentDriver`，而是抽象出细粒度的子接口：
- `TemperatureController`: `SetTemp(ch, val)`, `ReadTemp()`
- `IOController`: `SetEvent(ch, state)`, `ReadEvent()`
- `DetectorADC`: `StartStream()`, `StopStream()`
- `FlowController (EPC)`: `SetPressure()`, `ReadFlow()`

在“散件模式”下，`ModularDriver` 实际上是一个**聚合器 (Aggregator)**，它内部持有上述各个子接口的实例。这样无论是 A 厂家的温控搭配 B 厂家的 IO，都可以像搭积木一样在 Go 中自由组合。

### 6.2 异步数据聚合引擎 (Telemetry Aggregator)
**痛点**：原厂主板通过 Cmd 143 每秒打包所有状态一次性推送上来。但在散件模式下，各模块的采样率不同（ADC可能 50Hz，温控可能 1Hz，IO可能 2Hz）。
**解决方案**：在 HAL 层引入**数据黑板 (Data Blackboard) 聚合引擎**。
1. **并发采集**：各个子模块的驱动独立运行自己的 Goroutine 进行轮询或事件监听。
2. **黑板更新**：读到的数据通过读写锁写入后端的共享内存对象（黑板）中。
3. **节拍组装**：Collector 按照前端需要的固定节拍（如 10Hz）对“黑板”进行数据快照，组装成统一的 `telemetryEvent` 通过 WebSocket 推送给前端。
**结果**：前端完全无感知底层是单板还是散件。

### 6.3 硬件拓扑描述文件 (Topology Config)
不能将串口号和波特率硬编码在代码里。需引入 `hardware_topology.json` 或 `.env` 结构：
```json
{
  "mode": "modular",
  "modules": {
    "temperature": { "driver": "modbus_rtu", "port": "/dev/ttyS1", "baud": 9600, "slave_id": 1 },
    "io": { "driver": "modbus_rtu", "port": "/dev/ttyS1", "baud": 9600, "slave_id": 2 },
    "adc": { "driver": "serial_stream", "port": "/dev/ttyS2", "baud": 115200 }
  }
}
```
后端启动时解析该拓扑，利用工厂模式（Factory Pattern）动态实例化并挂载对应的子驱动。

### 6.4 异常隔离与降级 (Fault Tolerance)
由于多模块共存，若某一模块（如气路 EPC）掉线，不应导致整个程序崩溃。
- **独立 Keep-Alive**：每个子驱动独立管理自己的断线重连逻辑。
- **状态隔离**：某模块超时，仅在对应的 `telemetryEvent` 字段（如 `Epc[]`）标记为空或写入告警码，其他模块（如 ADC 和温控）继续运行，并在 UI 上局部标红，实现真正的容错隔离。
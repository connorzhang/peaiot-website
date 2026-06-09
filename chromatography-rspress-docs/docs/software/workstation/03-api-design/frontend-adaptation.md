# HAL 架构下多硬件模式的前后端自适应适配规划

## 1. 架构目标与背景
系统需要支持“老主板（Legacy）”和“散件模块（Modular）”两种硬件模式。
在散件模式下，采用的第三方温控板提供了 **8个物理通道**，但其功能被划分为：
- **通道 1~4**：用于温度控制（对应前4路温控）。
- **通道 5~8**：配置为 IO 模式，用于开关量输出（如控制阀门的吸合与释放，对应4路事件）。

**核心需求**：
无论底层是 6路温控+8路事件（老主板），还是 4路温控+4路事件（散件模块），前端的 UI 操作逻辑必须保持一致且兼容。前端界面需要根据当前选择的硬件模式，自动裁剪并只展示可用的通道数，实现“底层硬件决定前端形态”的数据驱动架构。

---

## 2. 后端架构设计 (Backend Architecture)

### 2.1 引入硬件能力描述 (Hardware Capabilities)
在 HAL 层（`InstrumentDriver` 接口）新增一个方法，用于向外层声明当前硬件的具体能力配置：

```go
type HardwareCapabilities struct {
    Mode          string   `json:"mode"`           // "legacy" | "modular"
    TempChannels  int      `json:"temp_channels"`  // 6 or 4
    TempLabels    []string `json:"temp_labels"`    // 中文显示名称，如 ["进样口1", "柱箱", "检测器1", "进样口2", ...]
    EventChannels int      `json:"event_channels"` // 8 or 4
    EventLabels   []string `json:"event_labels"`   // 中文显示名称，如 ["十通阀", "事件2", ...]
}

type InstrumentDriver interface {
    // ... 现有方法 ...
    GetCapabilities() HardwareCapabilities
}
```

### 2.2 驱动层差异化实现

#### 老主板驱动 (`LegacyGCKCDriver`)
- **TempChannels**: 6，标签为 `["进样口1(Inj1)", "柱箱(Col)", "检测器1(Det1)", "进样口2(Inj2)", "检测器2(Det2)", "辅助(Aux)"]`。
- **EventChannels**: 8，标签为 `["事件1", "事件2", ..., "事件8"]`。
- **实现逻辑**：按现有方式，将温度和事件打包成 Cmd 128 / Cmd 16 / Cmd 67 指令下发。

#### 散件模块驱动 (`ModularDriver`)
- **TempChannels**: 4，标签为 `["进样口1", "柱箱", "检测器1", "进样口2"]`（复用前四路定义，且提供友好的中文名称）。
- **EventChannels**: 4，标签为 `["十通阀(事件1)", "六通阀(事件2)", "事件3", "事件4"]`（根据实际接线情况给出具体中文含义）。
- **实现逻辑 (地址映射解耦)**：
  - **温度控制**：驱动层接收到 1~4 路的温度设定值后，将其映射并下发至 Modbus 温控表的 **通道 1~4** 对应的寄存器。
  - **事件控制**：驱动层接收到 1~4 路的事件（IO）指令后，将其映射并下发至 Modbus 温控表的 **通道 5~8**（即 IO 模式下的开关寄存器/线圈）。
  - **彻底解耦**：业务逻辑层（分析方法运行引擎）依然只知道“设置事件1”，而不知道这个事件实际上对应的是物理温控板的第5路。这个映射转换完全在 `ModularDriver.SetEvents()` 内部消化。

### 2.3 暴露 Capabilities API
提供一个 REST API（例如 `GET /api/device/capabilities`），供前端在页面初始化时调用，获取当前硬件拓扑。

---

## 3. 前端架构设计 (Frontend Architecture)

### 3.1 状态管理 (Vue State)
在全局状态（如 Vuex/Pinia 或 `App.vue` 的共享状态）中保存从后端获取的 `Capabilities`。

```javascript
// 伪代码
const state = {
    capabilities: {
        temp_channels: 6,
        temp_labels: ['Inj1', 'Col', 'Det1', 'Inj2', 'Det2', 'Det3'],
        event_channels: 8
    }
}
```

### 3.2 动态渲染与 UI 自适应
前端不再硬编码通道数，而是通过 `capabilities` 进行数据驱动渲染：

#### 温度设置页面
- **表格行数动态化**：通过 `v-for="(label, index) in capabilities.temp_labels"` 渲染温度设置行。
- 如果当前是 Modular 模式（4路），表格自动只显示 4 行，彻底屏蔽第5、6路的操作入口。

#### 事件/时序设置页面
- **事件行数动态化**：事件矩阵原本是 8 行，现在根据 `capabilities.event_channels` 渲染（8行或4行）。
- **时间步长（列数）保持不变**：操作逻辑（如吸合时间、释放时间设定）与老主板完全一致。

#### 实时大屏/谱图监控页
- 监控卡片同样根据 `temp_labels` 动态生成。老主板显示 6 个温度仪表盘，散件模式仅显示 4 个。

### 3.3 数据兼容性处理 (方法文件加载)
当用户将一个在“老主板”下保存的分析方法（包含6路温度、8路事件）加载到“散件模式”的系统中时：
- **前端裁剪**：读取 JSON 文件后，根据当前的 `Capabilities`，只截取前 4 路数据赋值给表单，忽略多余的配置。
- **后端防御**：当接收到前端下发的配置 JSON 时，驱动层按自身的通道数限制进行读取，防止越界报错。

---

## 4. 时序执行引擎兼容性 (Edge Autonomy)
后端的时序引擎（State Machine）负责在分析周期内按时执行事件切换。
- 时序引擎本身不需要修改，它依然按照前端下发的 `EventMatrix`（不管里面是4行还是8行）和时间戳进行计时。
- 当到达触发点时，引擎调用 `Driver.SetEvents(matrix)`。
- 如果是 ModularDriver，它只读取前 4 行的状态，并将其转换为 Modbus 05 功能码发给通道 5~8，完美实现逻辑复用。

## 5. 总结
此架构的核心在于 **“后端驱动层消化物理映射，前端 UI 依据能力声明动态裁剪”**：
1. **统一的业务心智**：不论底层硬件如何，业务层永远是“设置温度X”和“设置事件Y”。
2. **物理层隔离**：“事件1等于温控板通道5”这种肮脏的硬件细节被死死封印在 `ModularDriver` 内部。
3. **前端自适应**：前端退化为单纯的“视图层”，完全由后端的能力接口（Capabilities）决定显示几行、隐藏几行，实现了零侵入的向下兼容。
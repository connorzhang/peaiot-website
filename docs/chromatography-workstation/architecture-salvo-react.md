# 架构设计文档：Salvo胖后端 + React瘦前端 + Tauri桌面壳

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 1. 核心设计理念 (Core Philosophy)
本架构遵循**“极致胖后端 (Fat Backend)，极度瘦前端 (Thin Client)”**的原则，旨在构建一个高性能、防篡改、且支持“一云多端”的现代色谱数据系统 (CDS)。

- **前端 (React)**：被降级为一个纯粹的“渲染引擎”和“事件收集器”。不包含任何色谱逻辑、不进行图谱运算、不处理硬件状态。
- **后端 (Salvo/Rust)**：接管一切。包括百万级数据的 LTTB 降采样、一阶/二阶导数寻峰算法、序列有限状态机 (FSM)、以及 AIA/AnIML 文件的解析。

## 2. 系统分层架构 (System Layers)

### 2.1 纯核心逻辑层 (chroma-core)
- **技术栈**：Pure Rust
- **职责**：
  - `math_engine`: 提供 LTTB 降采样、平滑滤波 (Savitzky-Golay) 等高性能数学运算。
  - `integration`: 安捷伦经典积分事件的算法实现 (Peak picking, Tangent Skim)。
  - `parser`: 解析底层仪器生成的原始二进制数据。

### 2.2 边缘网关与控制层 (chroma-edge)
- **技术栈**：Rust + Salvo 框架
- **职责**：
  - 作为 HTTP/WebSocket 服务运行，对外暴露安全的 OpenAPI (Swagger)。
  - `fsm_sequence`: 维护硬件进样与泵控的异步状态机，确保断网不宕机。
  - `db_sqlite`: 本地数据持久化，保证 21 CFR Part 11 的审计追踪记录。
  - 动态下发视口数据 (LOD)：根据前端的屏幕分辨率和缩放范围，动态压缩并下发图谱数据。

### 2.3 哑终端表现层 (chroma-ui)
- **技术栈**：React + WebGL (LightningChart/uPlot)
- **职责**：
  - 接收 Salvo 传来的 `Float64Array` 二进制流，直接喂给 WebGL 画布。
  - 用户在图谱上拖拽基线时，发送 `{ action: "drag_baseline", start: 1.2, end: 1.5 }` 给 Salvo。
  - 渲染安捷伦经典的四大视图布局。

### 2.4 跨端部署外壳
- **本地工作站**：使用 **Tauri** 将 `chroma-ui` 网页与 `chroma-edge` 二进制文件打包成单一的 `.exe`，提供零延迟的原生桌面体验。
- **云端管理平台**：将 `chroma-edge` 部署在云服务器，前端通过浏览器直接访问。

## 3. 关键数据流 (Data Flow)

### 3.1 实时色谱图渲染 (百万级数据防卡死)
1. 仪器以 100Hz 生成数据 -> `chroma-edge` 存入内存/本地 SQLite。
2. 前端发起请求，附带容器宽度 `width: 1920px`。
3. `chroma-core` 使用 LTTB 算法，将百万数据压成 4000 个特征点。
4. `chroma-edge` 将这 4000 个点以二进制流发送给前端。
5. 前端 WebGL 瞬间重绘，CPU/内存占用极低。
# 色谱工作站重构开发路线图 (Development Roadmap)

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


基于 Salvo + React 的“一云多端”架构，分为五个核心开发阶段推进：

## Phase 1: 核心引擎库搭建 (Rust Core Foundation)
- [x] 初始化 Rust Workspace 结构 (`chroma-core`, `chroma-edge`)
- [ ] 在 `chroma-core` 中实现 LTTB (Largest Triangle Three Buckets) 降采样算法。
- [ ] 在 `chroma-core` 中复刻安捷伦经典积分算法骨架 (面积剔除、峰宽计算)。

## Phase 2: Salvo 边缘网关服务 (Edge Server)
- [ ] 引入 Salvo 框架，搭建 REST API 骨架。
- [ ] 集成 `salvo-oapi` 自动生成符合前端契约的 Swagger 接口文档。
- [ ] 实现 WebSocket 推送通道，用于实时色谱流 (Real-time trace) 与状态机广播。

## Phase 3: 前后端联调与 WebGL 图谱渲染 (UI Integration)
- [ ] 在前端项目中引入高性能 WebGL 图表库 (uPlot / LightningChart)。
- [ ] 联调 WebSocket：前端接收 Salvo 推送的二进制特征点并平滑渲染。
- [ ] 联调 REST API：前端发送积分参数，Salvo 返回新计算的峰表与重绘数据。

## Phase 4: 序列状态机与本地持久化 (State Machine & DB)
- [ ] 在 Salvo 中使用 `tokio` 实现非阻塞的序列执行引擎 (Sequence Runner)。
- [ ] 接入 SQLite (如 `sqlx` 或 `sea-orm`)，记录方法变更与审计追踪。

## Phase 5: Tauri 本地桌面化与云端发布 (Packaging)
- [ ] 配置 Tauri，将 React 构建产物与 Salvo 后端打包为本地 `.exe`。
- [ ] 验证本地环境的串口 / GPIB 通讯 FFI 接口。
- [ ] 梳理云端部署 Nginx 配置，实现局域网 B/S 架构访问。
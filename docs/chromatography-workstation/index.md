# VOCs 色谱边缘工作站 - 开发文档

## 项目概述

VOCs 色谱边缘工作站是一个基于 Go 语言开发的工业级色谱数据采集与分析系统，用于环境监测领域的挥发性有机物在线监测。

### 主要功能

- **实时数据采集**：支持 FID/TCD 检测器的数据采集
- **循环进样控制**：自动循环分析与结果计算
- **SiLA 2 标准接口**：符合国际标准化组织的仪器通信协议
- **MQTT 数据上报**：支持远程数据传输
- **本地数据持久化**：SQLite 数据库存储历史数据

### 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 语言 | Go | 1.22+ |
| 数据库 | SQLite | 3.x |
| 通信协议 | SiLA 2 gRPC | 1.0 |
| 实时通信 | Server-Sent Events (SSE) | - |
| 前端 | 原生 HTML5/JS/CSS | - |

---

## 快速导航

- [架构设计](architecture.md)
- [API 接口文档](api.md)
- [部署指南](deployment.md)
- [开发指南](development.md)
- [SiLA 2 集成](sila2.md)
- [故障排查](troubleshooting.md)
- [色谱气路逻辑与动画演示](01-overview/valve_logic_demo.html)
- [色谱气路逻辑与动画演示](01-overview/valve_logic_demo.html)

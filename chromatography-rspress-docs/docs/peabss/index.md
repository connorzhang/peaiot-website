# PeaBSS

## 项目简介

PeaBSS（豌豆易联业务服务支撑系统）是一个基于 Go 语言开发的环保物联网平台，主要用于环保监测设备的数据采集、存储、分析和可视化。

### 主要功能

- **设备管理**：支持设备注册、状态监控、配置管理
- **多协议支持**：HJ212、MQTT、Modbus 协议接入
- **数据采集**：实时数据采集和处理
- **数据存储**：PostgreSQL + TimescaleDB 时间序列存储
- **数据可视化**：GIS 大屏、AI BI 大屏
- **告警管理**：阈值告警、多渠道通知
- **AI 集成**：智能诊断、数据分析、对话式 AI
- **MCP 服务**：模型上下文协议服务，支持 AI 工具调用

## 技术栈

- **后端**：Go 1.21
- **前端**：Webix、ECharts、Leaflet
- **数据库**：PostgreSQL + TimescaleDB
- **部署**：Docker、GitHub Actions

## 快速开始

### 环境要求

- Go 1.21 或更高版本
- PostgreSQL 14 或更高版本（含 TimescaleDB 插件）
- 操作系统: Linux、Windows

### 安装步骤

1. **数据库准备**
   ```bash
   # 使用 Docker 部署 PostgreSQL + TimescaleDB
   docker run -d --name peabss-db -p 5432:5432 \
     -e POSTGRES_DB=peaiot \
     -e POSTGRES_USER=peaiot \
     -e POSTGRES_PASSWORD=peaiot \
     timescale/timescaledb:latest-pg14
   ```

2. **项目配置**
   创建 `peabss.yml` 配置文件（参考 `docs/开发文档.md`）

3. **初始化数据库**
   ```bash
   ./peabss -initdb
   ```

4. **启动服务**
   ```bash
   ./peabss
   ```

## 访问地址

- **Web 管理界面**：http://localhost:1870
- **Portal 服务**：http://localhost:1875
- **GIS 监控大屏**：http://localhost:1875/portal/gis_dashboard/1
- **AI BI 大屏**：http://localhost:1875/portal/ai_bi_dashboard
- **MCP 工具测试**：http://localhost:1875/portal/mcp_tool_test

## 版本信息

| 版本 | 日期 | 描述 |
|------|------|------|
| v3.0.81 | 2026-04-15 | 基础版本 |
| v3.0.82 | 2026-04-15 | 新增 AI 对话功能和 MCP 工具测试页面 |

## 开发文档

详细的开发文档请参考 `docs/开发文档.md`

## 贡献指南

1. **Fork 仓库**
2. **创建分支**
3. **提交更改**
4. **创建 Pull Request**
5. **代码审查**
6. **合并代码**

## 联系与支持

- **GitHub Issues**：提交 bug 报告和功能请求
- **邮件支持**：support@peaiot.com
- **技术文档**：https://docs.peaiot.com

## 许可证

MIT License

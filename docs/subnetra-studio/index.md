# Subnetra Studio

> 文档版本：v2026.06.20.1559  
> 更新时间：2026-06-20 15:59:17 +08:00  
> 适用范围：Subnetra Studio 控制台、Subnetra 10.79 Overlay、Windows + WSL SOCKS 桥接、sing-box TUN 分流、ZeroTier 出口网关验证

Subnetra Studio 是基于 Subnetra 核心引擎开发的现代化 SD-WAN 网络配置与管理控制台，目标是在保持底层核心极轻量的前提下，为服务器、桌面端、临时 Agent 和运维节点提供可视化、可审计、可自动化的网络接入能力。

## 文档导航

- [项目概览](./overview.md)：项目定位、设计边界和当前已验证能力。
- [系统架构](./architecture.md)：Rust 控制面、Web 控制台、Windows 客户端和核心隔离原则。
- [Subnetra 10.79 Overlay](./subnetra-overlay.md)：10.79 网段节点配置、连通性结果和 TUN 状态说明。
- [WSL SOCKS 桥接](./wsl-socks-bridge.md)：在 WSL 内运行 Subnetra，并把 Overlay 内 SOCKS 服务映射给 Windows。
- [Windows 分流代理](./windows-routing-proxy.md)：使用 sing-box TUN 让 GitHub 与指定 IP 走 Subnetra SOCKS，其它流量直连。
- [局域网复用](./lan-reuse.md)：其它局域网电脑如何复用当前 Windows 主机的代理网关。
- [ZeroTier 出口与 IPv6 网关](./zerotier-gateway.md)：M2 IPv4 出口、IPv6 `/128` 分配和 NDP Proxy 验证。
- [运维与排障](./operations.md)：常见故障、检查命令和恢复路径。

## 当前结论

- `10.79.0.0/24` Overlay 已验证可用，Spoke 节点可访问 `10.79.0.1/.2/.3/.4`。
- `10.79.0.4:18080` SOCKS 已验证支持远端 DNS 解析与 HTTPS 访问。
- Windows + WSL + sing-box TUN 可实现 GitHub 相关域名与 `20.62.58.5/32` 透明分流。
- 普通国内流量保持直连，不应被 Subnetra 或 ZeroTier 出口接管。
- M2 已验证可作为 ZeroTier IPv4 出口和公网 IPv6 `/128` 网关，但该能力与 Subnetra 代理分流是两套独立路径。

## 安全说明

本文档只保留可公开的网络拓扑、配置结构和验证方法。所有 PSK、SSH 密码、SOCKS 真实账号密码、服务器登录凭据均使用占位符表示，不写入文档中心。
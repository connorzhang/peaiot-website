> 🏷️ 当前版本: v0.2.0 | ⏱️ 最后同步: 2026-06-26 17:48:52 | 🔗 构建 Commit: 6fbe8df



>  当前版本: v2026.06.26.1147 |  最后同步: 2026-06-26 11:47:18 |  构建 Commit: 1ea0cea

## 项目定位

Subnetra Studio 面向 Subnetra 核心引擎提供管理控制台、配置展示、策略下发和运维验证能力。项目定位不是复刻 ZeroTier，而是面向轻量、临时、可嵌入、可审计的 AI-native 网络组件。

## 核心价值

- **轻量执行**：Subnetra 核心程序体积小，适合嵌入 Linux 终端、临时 Agent 和边缘节点。
- **三层 Overlay**：当前能力基于 TUN/IP，不是二层 TAP/Bridge。
- **控制面独立**：Web 管理端只作为控制台延伸，运行时状态变更通过 UDS/命令交互完成。
- **代理分流友好**：可在 WSL 内运行 Subnetra，并把 Overlay 内 SOCKS 服务给 Windows 或局域网复用。
- **运维可审计**：通过明确的路由、代理、日志和计数器验证每一段链路。

## 已验证能力

| 能力 | 结论 |
| --- | --- |
| 10.x Overlay | 已测通 `10.x.x.x` |
| WSL Subnetra | 已可创建 `snr0=10.x.x.x/24` |
| SOCKS 访问 | 已可通过 `10.x.x.x:18080` 访问 HTTPS 网站 |
| Windows TUN 分流 | GitHub 与指定 IP 走 Subnetra SOCKS |
| 普通流量直连 | 百度等普通站点保持 direct |
| ZeroTier IPv4 出口 | 节点可作为出站代理 |
| ZeroTier IPv6 网关 | 节点可给客户端分配公网 IPv6 `/128` |

## 明确边界

- 不直接修改 `subnetra-src` 核心子模块。
- 不把 Web 控制台设计成直接热改 `config.json` 的状态修改器。
- 不在生产服务器部署编译环境。
- 不把测试凭据、PSK、SOCKS 密码写进公开文档。
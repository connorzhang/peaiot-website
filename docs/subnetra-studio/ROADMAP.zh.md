> 🏷️ 当前版本: v0.2.4 | ⏱️ 最后同步: 2026-06-27 00:06:29 | 🔗 构建 Commit: 072f76c

本文档概述了 **Subnetra Studio** 项目的愿景、目标、非目标以及里程碑。
它是人类维护者和 AI 助手的共同产品方向指南。

## 1. 愿景
为 Subnetra Layer-3 自适应网络引擎提供一个健壮的、具备“零配置”体验的管理与编排层 (Studio)。必须无缝处理 Hub-Spoke NAT 打洞保活、ZeroTier 集成以及跨平台客户端 (Windows CLI, Linux 守护进程)，同时保持绝对的凭证安全。

## 2. 目标
- **跨平台管理**：统一的 `web-server` (Linux) 和 `win-client` (Windows)，用于与底层的 Subnetra 引擎交互。
- **无感 NAT 穿透**：内置 spoke->hub 的 NAT 保活（UDP Hole Punching），以应对运营商级 NAT (CGNAT) 激进的超时丢弃。
- **ZeroTier 私有网络编排**：自动化、安全地配置 ZeroTier Planet 和网络设置，通过指定的跳板机（如使用 `iptables` DNAT）正确路由流量。
- **绝对的凭证安全**：安全处理 SSH 密钥、PSK 和端点 IP 地址。机密信息绝不能进入版本控制。

## 3. 非目标 (我们不做什么)
- **臃肿的 Web 框架**：核心编排器使用轻量级的、静态类型或编译型语言（Rust/Salvo, Zig），而非沉重的 Node.js/Python 运行时。
- **动态配置同步**：不引入复杂的基于云的分布式一致性系统（如 etcd/Consul）。配置通过本地文件静态下发并严格校验。
- **自作主张的环境篡改**：Studio 绝不会在未经用户同意的情况下激进地尝试安装缺失的系统级工具链。严格依赖 `load-dev-env` 硬件指纹策略。

## 4. 里程碑
- [x] **M1: 基线与安全重构**：建立严格的 `.gitignore` 边界、`AGENT.md` 规范，并彻底抹除历史遗留的臃肿/泄露 Git 提交。
- [ ] **M2: Subnetra 引擎集成**：稳定基于 Zig 的 `subnetrad` 与 Rust `web-server` 仪表板的集成通信。
- [ ] **M3: 健壮的 Spoke 保活**：实现并加固 15 秒间隔的 UDP 保活机制，防止在严格 NAT 下出现 ZT 断连。
- [ ] **M4: 自动化发布**：通过 GitHub Actions 实现自动化、多平台的产物构建（Linux Musl, Windows CLI）。

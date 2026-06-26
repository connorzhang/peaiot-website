> 🏷️ 当前版本: v0.2.0 | ⏱️ 最后同步: 2026-06-26 20:13:54 | 🔗 构建 Commit: 072f76c




>  当前版本: v2026.06.26.1147 |  最后同步: 2026-06-26 11:47:18 |  构建 Commit: 1ea0cea

This document outlines the vision, goals, non-goals, and milestones for the **Subnetra Studio** project.
It serves as the product direction compass for both human maintainers and AI agents.

## 1. Vision
Provide a robust, zero-configuration-feeling management and orchestration layer (Studio) for the Subnetra Layer-3 adaptive networking engine. It must seamlessly handle Hub-Spoke NAT pinholing, ZeroTier integration, and cross-platform clients (Windows CLI, Linux daemons) while maintaining absolute credential security.

## 2. Goals
- **Cross-Platform Management**: A unified `web-server` (Linux) and `win-client` (Windows) that interact with the underlying Subnetra engine.
- **Zero-Touch NAT Traversal**: Built-in spoke->hub NAT keepalive via UDP Hole Punching to survive aggressive Carrier-Grade NAT (CGNAT) timeout drops.
- **ZeroTier Private Network Orchestration**: Automated, secure provisioning of ZeroTier Planet/Network settings, routing traffic correctly through designated jump hosts (e.g., via `iptables` DNAT).
- **Absolute Credential Safety**: Secure handling of SSH keys, PSK, and endpoint IP addresses. Secrets never touch version control.

## 3. Non-Goals (What we will NOT build)
- **Bloated Web Frameworks**: We use lightweight, statically typed or compiled languages (Rust/Salvo, Zig) instead of heavy Node.js/Python runtimes for the core orchestrator.
- **Dynamic Configuration Sync**: No complex cloud-based distributed consensus (like etcd/Consul). Configuration is statically provisioned via local files and strictly validated.
- **Auto-magic System Environment Tampering**: The Studio will not aggressively attempt to install missing OS-level toolchains without user consent. We rely on the `load-dev-env` fingerprinting strategy.

## 4. Milestones
- [x] **M1: Baseline & Security Overhaul**: Establish strict `.gitignore` boundaries, `AGENT.md` guidelines, and wipe bloated/leaked historical Git commits.
- [ ] **M2: Subnetra Engine Integration**: Stabilize the Zig-based `subnetrad` integration with the Rust `web-server` dashboard.
- [ ] **M3: Robust Spoke Keepalives**: Implement and harden the 15s UDP keepalive mechanism to prevent ZT disconnects on strict NATs.
- [ ] **M4: Automated Releases**: GitHub Actions for automated, multi-platform artifact generation (Linux Musl, Windows CLI).

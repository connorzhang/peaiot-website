# Subnetra Studio

基于 [jamiesun/subnetra](https://github.com/jamiesun/subnetra) 核心引擎开发的现代化 SD-WAN 网络配置与管理控制台。

## 当前已验证能力

- Subnetra 可作为轻量三层 TUN Overlay 使用，适合把 Linux 节点、服务器和临时 Agent 纳入同一虚拟网段。
- Linux 节点可通过公网 UDP 端口接入 Hub，并通过 `snr0` 获得 Overlay 地址。
- Windows 主机可通过 WSL 运行 Subnetra，再把 Overlay 内的 SOCKS 服务映射成本机端口供 Windows 使用。
- Windows 可通过 sing-box TUN 做系统级分流，让指定域名和指定 IP 透明走 Subnetra SOCKS，其它流量保持直连。
- ZeroTier 可作为独立的运维底座，用于节点管理、托管路由、IPv4 出口和公网 IPv6 `/128` 分配验证。

## 项目愿景

Subnetra 本身是一个极其轻量且高性能的底层网络路由与组网工具，但缺乏直观的管理界面。
本项目旨在为 Subnetra 提供跨平台的现代化管理面板，降低组网门槛。

## 已验证网络拓扑

### Subnetra 10.79 Overlay

已验证一个 Spoke 节点接入公网 Hub 后，可以访问 `10.79.0.1`、`10.79.0.2`、`10.79.0.3`、`10.79.0.4`。

```json
{
  "negotiation_version": 1,
  "role": "spoke",
  "local_tun_mtu": 1400,
  "listen_ports": [28020],
  "virtual_subnet": "10.79.0.0/24",
  "local_id": 5,
  "local_tun_ip": "10.79.0.5/24",
  "local_routes": ["10.79.0.5/32"],
  "keepalive_secs": 20,
  "obfuscate": true,
  "peers": [
    {
      "id": 1,
      "endpoint": "39.107.35.41:28020",
      "allowed_src": "10.79.0.0/24",
      "name": "subnetra-hub",
      "psk": "按实际部署填写"
    }
  ]
}
```

验证结果：

```text
10.79.0.1: 0% packet loss, avg 27ms
10.79.0.2: 0% packet loss, avg 65ms
10.79.0.3: 0% packet loss, avg 69ms
10.79.0.4: 0% packet loss, avg 61ms
```

### WSL SOCKS 桥接

Windows 主机不需要直接进入 `10.79.0.0/24` 路由域。推荐在 WSL 内运行 Subnetra，并把 Overlay 内的 SOCKS 服务转成本机端口。

```text
Windows 应用
  -> 127.0.0.1:18080
  -> WSL relay
  -> WSL snr0 10.79.0.5
  -> 10.79.0.4:18080
```

验证命令：

```bash
curl --socks5-hostname <用户名>:<密码>@10.79.0.4:18080 https://example.com/
```

验证结果：

```text
SOCKS5 connect to example.com:443 (remotely resolved)
SOCKS5 request granted
HTTP/2 200
```

### Windows 系统级分流

Windows 侧使用 sing-box TUN 做透明分流：

```text
GitHub 相关域名 -> 127.0.0.1:18080 -> Subnetra SOCKS
20.62.58.5/32 -> 127.0.0.1:18080 -> Subnetra SOCKS
其它流量 -> direct
```

已验证规则效果：

```text
github.com -> outbound/socks[subnetra-socks]
20.62.58.5 -> outbound/socks[subnetra-socks]
www.baidu.com -> outbound/direct[direct]
```

## Windows + WSL 常驻部署方案

### WSL 侧组件

WSL 侧包含三个部分：

- `/etc/subnetra/config.json`：Subnetra Spoke 配置。
- `/usr/local/bin/subnetra-socks-relay.py`：TCP relay，将 `0.0.0.0:18080` 转发到 `10.79.0.4:18080`。
- `/usr/local/bin/subnetra-socks-bridge.sh`：拉起 Subnetra、配置 `snr0`、启动 relay。

核心验证命令：

```bash
ip -br addr | grep snr0
ping -c 3 10.79.0.4
ss -lntp | grep 18080
curl --socks5-hostname <用户名>:<密码>@127.0.0.1:18080 https://example.com/
```

### Windows 侧组件

Windows 侧包含三个部分：

- `sing-box.exe`：复用本机已有二进制。
- `sing-box.json`：TUN 与分流规则配置。
- `SubnetraGithubProxy`：Windows 计划任务，以最高权限运行 sing-box TUN。

关键配置：

```json
{
  "type": "socks",
  "tag": "subnetra-socks",
  "server": "127.0.0.1",
  "server_port": 18080,
  "version": "5",
  "username": "按实际部署填写",
  "password": "按实际部署填写"
}
```

分流规则：

```json
{
  "domain_suffix": [
    "github.com",
    "githubusercontent.com",
    "githubassets.com",
    "github.io",
    "githubapp.com",
    "github.dev",
    "githubstatus.com",
    "git-lfs.github.com"
  ],
  "outbound": "subnetra-socks"
}
```

```json
{
  "ip_cidr": ["20.62.58.5/32"],
  "outbound": "subnetra-socks"
}
```

## 局域网复用方案

局域网内其它电脑不需要部署 Subnetra，可以把当前 Windows 主机作为 SOCKS 网关。

```text
局域网电脑
  -> 当前 Windows 主机:18080
  -> WSL relay
  -> Subnetra 10.79 Overlay
  -> 10.79.0.4:18080
```

如果局域网电脑只需要使用代理，直接配置 SOCKS5 即可：

```text
SOCKS5 Host: 当前 Windows 主机局域网 IP
Port: 18080
Username: 按实际部署填写
Password: 按实际部署填写
```

如果局域网电脑也需要“仅 GitHub 与指定 IP 走代理，其它直连”，则在该电脑上安装 sing-box/Clash/Mihomo，并把出站 SOCKS 指向当前 Windows 主机的 `18080`。

## ZeroTier 出口与 IPv6 网关验证

ZeroTier 侧已验证 M2 节点可以作为 IPv4 出口与 IPv6 网关使用。

### IPv4 出口

已验证单 IP 托管路由：

```text
20.62.58.5/32 via 10.8.5.219
```

M2 侧关键规则：

```bash
sysctl -w net.ipv4.ip_forward=1
iptables -t nat -A POSTROUTING -s 10.8.5.0/24 -o <默认出口网卡> -j MASQUERADE
iptables -A FORWARD -i <ZT网卡> -o <默认出口网卡> -j ACCEPT
iptables -A FORWARD -i <默认出口网卡> -o <ZT网卡> -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

注意：公网出口网卡必须动态检测，不能假设固定为 `eth0`。

### IPv6 网关

已验证 M2 拥有可用公网 IPv6 `/64`，并可通过 NDP Proxy 给 ZeroTier 客户端分配公网 `/128`。

```text
M2 ZT IPv6 网关: 2620:b9:e000:101::fffe/128
客户端 IPv6: 2620:b9:e000:101::1007/128
```

关键机制：

```text
IPv6 forwarding + 客户端 /128 路由 + 公网网卡 NDP Proxy
```

验证结果：

```text
curl -6 https://api64.ipify.org -> 2620:b9:e000:101::1007
IPv6 测试站评分: 10/10
```

## 故障排查

### TUN 显示 UNKNOWN

`snr0 UNKNOWN` 对 TUN 虚拟网卡是常见状态，不代表异常。关键看：

```text
UP, LOWER_UP
RX/TX 计数
Overlay ping 是否成功
```

### GitHub 分流失败

优先检查：

```powershell
Get-ScheduledTask -TaskName SubnetraGithubProxy
Get-Process sing-box
```

再检查 WSL：

```bash
pgrep -af 'subnetra-socks-relay|subnetrad'
ss -lntp | grep 18080
ping -c 3 10.79.0.4
```

### Windows 网络变卡

优先检查是否残留默认路由：

```powershell
Get-NetRoute -DestinationPrefix '0.0.0.0/0'
Get-NetRoute -DestinationPrefix '::/0'
```

如果 ZeroTier 或测试 TUN 意外接管默认路由，应立即停止对应 TUN 进程或计划任务。

## 核心架构设计

本项目采用 **Rust 一统天下** 的“双擎驱动”架构，底层核心业务代码完全共享，上层按需渲染不同的前端 UI：

1. **core-lib (核心逻辑库)**
   - 负责解析与读写底层的 `config.json` 静态配置文件。
   - 提供标准化的数据结构（Models）和序列化支持。
2. **web-server (Linux/服务器 Web 控制台)**
   - 技术栈：`Rust (Salvo)` + `Vue 3` + `TailwindCSS`
   - 编译为单文件二进制，运行在带公网 IP 的 Hub 节点上。提供 REST API 与内嵌的 Web 面板，用于全局拓扑管理。
   - **架构红线：基于 UDS 的双轨制管理（2026-06-10 更新）**
     - **静态配置 (Read-Only)**：底层 `config.json` 包含基础模式与节点配置，仅允许在引擎关闭或重启前修改。Web 端仅作展示，修改强提示需重启。
     - **动态策略 (Hot-Reload)**：通过封装 UNIX Domain Socket (`/var/run/subnetra.sock`)，向引擎发送 `policy add` 动态下发路由规则，发送 `save` 固化内存状态至 `subnetra.policy` 文件，实现无缝热更新。
3. **win-client (Windows 桌面客户端)**
   - 技术栈：`Rust` + `Slint (原生 UI 引擎)` + `SVG`
   - 编译为极小体积的 `.exe`，无需 WebView2 依赖。
   - 提供极速的启动体验、毫秒级的硬件加速渲染、以及圆角发光的现代极简客户端 UI。

---

## 💻 开发环境配置指南

如果您在一台全新的设备上准备参与开发，请严格按照以下步骤配置环境。

### 1. 基础环境依赖

本项目完全基于 Rust 开发。为了编译 Windows 客户端，必须安装 C++ 编译工具链（MSVC）。

- **安装 Rust**：访问 [Rust 官网](https://www.rust-lang.org/tools/install) 下载并安装 `rustup-init.exe`。
- **安装 MSVC (解决 `link.exe not found`)**：
  1. 下载 [Visual Studio Build Tools](https://aka.ms/vs/17/release/vs_BuildTools.exe)
  2. 运行安装程序时，勾选左上角的 **“使用 C++ 的桌面开发” (Desktop development with C++)**。
  3. 点击右下角安装，完成后建议重启电脑。

### 2. 获取代码 (重要)

本项目使用了 Git Submodule（子模块）来引入原作者的 `subnetra` 底层核心源码。**克隆时必须带上子模块参数。**

**全新克隆项目：**
```bash
git clone --recursive git@github.com:peaiot/subnetra-studio.git
```
*(如果忘记加 `--recursive`，克隆下来的 `subnetra-src` 文件夹将是空的。)*

**补救克隆（如果已经克隆了空目录）：**
进入项目根目录后执行：
```bash
git submodule update --init --recursive
```

### 3. 工程结构说明

```text
subnetra-studio/
├── Cargo.toml            # Workspace 工作区配置文件
├── README.md             # 本开发指南
├── subnetra-src/         # 🔒 [子模块] 官方底层引擎源码 (ghproxy加速)
├── core-lib/             # 🛠️ [核心库] 解析 JSON 与执行 CLI
├── web-server/           # 🌐 [Web端] 基于 Axum 的单文件服务程序
└── win-client/           # 💻 [Win端] 基于 Slint 的原生桌面应用
```

### 4. 本地编译与运行

```bash
# 运行 Web 服务端
cargo run -p web-server

# 运行 Windows 客户端 (Slint UI 将会弹出)
cargo run -p win-client
```

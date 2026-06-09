# Subnetra Studio

基于 [jamiesun/subnetra](https://github.com/jamiesun/subnetra) 核心引擎开发的现代化 SD-WAN 网络配置与管理控制台。

## 项目愿景

Subnetra 本身是一个极其轻量且高性能的底层网络路由与组网工具，但缺乏直观的管理界面。
本项目旨在为 Subnetra 提供跨平台的现代化管理面板，降低组网门槛。

## 核心架构设计

本项目采用 **Rust 一统天下** 的“双擎驱动”架构，底层核心业务代码完全共享，上层按需渲染不同的前端 UI：

1. **core-lib (核心逻辑库)**
   - 负责解析与读写 `/etc/subnetra/config.json` 静态配置文件。
   - 负责包装 CLI 命令，执行 `subnetra status --json` 与 `subnetra policy add`。
   - 提供标准化的数据结构（Models）给上层使用。
2. **web-server (Linux/服务器 Web 控制台)**
   - 技术栈：`Rust (Axum)` + `原生 HTML/JS` + `SVG 渲染`
   - 编译为单文件二进制，运行在带公网 IP 的 Hub 节点上。提供 REST API 与内嵌的 Web 面板，用于全局拓扑管理。
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

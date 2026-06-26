<!-- TRAE_DOC_META_START -->
> 🏷️ 当前版本: v0.2.2 | ⏱️ 最后同步: 2026-06-26 20:59:01 | 🔗 构建 Commit: 072f76c
<!-- TRAE_DOC_META_END -->








## 模块划分

```text
subnetra-studio/
 core-lib/       # Rust 强类型配置、状态模型与复用逻辑
 web-server/     # Rust + Salvo Web 控制台
 win-client/     # Windows 桌面客户端规划
 subnetra-src/   # 核心引擎子模块，禁止直接修改
```

## 控制面与数据面

```text
Web / Windows Client
  -> core-lib
  -> UDS / CLI 指令
  -> Subnetra Core
  -> TUN / UDP Overlay
```

### 静态配置

`config.json` 描述基础网络、节点、PSK、路由等冷启动配置。运行中的核心不依赖 Web 端直接修改该文件完成状态切换。

### 动态策略

运行时策略应通过 UDS 发送命令，例如 `policy add`、`save`，由核心程序自行处理和固化。

## Web 控制台部署原则

- 开发构建应在开发机完成。
- 生产服务器只部署最终二进制和服务单元。
- Web 服务启动后必须真实验证端口和反代可访问性。
- 与核心通信时，Linux 使用 UDS，Windows 开发环境可使用 mock 数据。

## Windows/WSL 代理分流架构

```text
Windows 应用
  -> sing-box TUN
  -> 规则匹配 GitHub / 20.62.58.5
  -> 127.0.0.1:18080
  -> WSL relay
  -> WSL Subnetra snr0
  -> 10.79.0.4:18080
```

该架构让 Windows 无需直接加入 `10.79.0.0/24` 路由域，也能系统级复用 Overlay 内的 SOCKS 服务。
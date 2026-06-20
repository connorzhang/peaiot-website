# WSL SOCKS 桥接

## 使用场景

Windows 主机不直接访问整个 `10.79.0.0/24`，而是只复用 Overlay 内的 SOCKS 服务。

```text
Windows 应用
  -> 127.0.0.1:18080
  -> WSL relay
  -> WSL snr0 10.79.0.5
  -> 10.79.0.4:18080
```

## WSL 侧组件

| 文件 | 作用 |
| --- | --- |
| `/etc/subnetra/config.json` | Subnetra Spoke 配置 |
| `/usr/local/bin/subnetra-socks-relay.py` | TCP relay，监听 `0.0.0.0:18080` |
| `/usr/local/bin/subnetra-socks-bridge.sh` | 启动 Subnetra、修正 `snr0`、启动 relay |

## 验证命令

```bash
ip -br addr | grep snr0
ping -c 3 10.79.0.4
ss -lntp | grep 18080
curl --socks5-hostname <用户名>:<密码>@127.0.0.1:18080 https://example.com/
```

## 已验证结果

```text
snr0 UNKNOWN 10.79.0.5/24
10.79.0.4 ping 0% packet loss
0.0.0.0:18080 listening
HTTP/2 200
```

## 为什么不用 Windows 直接路由 10.79

WSL2 有独立网络命名空间。Windows 到 WSL TUN 的路由、转发、防火墙和回程路径都需要额外处理。只映射 SOCKS 端口更稳定，也更容易恢复。
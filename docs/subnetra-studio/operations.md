> 🏷️ 当前版本: v0.2.0 | ⏱️ 最后同步: 2026-06-26 17:48:52 | 🔗 构建 Commit: 6fbe8df



>  当前版本: v2026.06.26.1147 |  最后同步: 2026-06-26 11:47:18 |  构建 Commit: 1ea0cea

## GitHub 分流失败

先检查 Windows 侧：

```powershell
Get-ScheduledTask -TaskName SubnetraGithubProxy
Get-Process sing-box
Get-NetAdapter -Name subnetra-tun
```

再检查 WSL 侧：

```bash
pgrep -af 'subnetra-socks-relay|subnetrad'
ss -lntp | grep 18080
ping -c 3 10.x.x.x
```

最后验证 SOCKS：

```bash
curl --socks5-hostname <用户名>:<密码>@127.0.0.1:18080 https://example.com/
```

## Windows 网络变卡

优先检查默认路由：

```powershell
Get-NetRoute -DestinationPrefix '0.0.0.0/0'
Get-NetRoute -DestinationPrefix '::/0'
```

如果测试 TUN 或 ZeroTier 意外接管默认路由，应停止对应进程或计划任务。

## xx.xx.xx.xx 没走代理

检查 sing-box 日志中是否出现：

```text
outbound/socks[subnetra-socks]: outbound connection to xx.xx.xx.xx
```

如果没有，说明规则未命中或 TUN 未运行。

## 10.x Overlay 不通

检查 TUN：

```bash
ip -br addr | grep snr0
ip -s link show snr0
```

检查 UDP：

```bash
sudo tcpdump -ni any 'udp and host api.example.com and port 28020'
```

判断依据：

- 有 TX 无 RX：本机发出但远端没有回包。
- UDP 双向但 ping 不通：检查 PSK、local_id、allowed_src 和 Hub 配置。
- `snr0 UNKNOWN`：不代表异常，TUN 虚拟网卡常见状态。

## 文档同步失败

文档同步失败时按顺序检查：

1. 本地 `publish-to-docs` 技能版本是否满足主仓库 `sync-policy.json`。
2. 文档是否含敏感内容。
3. GitHub 是否可达，必要时使用本机 SOCKS 代理。
4. 主仓库是否只修改了 `docs/<project-id>/`。
5. 推送后服务器自动构建是否成功。
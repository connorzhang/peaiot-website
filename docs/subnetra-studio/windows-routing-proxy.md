

>  当前版本: v2026.06.26.1147 |  最后同步: 2026-06-26 11:47:18 |  构建 Commit: 1ea0cea

## 目标

让 Windows 上任意应用访问以下目标时自动走 Subnetra SOCKS：

- GitHub 相关域名
- `xx.xx.xx.xx/32`

其它流量保持本机直连。

## 运行链路

```text
Windows 应用
  -> sing-box TUN
  -> subnetra-socks outbound
  -> 127.0.0.1:18080
  -> WSL relay
  -> 10.x.x.x:18080
```

## SOCKS 出站配置

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

## GitHub 域名规则

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

## 指定 IP 规则

```json
{
  "ip_cidr": ["xx.xx.xx.xx/32"],
  "outbound": "subnetra-socks"
}
```

## 验证结果

```text
github.com -> outbound/socks[subnetra-socks]
xx.xx.xx.xx -> outbound/socks[subnetra-socks]
www.baidu.com -> outbound/direct[direct]
```

功能验证：

```text
https://github.com/ -> HTTP 200
http://xx.xx.xx.xx/ -> HTTP 404，代表网络已通但目标站点路径不存在
https://www.baidu.com/ -> HTTP 200，直连
```

## 注意事项

- sing-box TUN 需要管理员权限。
- DNS 需被 TUN 接管，否则 GitHub 域名可能解析超时或绕过规则。
- 如果网络变卡，优先检查是否误接管默认路由。
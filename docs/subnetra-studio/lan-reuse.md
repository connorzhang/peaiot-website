# 局域网复用

## 目标

局域网其它电脑无需部署 Subnetra，可复用当前 Windows 主机暴露的 SOCKS 网关。

```text
局域网电脑
  -> 当前 Windows 主机:18080
  -> WSL relay
  -> Subnetra 10.x Overlay
  -> 10.x.x.x:18080
```

## 简单代理模式

适用于浏览器、Git、curl、npm、cargo 等支持 SOCKS 的工具。

```text
SOCKS5 Host: 当前 Windows 主机局域网 IP
Port: 18080
Username: 按实际部署填写
Password: 按实际部署填写
```

验证：

```powershell
curl.exe --socks5-hostname <用户名>:<密码>@<Windows主机IP>:18080 https://example.com/
```

## 分流代理模式

如果局域网电脑也要实现仅 GitHub 与指定 IP 走代理，其它直连，则在该电脑上安装 sing-box、Clash 或 Mihomo。

出站 SOCKS 指向当前 Windows 主机：

```json
{
  "type": "socks",
  "tag": "subnetra-socks",
  "server": "当前 Windows 主机局域网 IP",
  "server_port": 18080,
  "version": "5",
  "username": "按实际部署填写",
  "password": "按实际部署填写"
}
```

规则与 Windows 本机一致：GitHub 相关域名和指定IP走 `subnetra-socks`，其它走 direct。

## 安全建议

- 只允许局域网网段访问 `18080`。
- 不要把 `18080` 暴露到公网。
- 如需长期开放，建议在 Windows 防火墙限制来源网段。
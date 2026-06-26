

>  当前版本: v2026.06.26.1147 |  最后同步: 2026-06-26 11:47:18 |  构建 Commit: 1ea0cea

## 定位

ZeroTier 是独立的运维底座，可用于托管路由、出口节点、IPv6 验证和节点管理。它与 Subnetra SOCKS 分流是两套路径。

## IPv4 出口节点

已验证节点可作为 `10.x.x.x/24` 的 IPv4 出口节点。

托管路由示例：

```text
xx.xx.xx.xx/32 via 10.x.x.x
```

M2 侧关键规则：

```bash
OUT_DEV=$(ip route show default | awk 'NR==1{for(i=1;i<=NF;i++){if($i=="dev"){print $(i+1); exit}}}')
sysctl -w net.ipv4.ip_forward=1
iptables -t nat -A POSTROUTING -s 10.x.x.x/24 -o "$OUT_DEV" -j MASQUERADE
iptables -A FORWARD -i <ZT网卡> -o "$OUT_DEV" -j ACCEPT
iptables -A FORWARD -i "$OUT_DEV" -o <ZT网卡> -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

注意：公网出口网卡必须动态检测，不能假设固定为 `eth0`。

## IPv6 网关

已验证 M2 拥有可用公网 IPv6 `/64`，并可通过 NDP Proxy 给 ZeroTier 客户端分配公网 `/128`。

```text
M2 ZT IPv6 网关: 2xxx:x:xxxx:xxx::fffe/128
客户端 IPv6: 2xxx:x:xxxx:xxx::1007/128
```

关键机制：

```text
IPv6 forwarding + 客户端 /128 路由 + 公网网卡 NDP Proxy
```

验证结果：

```text
curl -6 https://api64.ipify.org -> 2xxx:x:xxxx:xxx::1007
IPv6 测试站评分: 10/10
```

## 性能边界

该方式虽然给客户端分配了公网 IPv6，但默认网关仍在 M2，访问路径仍会经过 M2 所在机房，延迟和速度受跨地域链路与 M2 出口质量影响。
> 🏷️ 当前版本: v0.2.5 | ⏱️ 最后同步: 2026-06-27 00:14:37 | 🔗 构建 Commit: 072f76c

## Spoke 配置模板

```json
{
  "negotiation_version": 1,
  "role": "spoke",
  "local_tun_mtu": 1400,
  "listen_ports": [28020],
  "virtual_subnet": "10.x.x.x/24",
  "local_id": 5,
  "local_tun_ip": "10.x.x.x/24",
  "local_routes": ["10.x.x.x/32"],
  "keepalive_secs": 20,
  "obfuscate": true,
  "peers": [
    {
      "id": 1,
      "endpoint": "api.example.com:28020",
      "allowed_src": "10.x.x.x/24",
      "name": "subnetra-hub",
      "psk": "your_psk_here"
    }
  ]
}
```

## 启动与接口修正

```bash
sudo /usr/local/bin/subnetrad --config /etc/subnetra/config.json
sudo ip link set snr0 mtu 1400
sudo ip addr add 10.x.x.x/24 dev snr0
sudo ip link set snr0 up
```

## 连通性验证

```bash
ping -c 4 10.x.x.x
```

已验证结果：

```text
10.x.x.x: 0% packet loss, avg 27ms
```

## UDP 抓包确认

```bash
sudo tcpdump -ni any 'udp and host api.example.com and port 28020'
```

成功时可看到双向 UDP：

```text
本机:28020 -> api.example.com:28020
api.example.com:28020 -> 本机:28020
```

## TUN UNKNOWN 说明

`snr0 UNKNOWN` 是 TUN 虚拟网卡常见状态。判断接口是否可用应看：

```text
UP / LOWER_UP
RX/TX 计数
Overlay ping 是否成功
```

不是所有虚拟网卡都能像物理网卡一样显示明确的 carrier 状态。

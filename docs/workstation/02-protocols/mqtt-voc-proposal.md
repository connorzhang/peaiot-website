# VOCs 色谱边缘工作站 MQTT 协议标准规范 (草案)

## 1. 背景与痛点分析

在审阅原有的 `MQTT.md`（PEA780303型号）协议时，我们发现存在以下导致数据冗余和带宽浪费的痛点：

1. **严重的数据冗余**：
   - 每次上报都在 Payload 中包含 `index`、`clientid`、`Node`、`mn` 和 `imei`，这些本质上都是同一个设备唯一标识的变体。
   - `factor` 因子字典中，每个因子都重复携带了 `name` (名称) 和 `unit` (单位)。对于 VOCs 这种动辄十几个组分的设备，每次都上传“非甲烷总烃”、“mg/m³”等固定元数据会造成极大的带宽浪费。
2. **动静数据未分离**：
   - 设备的 GPS 经纬度 (`lng`, `lat`)、IP 地址、ICCID 等几乎是不变的静态信息，却和传感器数据绑在一起高频上传。
3. **缺乏针对色谱的精细化分层**：
   - VOCs 色谱工作站的数据分为几种完全不同的生命周期：**周期性硬件状态**（温度、压力，秒/分钟级）、**分析结果**（组分浓度，周期级 2-15 分钟）、**系统日志**（按需触发，15秒队列管控）。混在一个结构里会导致极大浪费。

---

## 2. 核心优化原则

为了适应大规模工控机部署和低带宽网络（IoT 物联网卡），并无缝对接 Elasticsearch：

1. **依赖 Topic 路由提取 MN 号**：
   - 将 `MN`（即 ClientID / 唯一编码）放在 MQTT Topic 路径中。MQTT Broker (如 EMQX) 或 Logstash/Fluentd 订阅 Topic 时，可以自动从 Topic 提取 MN 并作为 Elasticsearch 的 `index` 路由键。Payload 内部不再重复发送 `MN` 和 `index`。
2. **动静分离，多 Topic 策略**：
   - 将上报分为 `info` (基础信息)、`status` (硬件工况)、`result` (分析结果) 和 `log` (运行日志) 四个独立的 Topic。
3. **因子扁平化（K-V键值对）**：
   - 去除 Payload 内部的中文名称和单位，全部使用**标准因子代码**（如参考 HJ212 的 `a24088` 代表非甲烷总烃）或简写英文 Key 作为键，值为 Float 类型。单位和名称由上位机或云平台在展示时统一映射。

---

## 3. Topic 设计规范

所有 Topic 的基础前缀为：`vocs/device/{MN}` （`{MN}` 替换为实际的设备唯一编码，与 ClientID 一致）。

| Topic 路径 | 发送频率 | 说明 |
| :--- | :--- | :--- |
| `vocs/device/{MN}/info` | 开机时和每小时整点触发一次（可在界面关闭） | 设备静态信息（IP, ICCID, 经纬度, 固件版本等） |
| `vocs/device/{MN}/status` | 每 1 分钟上报一次（可在界面关闭） | 硬件工况（各路温度实测值、气路 EPC 压力实测值） |
| `vocs/device/{MN}/result` | 每次色谱分析完成时立即触发（可在界面关闭） | 色谱分析结果（NMHC, THC, CH4 及各组分浓度） |
| `vocs/device/{MN}/log` | 事件触发（受 15 秒队列限流管控，可在界面关闭） | 设备运行日志、报警事件、报错信息 |

---

## 4. Payload 数据结构定义 (JSON)

### 4.1 设备信息 (Info)
**Topic:** `vocs/device/{MN}/info`
```json
{
  "timestamp": 1717488684,
  "model": "VOC-Edge-V1",
  "version": "v0.3.8",
  "ip": "10.88.88.31",
  "iccid": "898608401024D0015976",
  "lng": 121.411905,
  "lat": 31.124663,
  "csq": 24
}
```

### 4.2 硬件工况状态 (Status)
**Topic:** `vocs/device/{MN}/status`
*注：只传实测值，不传设定值，以最扁平的格式传输。*
```json
{
  "timestamp": 1717488700,
  "temp_inj1": 105.1,
  "temp_col": 100.0,
  "temp_det1": 250.0,
  "epc_carrier_psi": 13.01,
  "epc_h2_psi": 60.05,
  "epc_air_psi": 200.12
}
```

### 4.3 分析结果 (Result)
**Topic:** `vocs/device/{MN}/result`
*注：采用因子代码映射，剥离中文和单位。例如 a24088 为非甲烷总烃，a05001 为总烃，a05002 为甲烷。*
```json
{
  "timestamp": 1717488800,
  "cycle_time": 120, 
  "factors": {
    "a24088": 1.25,
    "a05001": 2.45,
    "a05002": 1.20,
    "benzene": 0.05,
    "toluene": 0.02
  }
}
```

### 4.4 系统日志与报警 (Log)
**Topic:** `vocs/device/{MN}/log`
*注：遵循【日志需队列功能，15秒覆盖一次】的核心规则，如果15秒内产生多条日志，将打包为一个数组上传，防止刷屏。*
```json
{
  "timestamp": 1717488815,
  "logs": [
    {
      "time": 1717488802,
      "level": "INFO",
      "msg": "分析周期结束，开始计算面积"
    },
    {
      "time": 1717488810,
      "level": "WARN",
      "msg": "氢气压力波动，当前 58.2 psi"
    }
  ]
}
```

---

## 5. 云端 ElasticSearch 路由与解析建议

1. **Logstash / Fluentd 接收端**：
   - 订阅通配符 Topic：`vocs/device/+/+`
   - 使用正则或路径拆分，将 Topic 中的 `{MN}` 提取出来。
   - 动态拼接写入 ES 的索引名：`index => "vocs-mqtt-%{MN}-%{+YYYY.MM}"`。
2. **前端与云平台映射**：
   - 云端数据库维护一份 `Factor Dictionary`（如 `a24088` -> `非甲烷总烃`，单位 `mg/m³`）。
   - 在前端查询和展示 ES 数据时，再将这些固定不变的名称和单位渲染上去。

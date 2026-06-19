# GCKC 色谱主板协议（命令/帧格式）说明（源码整理版）

> 目标：像“Modbus 寄存器说明”一样，把色谱主板（GC 主板）与工作站之间的 **GCKC TCP 协议**整理成可查的“命令字典 + 报文格式 + 字段说明”。  
> 范围：仅覆盖主板↔工作站主站链路（TCP 25001/8000，帧头 `GCKC`）。不包含 502/503 的从站 Modbus-like 协议（见 [SLAVE_STATION.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/SLAVE_STATION.md) 与 [MODBUS_STANDARD_MAP.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/MODBUS_STANDARD_MAP.md)）。  
> 数据来源：以旧版 WinForms 工作站 `IBrainChrom2018` 的协议实现（`TcpServerSocket`）与当前 Go Collector 的协议实现（`src/edge/internal/protocol/gckc`、`chromsend143`）为依据。若某些字段在源码中未被使用/未解码，会明确标为“未知/待抓包验证”。

---

## 1. 传输与端口

- **工作站作为 TCP Server**，主板作为 TCP Client 连接。
- 监听端口：
  - `25001/TCP`：主端口（主站 Main Server）
  - `8000/TCP`：同协议的额外监听（旧版兼容）
- 关键实现与入口：
  - 旧版收包：`TcpServerSocket.OneDataReceive` → `AnalyseReceivedData`  
    - [TcpServerSocket.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs)
  - Go 收包：`gckc.StreamDecoder` → `gckc.Decode` → `processFrame`  
    - [stream.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/gckc/stream.go) / [frame.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/gckc/frame.go)

---

## 2. 帧格式（固定外壳）

### 2.1 总结构

```
Frame = Header(4) + Len(2) + Body(Len) + CRC(1)
Header = ASCII "GCKC"
Len    = uint16 big-endian，表示 Body 的字节数
CRC    = uint8，对 Body 逐字节查表累积校验（见下）
```

Body 固定前缀：

| 字段 | 长度 | 偏移（从 Body 开始） | 编码/说明 |
|---|---:|---:|---|
| DeviceID | 16 | 0 | ASCII 字符串，右侧 `0x00` 补齐（Go `Encode` 也是 16 bytes） |
| Seq | 2 | 16 | `uint16` big-endian 序列号（旧版 `short_0++`，Go `Frame.Seq`） |
| Cmd | 1 | 18 | 命令号（十进制/十六进制都常用） |
| Payload | N | 19 | 依 Cmd 不同 |

参考实现：
- Go 编解码：[frame.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/gckc/frame.go#L11-L63)
- 旧版说明：[MASTER_STATION.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/MASTER_STATION.md#L53-L74)

### 2.2 CRC（校验算法）

- CRC 为 **1 字节**，对 `Body` 逐字节滚动查表：
  - 旧版：`IBrainConvert.BitByBitNo(body, idxSt=0, length=bodyLen)`  
    - [IBrainConvert.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/IBrainConvert.cs#L251-L260)
  - Go：`gckc.CRC(body)`（同一张 256 表）  
    - [crc.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/gckc/crc.go#L32-L38)

### 2.3 设备 ID 特殊兼容

旧版对 `DeviceID=="709131284A484845"` 有占位替换逻辑（把占位 ID 替换成当前连接 ID），联调时抓包可能遇到：  
- [MASTER_STATION.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/MASTER_STATION.md#L75-L82)

---

## 3. 常见字段编码约定（payload 内部用得多）

### 3.1 整数与端序
- `Len`、`Seq`：big-endian
- payload 内多处出现 `u16 = b[i]*256 + b[i+1]`（big-endian）

### 3.2 BCD（十进制压缩）温度/数值
旧版多处用 BCD（例如温度）：
- 2 字节 BCD → `d1 d2 d3 . d4`（一位小数），并支持负号编码  
  - 旧版 `IBrainConvert.ByteArray2Float` / Go `bcd2Temp1`（实现等价）
  - Go 版温度解析在 `parseTemps143`

### 3.3 “655.35”无效值
旧版 EPC 上报中把 `655.35` 视为无效（显示 `--`）：  
- [Answer159](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1665-L1676)

---

## 4. 命令总览（命令字典）

### 4.1 旧版内置“命令号→名称”字典（基础集）

旧版在 `GC08_GCs.lsItems` 内维护了一份“常用命令/应答”的对照表（建议作为阅读入口）：  
- [GC08_GCs.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/GC08_GCs.cs#L81-L157)

这份表覆盖了 **0~67**、以及常见应答 **128~195**，但不包含全部扩展命令（例如 249~253、234~239、216~218 等）。

### 4.2 命令分类索引（建议按域理解）

- **采集/分析流程**：16/17/18/19/22/23（及应答 144/145/146/147/150/151）；循环参数 4/12（及应答 132/140）
- **实时数据流**：143（温度+检测器点列）、159（EPC 气路实测）
- **控温/程序升温/事件表**：0/1/2（查询）与 8/9/10（设置），应答 128/129/130/136/137/138；事件表1 101/228/229
- **EPC 参数/名称/控制**：33/34/36/37/38/39/40/41（及应答 161~169）
- **网络/名称/使能**：48/49/64/65/66/67（及应答 176/177/192~195）
- **扩展/专项**：249~253（点火门限/高压），48/50（查询/设置点火时长，及应答 178/181），250/251（查询/报警），234/236（保护温度），238/239（多位阀使能），216~218（液相泵）等

---

## 5. 详细命令说明（表格）

> 说明：下表把“发送/接收格式”写成 **Body.Payload** 的结构（Frame 外壳固定不再重复）。  
> 如果 payload 在源码中只是透传 `InsDeviceManager.GetXXX()`，这里先给“结构来源/用途”，后续需要再补“字段逐项解释”（这通常需要结合 `InsDeviceManager` 的字节布局或抓包逐字节对照）。

### 5.1 采集/分析流程命令

| Cmd(dec/hex) | 方向 | 名称（旧版） | Payload（请求） | Payload（应答/推送） | 说明 |
|---:|---|---|---|---|---|
| 16 / 0x10 | WS→GC | 控温反转 (Toggle) | 无 | 144 应答 | 翻转温控状态（开变关/关变开）。旧版代码误认为开始/停止 |
| 17 / 0x11 | WS→GC | 无效/未使用 | 无 | 145 应答 | 旧版代码误认为开始/停止，底层硬件实际无效 |
| 18 / 0x12 | WS→GC | 启动全部样品分析 | 无 | 146 应答 | 多通道自动分析开始 |
| 19 / 0x13 | WS→GC | 样品全部分析停止 | 无 | 147 应答 | 多通道停止 |
| 22 / 0x16 | WS→GC | 启动指定通道开始分析 | `channel` 1B（旧版：当前通道号；Go：query 参数 channel） | 150 应答 | 单通道开始；主板在到达自动进样循环间隔后，也会主动发送 150，此时上位机用于作为新一轮循环的开始信号。 |
| 23 / 0x17 | WS→GC | 指定通道分析停止 | `channel` 1B（或 mask） | 151 应答 | 单通道停止 |
| 245 / 0xF5 | WS→GC | 到采集时间请求停止（旧版自动） | `channelMask` 1B | （未在字典内命名） | 旧版在到“停止时间/采集时间”后会 `SendCmd(245, mask)` 触发停止（见 [CheckDtcChannels](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2732-L2960)）。当前重构版已改为“到点仅出数”。 |
| 4 / 0x04 | WS→GC | 查询自动进样时间参数 | 无 | 132/140 应答 | 查询循环时间参数 |
| 12 / 0x0C | WS→GC | 设置自动进样时间参数 | 6字节 BCD (间隔与次数等) | 无 | 下发循环间隔(min)与循环次数。格式：[0-1] FloatToBCD(间隔); [2-3] IntToBCD(次数); [4] 进样消耗时间; [5] 进样点亮时间 |

通道字段说明：
- `SendCmd(byte cmd, byte channelMask)` 的 payload 规则：默认 1 字节，22/23 会写入 `sglNumberStart/sglNumberEnd`，其他命令直接回传 `{mask}`  
  - [method_15](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2253-L2268)

### 5.2 实时数据推送：Cmd=143（ChromSend）

**方向**：GC→WS（主板主动推送）  
**用途**：同时承载：
- 温度（至少 6 路 BCD 温度；旧版还从 payload 尾部解析额外 2 路温度）
- 检测器数据块（点列）——每个数据块包含 detectorType、采样频率、点列

#### 5.2.1 payload 结构（基于 Go `chromsend143.ParseAll` 与旧版逻辑一致）

固定头（最少 20 字节，旧版要求 `len>=20`）：

| 偏移（payload） | 长度 | 字段 | 说明 |
|---:|---:|---|---|
| 0..11 | 12 | 温度区 | 6 路 2B BCD 温度（旧版 `Class44.float_0[0..5]`）；Go 当前用于 inj1/col/det1/（留）/inj2 |
| 18 | 1 | count | 数据块数量（detector block 数） |
| 19.. | N | blocks | `count` 个数据块顺序排列 |

每个 detector block：

| 字段 | 长度 | 说明 |
|---|---:|---|
| detType | 1 | 检测器/通道类型码（常见：0x40/0x41/0x50/0x51） |
| rsv1 | 1 | 未使用/保留 |
| rsv2 | 1 | 未使用/保留 |
| freqByte | 1 | 频率字节；点数 `points=freqByte*10`；采样率 `freq10=freqByte*10`（Hz）；`dtS=1/freq10` |
| values | `points*4` | 每点 4 字节“BCD 小数”编码（含符号位），需换算为 pA 值 |

对应实现：
- Go 解析：[parse.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/chromsend143/parse.go#L31-L115)

#### 5.2.2 通道映射（detType → channel）

| detType | channel |
|---:|---:|
| 0x40 (64) | 0 |
| 0x41 (65) | 1 |
| 0x50 (80) | 2 |
| 0x51 (81) | 3 |

见 [channelFromDetectorType](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/chromsend143/parse.go#L117-L130)。

#### 5.2.3 点值换算（raw → pA）

Go 版当前实现了旧版一致风格的变换（平方/衰减系数/放大），用于把 4B BCD 小数转换成最终曲线值：  
- [transform](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/chromsend143/parse.go#L132-L152)

#### 5.2.4 旧版额外温度（payload 尾部 2 路）

旧版会从 payload **末尾**解析两路温度（AUX3/COL2），公式 `(u16 - 10000)/100`：  
- [AnalyseReceivedData_ChromSend 末尾解析](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1087-L1091)

> 注：这两路温度在不同固件可能并非总存在；建议以抓包确认 payload 尾部是否固定带 4 字节。

### 5.3 EPC 气路实测推送：Cmd=159

**方向**：GC→WS（主板主动推送）  
**用途**：推送多路 EPC（压力/流量/状态）。旧版显示为 EPCControl 的“输入/实测(psi)/实测(sccm)”等列。

#### 5.3.1 payload 结构（基于旧版 `Answer159`）

| 偏移 | 长度 | 字段 | 说明 |
|---:|---:|---|---|
| 0 | 1 | n | EPC 条目数量 |
| 1.. | 变长 | items | n 个条目依次排列 |

每个条目（按旧版读取顺序）：

| 字段 | 长度 | 说明 |
|---|---:|---|
| typeOrIdx? | 1 | 旧版每条目开始会 `num2++` 跳过 1B，疑似 type/idx（待确认） |
| inputPsi? | 2 | `u16/100`，旧版变量 `num3`（显示列“输入(psi)”） |
| actualPsi | 2 | `u16/100`，旧版变量 `num4`（显示列“实测(psi)”） |
| actualSccm | 2 | `u16/100`，旧版变量 `mydouble`（显示列“实测(sccm)”） |
| unknown | 1~2 | 旧版调用 `Byte2ToInt(mybyte, num2)`（读 2B BCD）但只 `num2++`，说明这里存在“2B 字段+状态字节重叠/实现缺陷/协议压缩”，需抓包校准 |
| state | 1 | 旧版 `myByte`（用于开关/状态） |

### 5.4 专项扩展：点火时长与 IP 地址（重要避坑）

> **安全红线**：由于点火时长的应答指令与 IP 地址配置极易混淆，上位机必须严格区分解析，绝对禁止“盲写”测试，防止将错误数据覆盖到主板 EEPROM（例如将 IP 段 192 写入点火时长导致 192 秒极限异常）。

| Cmd(dec/hex) | 方向 | 名称 | Payload | 说明 |
|---:|---|---|---|---|
| 48 / 0x30 | WS→GC | 查询点火时长 | 无 | `Cmd 178` 或 `181` 应答 |
| 50 / 0x32 | WS→GC | 设置点火时长 | 1字节 `duration` (秒) | 将点火时长烧录到主板 EEPROM 中（通常为 10 秒以内）。 |
| 178, 181 | GC→WS | 点火时长应答 | 1字节 `duration` | 主动上报或对 `Cmd 48` 的回应。 |
| 49 / 0x31 | WS→GC | 设置 IP 地址 | 6字节 (IP[4] + Port[2]) | 设定主板的网络参数，极度危险。 |
| 176, 177 | GC→WS | 查询 IP 应答 | 6字节 (IP[4] + Port[2]) | 回应上位机或主动上报当前 IP。第一个字节通常是 `192`。旧版代码在收到该报文时会触发 `Answer176()`。绝对不能当做点火时长（181）处理。 |

对应实现：
- [Answer159](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1640-L1684)

#### 5.3.2 当前 Go/重构侧处理方式

当前 Go Collector 为了让 UI 可配置映射（载气/氢气/空气索引不固定），会在 telemetry 事件中带出：
- `epc[]`：`[{psi,sccm}, ...]`（按条目序号 0..n-1）
- 并保留旧的 `carrier/h2/air` 三路字段作为兼容（默认取前 3 路）

实现见：
- `telemetryEvent.Epc`： [main.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/cmd/collector/main.go#L74-L99)
- `Cmd=159` 处理： [processFrame](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/cmd/collector/main.go#L445-L487)

### 5.4 控温/程序升温/事件表（查询/设置）

这组命令的特点是：**请求 payload 可能为空（查询）或为一个结构体字节块（设置）**；应答 payload 为同结构体字节块。结构体的字节布局由 `InsDeviceManager.GetXXX()` 与 `SetXXX(byte[])` 决定。

| Cmd | 方向 | 名称 | Payload（请求） | 应答 Cmd | Payload（应答） | 结构来源 |
|---:|---|---|---|---:|---|---|
| 0 | WS→GC | 控温参数查询 | 无 | 128 | TempSetedList | 返回 24 字节：前 12 字节 6 路设定，后 12 字节 6 路保护 |
| 8 | WS→GC | 控温参数设置 | 24 字节 | 136 | （确认/回读） | 同 Cmd 0 的 24 字节结构 |
| 1 | WS→GC | 程序升温参数查询 | 无 | 129 | TempSettingList | `GetTempSettingList/SetTempSettingList` |
| 9 | WS→GC | 程序升温参数设置 | TempSettingList | 137 | （确认/回读） | 同上 |
| 2 | WS→GC | 外部事件表0查询 | 无 | 130 | EventTable0 | `GetEventTable0/SetEventTable0` |
| 10 | WS→GC | 外部事件表0设置 | EventTable0 | 138 | （确认/回读） | 同上 |
| 100 | WS→GC | 外部事件表1查询 | 无 | 228 | EventTable1 | `GetEventTable1` |
| 101 | WS→GC | 外部事件表1设置 | EventTable1 | 229 | — | `WriteEventTable1` |
| 228 | GC→WS | 外部事件表1查询应答 | — | — | — | 返回 96 字节 BCD 矩阵对应事件 5~8 |
| 211 | GC→WS | 外部事件开关状态应答 | — | — | byte[25] 为 eventState | [Answer211](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1832-L1842) |
| 212 | GC→WS | 外部事件开关设置应答 | — | — | 复用缓存 `byte_0` | [Answer212](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1844-L1853) |

> 注：上表的“结构体字节布局”如果你确实需要做到“寄存器级别逐字段”，建议下一步把 `InsDeviceManager` 的 `GetTempSetedList/GetTempSettingList/GetEventTable0/...` 的实现逐字段拆解并补充到本文件（这部分工作量较大，但可以做到完全对照）。

### 5.5 EPC 参数/名称/控制（查询/设置）

| Cmd | 方向 | 名称 | Payload | 应答 | 说明 |
|---:|---|---|---|---|---|
| 35 | WS→GC | 查询气路配置 | 无 | 163 | 气路配置块 |
| 33 | WS→GC | EPC设定参数查询 | 无 | 161 | EPC设定参数块 |
| 34 | WS→GC | EPC参数设定 | （结构块） | 162 | EPC设定返回 |
| 36 | WS→GC | 查询EPC模块工作参数 | `type` 等（见 `SendCmd_36`） | 164 | EPC 模块参数返回 |
| 37 | WS→GC | 设置EPC模块工作参数 | `type+params`（见 `SendCmd_37`） | 165 | 设置返回 |
| 38 | WS→GC | 查询EPC名称 | 无 | 166 | EPC 名称块 |
| 39 | WS→GC | 设置EPC名称 | 名称块 | 167 | 设置返回 |
| 40 | WS→GC | EPC控制状态查询 | 无 | 168 | 状态返回 |
| 41 | WS→GC | EPC控制 | `epcGasType` 1B（旧版固定 0） | 169 | 控制返回 |

对应入口（旧版 payload 组包）：  
- `SendCmd_Convert` 的 33/36/37/39/41 分支：[TcpServerSocket.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2514-L2550)

### 5.6 网络/名称/使能

| Cmd | 方向 | 名称 | Payload | 应答 | 说明 |
|---:|---|---|---|---|---|
| 48 | WS→GC | 查询网络参数 | 无 | 176 | 返回网络参数块 |
| 49 | WS→GC | 设置网络参数 | 网络参数块 | 177 | 设置返回 |
| 64 | WS→GC | 查询控区名称 | 无 | 192 | 返回控区名称 |
| 65 | WS→GC | 设置控区名称 | 名称块（见 `SendCmd_65`） | 193 | 设置返回 |
| 66 | WS→GC | 控温使能查询 | 无 | 194 | 返回 enable 位 |
| 67 | WS→GC | 控温使能设置 | enable 位（Bit 5=Inj1, Bit 4=Col, Bit 3=Det1, Bit 2=Inj2, Bit 1=Det2, Bit 0=Det3） | 195 | 设置返回 |
| 111 | WS→GC | 设置多位阀使能（扩展） | 复选框 bitset | 239 | 设置返回 |
| 238 | GC→WS | 多位阀使能查询应答（扩展） | — | — | 旧版收侧更新 `multivalveEnable` |

### 5.7 扩展/专项命令（旧版实现中出现）

| Cmd | 方向 | 名称/用途 | Payload（已知） | 说明 |
|---:|---|---|---|---|
| 249 | WS→GC | 设置点火门限 | 2B：`fire1*10`、`fire2*10`（各 1B） | 旧版 UI 文本框组包（见 `SendCmd_Convert case 249`） |
| 250 | WS→GC / GC→WS | 查询点火门限 / 查询应答 | 请求无；应答读 `frame[25..26]` `/10` | 旧版应答更新 UI（见 [AnalyseReceivedData case 250](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L610-L623)） |
| 251 | GC→WS | 主板异常报警码 | 影响 `StateYiqi/bError` 与 Modbus 镜像 | [AnalyseReceivedData case 251](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L624-L655) |
| 252 | WS→GC | 设置高压 | 3B：`highV(u16BE)` + `index(1B)` | [SendCmd_Convert case 252](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2642-L2664) |
| 253 | WS→GC / GC→WS | 查询高压 / 查询应答 | 请求 1B index；应答读 `frame[25..26]` | [SendCmd_Convert case 253](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2665-L2667) |
| 234/236 | GC→WS | 控温保护参数查询/设置应答 | 结构块 | 旧版收侧 `SetTempProtectList` |
| 216/217/218 | GC→WS | 液相泵相关 | payload 未完全拆解 | 旧版存在 `Answer217/Answer218` |
| 224/225/226/227 | GC→WS | 进样器型号/参数查询设置应答 | 结构块 | 旧版 `injectSet.ReadFromByte` 等 |

---

## 6. “完整协议”落地建议（把未知字段补齐到可发布程度）

如果你要做到“像 Modbus 寄存器文档一样，字段级 100% 明确”，建议按下面顺序补全（每步都有明确产出）：

1) **按命令号抓包对齐**  
   - 抓一轮完整流程：上电→查询参数→开始分析→143/159持续→停止→出数→再次循环  
   - 每个 Cmd 保存 3~5 条样本帧（包含不同通道/不同状态）
2) **把所有“结构块 payload”解码逐字段落表**  
   - 目标类：`InsDeviceManager` 的 `Get*/Set*` 相关方法（控温/程序升温/事件表/EPC配置/网络参数/控区名称/使能位等）
3) **把 EPC(159) 的条目结构彻底校准**  
   - 当前旧版实现对 `Byte2ToInt` 的步进疑似不一致，需要用抓包确认 “unknown 字段”到底是 2B 还是 1B
4) **建立版本标识**  
   - 在文档首页增加“固件版本/硬件版本号 Cmd=5/133 的样本”，把协议差异归档为“版本差异表”

---

## 7. 参考入口（源码）

- 主站协议总览：[MASTER_STATION.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/MASTER_STATION.md)
- 旧版收发与命令分发：
  - [TcpServerSocket.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs)
  - 命令字典：[GC08_GCs.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/GC08_GCs.cs#L81-L157)
- Go 协议实现：
  - GCKC 编解码：[frame.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/gckc/frame.go)
  - 143 数据块解析：[parse.go](file:///d:/GIT/VS2022/Chromatography-workstation/src/edge/internal/protocol/chromsend143/parse.go)

---

## 附录 A：命令号清单（源码枚举）

> 本清单用于回答“有哪些命令号存在”。名称来自 `GC08_GCs.lsItems` + `TcpServerSocket.AnalyseReceivedData/SendCmd_Convert` 的实际出现情况；未命名的标记为“（未命名/待补充）”。

| Cmd(dec/hex) | 名称（若已知） |
|---:|---|
| 0 / 0x00 | 控温参数查询 |
| 1 / 0x01 | 程序升温参数查询 |
| 2 / 0x02 | 外部事件参数查询 |
| 3 / 0x03 | 设置执行文件号 |
| 4 / 0x04 | 自动进样时间查询 |
| 5 / 0x05 | 硬件版本号查询 |
| 6 / 0x06 | 执行文件号查询 |
| 7 / 0x07 | 设置仪器序列号 |
| 8 / 0x08 | 控温参数设置 |
| 9 / 0x09 | 程序升温参数设置 |
| 10 / 0x0A | 外部事件参数设置 |
| 11 / 0x0B | 设置时钟 |
| 12 / 0x0C | 设置自动进样时间 |
| 13 / 0x0D | 检测器参数查询 |
| 14 / 0x0E | 检测器参数设置 |
| 16 / 0x10 | 控温反转 (Toggle) |
| 17 / 0x11 | 无效/未使用 (旧版误用) |
| 18 / 0x12 | 启动全部样品分析 |
| 19 / 0x13 | 样品全部分析停止 |
| 20 / 0x14 | 启动FID1点火 |
| 21 / 0x15 | 启动FID2点火 |
| 22 / 0x16 | 启动指定通道开始分析 |
| 23 / 0x17 | 指定通道分析停止 |
| 24 / 0x18 | （未命名/待补充） |
| 33 / 0x21 | EPC设定参数查询 |
| 34 / 0x22 | EPC参数设定 |
| 35 / 0x23 | 查询气路配置 |
| 36 / 0x24 | 查询EPC模块工作参数 |
| 37 / 0x25 | 设置查询EPC模块工作参数 |
| 38 / 0x26 | 查询EPC名称 |
| 39 / 0x27 | 设置EPC名称 |
| 40 / 0x28 | EPC控制状态查询 |
| 41 / 0x29 | EPC控制 |
| 48 / 0x30 | 查询网络参数 |
| 49 / 0x31 | 设置网络参数 |
| 50 / 0x32 | 设置点火时长（旧版 SendCmd_Convert） |
| 53 / 0x35 | （未命名/待补充） |
| 60 / 0x3C | （未命名/待补充） |
| 61 / 0x3D | 设定工作站量程（旧版 UI） |
| 62 / 0x3E | （未命名/待补充） |
| 63 / 0x3F | 短信报警（旧版 GetSmsAlarm） |
| 64 / 0x40 | 查询控区名称 |
| 65 / 0x41 | 设置控区名称 |
| 66 / 0x42 | 控温使能查询 |
| 67 / 0x43 | 控温使能设置 |
| 69 / 0x45 | 流量/气路状态（旧版 GetFlowState） |
| 80 / 0x50 | 短信/提示设置（GetSmsSetiingInfo） |
| 89 / 0x59 | （未命名/待补充） |
| 90 / 0x5A | 液相信息（旧版 GetLiquidInfo） |
| 91 / 0x5B | （旧版走 case 90 分支的 fallthrough，待确认） |
| 97 / 0x61 | 自动进样器参数设置（旧版 injectSet.GetByte） |
| 99 / 0x63 | 自动进样器控制位（旧版 AutoInjCtrl） |
| 100 / 0x64 | （未命名/待补充） |
| 101 / 0x65 | 外部事件表1参数设置（旧版） |
| 104 / 0x68 | 复位多位阀（旧版） |
| 106 / 0x6A | 控温保护参数设置（旧版） |
| 110 / 0x6E | （未命名/待补充） |
| 111 / 0x6F | 设置多位阀使能（旧版） |
| 128 / 0x80 | 控温参数查询应答 |
| 129 / 0x81 | 程序升温参数查询应答 |
| 130 / 0x82 | 外部事件参数查询应答 |
| 131 / 0x83 | 设置执行文件号应答 |
| 132 / 0x84 | 自动进样时间查询应答 |
| 133 / 0x85 | 硬件版本号查询应答 |
| 134 / 0x86 | 执行文件号查询应答 |
| 135 / 0x87 | 设置仪器序列号应答 |
| 136 / 0x88 | 控温参数设置应答 |
| 137 / 0x89 | 程序升温参数设置应答 |
| 138 / 0x8A | 外部事件参数设置应答 |
| 139 / 0x8B | 设置时钟应答 |
| 140 / 0x8C | 设置自动进样时间应答 |
| 141 / 0x8D | 检测器参数查询应答 |
| 142 / 0x8E | 检测器参数设置应答 |
| 143 / 0x8F | 温度数据/检测器数据流（主板推送） |
| 144 / 0x90 | 控温反转应答 |
| 145 / 0x91 | 无效应答 (旧版误用) |
| 146 / 0x92 | 启动全部样品分析应答 |
| 147 / 0x93 | 样品全部分析停止应答 |
| 150 / 0x96 | 启动指定通道分析应答 |
| 151 / 0x97 | 指定通道分析停止应答 |
| 159 / 0x9F | EPC数据（主板推送） |
| 161 / 0xA1 | EPC设定参数查询返回 |
| 162 / 0xA2 | EPC参数设定返回 |
| 163 / 0xA3 | 查询气路配置应答 |
| 164 / 0xA4 | 查询EPC模块工作参数应答 |
| 165 / 0xA5 | 设置查询EPC模块工作参数应答 |
| 166 / 0xA6 | 查询EPC名称应答 |
| 167 / 0xA7 | 设置EPC名称应答 |
| 168 / 0xA8 | EPC控制状态查询返回 |
| 169 / 0xA9 | EPC控制返回 |
| 172 / 0xAC | EPS 用于何处查询应答（旧版仅显示描述） |
| 175 / 0xAF | （旧版用于高压显示，名称在字典中写“自动进样器数据”，需抓包确认） |
| 176 / 0xB0 | 查询网络参数应答 |
| 177 / 0xB1 | 设置网络参数应答 |
| 178 / 0xB2 | 点火时长设置应答（旧版提及） |
| 181 / 0xB5 | 点火时长查询应答 |
| 188 / 0xBC | 工作站量程查询应答 |
| 189 / 0xBD | 工作站量程设置应答 |
| 190 / 0xBE | 是否鸣叫指令查询应答 |
| 191 / 0xBF | 是否鸣叫指令设置应答 |
| 192 / 0xC0 | 查询控区名称应答 |
| 193 / 0xC1 | 设置控区名称应答 |
| 194 / 0xC2 | 控温使能查询应答 |
| 195 / 0xC3 | 控温使能设置应答 |
| 208 / 0xD0 | 鸣叫及文字提示应答 |
| 211 / 0xD3 | 外部事件开关状态应答 |
| 212 / 0xD4 | 外部事件开关设置应答 |
| 216 / 0xD8 | 液相泵开关应答 |
| 217 / 0xD9 | 液相泵状态查询应答 |
| 218 / 0xDA | 液相泵控制状态设置应答 |
| 224 / 0xE0 | 进样器型号查询应答 |
| 225 / 0xE1 | 进样器型号设置应答 |
| 226 / 0xE2 | 进样器参数查询应答 |
| 227 / 0xE3 | 进样器参数设置应答 |
| 228 / 0xE4 | 外部事件表1查询应答 |
| 229 / 0xE5 | 外部事件表1设置应答 |
| 232 / 0xE8 | 复位多位阀返回 |
| 234 / 0xEA | 控温保护参数查询应答 |
| 236 / 0xEC | 控温保护参数设置应答 |
| 238 / 0xEE | 多位阀使能查询应答 |
| 239 / 0xEF | 多位阀使能设置应答 |
| 245 / 0xF5 | 到采集时间请求停止（旧版自动） |
| 249 / 0xF9 | 点火门限设置 |
| 250 / 0xFA | 点火门限查询应答 |
| 251 / 0xFB | 主板异常报警码 |
| 252 / 0xFC | 高压设置 |
| 253 / 0xFD | 高压查询/应答 |

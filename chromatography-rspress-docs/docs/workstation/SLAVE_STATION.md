# 从站（Modbus Server / 502、503）当前实现的数据传输说明

本文件聚焦“从站”实现：工作站作为 Modbus/TCP 风格的服务器监听 `502/503`，外部系统（PLC/DCS/上位系统）作为客户端发起读取/写入请求；工作站将仪器状态与分析结果以固定映射返回，并将外部写入转换为对主站（25001）连接的仪器下发控制命令。

注意：代码中 `502/503` 的协议形态并不是标准 MBAP 头的 Modbus/TCP（更像“简化/自定义 Modbus 报文头 + 功能码”）。本文按“实际代码实现”描述。

新跨平台边缘节点将改为**标准 Modbus/TCP**（MBAP 头 + 标准功能码），寄存器映射见 [docs/MODBUS_STANDARD_MAP.md](file:///d:/GIT/VS2022/Chromatography-workstation/docs/MODBUS_STANDARD_MAP.md)。

---

## 1. 从站入口与通信通道

从站端口与对象：见 [AsyncTcpServerMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServerMgr.cs#L23-L29)

- `modus0Port = 502`
- `modus1Port = 503`
- 对应服务器对象：`modus0TcpServer`、`modus1TcpServer`（`ServerType=ModBusServer`）

启动位置：主窗体加载时调用 `StartTcpServer()`（见 [FormMain_Load](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L730-L807)）。

接收处理：

- `OnTcpServer1ReceiveData / OnTcpServer2ReceiveData` 会把收到的数据按 **12 字节**分帧（`len % 12 == 0`），每帧调用 `method_5(frame, e, type)` 做解析与回应（见 [FormMain.cs:L911-L929](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L911-L929)）。

仪器选择（多台仪器支持）：

- 每个主站连接的仪器对应一个 `TcpServerSocket`。
- 从站请求中携带 `MID`（在 `frame[6]`），通过 `cdlMgr.tcpServerMgr.mainTcpServer.GetOneInstrumByMID(MID)` 找到对应仪器会话（见 [AsyncTcpServer.GetOneInstrumByMID](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L738-L749)、[FormMain.method_5](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L939-L960)）。
- `MID` 来源：主站侧收到设备 ID 后，会通过 `FrmEquip.GetModBusDeviceIDByEquipID(string_0)` 计算并写入 `TcpServerSocket.DID`（见 [TcpServerSocket.AnalyseReceivedData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L595-L599)）。

---

## 2. 从站请求帧格式（按实现）

从站解析逻辑使用固定 12 字节请求：

- `MID = frame[6]`
- `Func = frame[7]`
- `Addr = frame[8] * 255 + frame[9]`
- `Count = frame[10] * 255 + frame[11]`

对应代码见 [FormMain.method_5](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L939-L953)。

说明：`*255` 不是常见大端计算（通常应为 `*256`），但这是当前实现的“真实行为”。若外部设备按 `*256` 发送，这里会出现寻址偏差。

---

## 3. 已实现的功能码与数据传输内容

`method_5` 目前实现了 3 类功能码：`1`、`3`、`85`。

### 3.1 功能码 `1`：读取单个状态位（类似 Read Coils / Discrete Inputs）

约束：

- 仅支持 `Count==1`，否则返回异常（`ModBusEquipError05(..., 3)`）。
- 仅支持 `Addr` 在 `10000..10008`，否则返回异常（`ModBusEquipError05(..., 1)`）。

状态位映射（请求 Addr → 返回布尔值），见 [FormMain.method_5](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L961-L1000)：

- `10000`：`FormMain.BControlTemp`（控温状态）
- `10001`：`FormMain.AlalyseStatus`（分析/采集中状态）
- `10002`：`oneInstrumByMID.IsChannelSimple(0)`（通道 0 是否处于 simple 采集态）
- `10003`：`oneInstrumByMID.IsChannelSimple(1)`
- `10004`：`oneInstrumByMID.IsChannelSimple(2)`
- `10006`：`FormMain.Bfire1`（点火状态 1）
- `10007`：`FormMain.Bfire2`（点火状态 2）
- `10008`：`(oneInstrumByMID.eventState & 0x02) == 0x02`（事件状态 bit1）

注意：`10005` 在读取映射中不存在（写入映射里存在）。

### 3.2 功能码 `3`：读取“寄存器块数据”（类似 Read Holding Registers）

约束与分通道：

- 仅支持 `Addr` 在 `0..40000`，否则异常 `ModBusEquipError05(..., 4)`。
- 仅支持 `Count <= 1000`，否则异常 `ModBusEquipError05(..., 3)`。
- `Addr` 同时承担“通道选择”的作用（按 10000 为步长分段）：
  - `0..9999`：通道 0
  - `10000..19999`：通道 1
  - `20000..29999`：通道 2
  - `30000..39999`：通道 3
  - 代码见 [FormMain.method_5](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1051-L1079)

返回的数据来源：

- 以选中通道的 `Chromatogram`（`oneInstrumByMID.ModBusbgChrom[channel]`）为主，打包成一个字节数组 `ModBusBytes`。
- 打包函数：`ModBusData.InitBytesVer1(chromatogram)`（见 [ModBusData.InitBytesVer1](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs#L141-L231)）。
- 返回函数：`ModBusData.ModBusValueVer1(request, oneInstrumByMID.ModBusbgChrom)` 会把 `Count*2` 字节从 `ModBusBytes` 的偏移 `Addr` 拷贝到响应 payload（见 [ModBusValueVer1](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs#L286-L337)）。

额外字段：在发送前，代码会把 `FormMain.StateYiqi` 写入 `ModBusBytes[57]`（见 [FormMain.cs:L1080-L1082](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1080-L1082)）。

#### 3.2.1 `ModBusBytes` 当前数据布局（Ver1）

`ModBusBytes` 固定长度为 `10000` 字节（见 [ModBusData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs#L29-L31)），关键字段布局如下（偏移单位为字节）：

- `0..15`：`chromatogram.chromInfo.cclDescription`（设备/通道描述字符串，按 Default 编码，右侧填空格）
- `16..31`：状态字符串（当前写死为 `"开机正常等待空闲"`）
- `32..43`：采集时间 `yyMMddHHmmss`
- `44..45`：检测器标识 `ushort detMark`（高字节在前）
- `48..49`：进样次数 `ushort injNo`
- `50..51`：峰数 `ushort peakCount`
- `52..55`：`float whlHheatVaue`（4 字节）
- `56..59`：`float whlLheatVaue`（4 字节；但 `byte[57]` 被额外覆写为 `StateYiqi`）

峰表（最多 20 个峰，超过会被截断到 20）：

- 第 `i` 个峰记录基址：`(i + 2) * 100`
  - `+0..+31`：组分名（32 字节，Default 编码，右侧填空格）
  - `+32..+35`：`float pkRT`
  - `+36..+39`：`float height`
  - `+40..+43`：`float area`
  - `+44..+47`：`float areaPer * 100`
  - `+48..+51`：`float heightPer * 100`
  - `+52..+55`：`float amount`
  - `+56..+59`：`float amountPer * 100`

实现见 [ModBusData.InitBytesVer1](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs#L141-L231)。

### 3.3 功能码 `85`：写入控制位（非标准功能码，代码自定义）

这是当前“从外部系统控制仪器”的主要入口。

约束：

- 仅支持 `Count==1`，否则异常 `ModBusEquipError85(..., 1)`。
- 仅支持 `Addr` 在 `10000..10007`，否则异常 `ModBusEquipError85(..., 4)`。

写入值判定：

- 当 `frame[10] == 0xFF` 认为是“置位/启动”，否则认为是“复位/停止”。（见 [FormMain.cs:L1094-L1161](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1094-L1161)）

地址到动作映射（写入 → 转换为主站下行命令）：

- `10000`：控温 开/关 → `SendCmd(16)` / `SendCmd(17)`
- `10001`：全样品分析 开/关 → `SendCmd(18)` / `SendCmd(19)`
- `10002`：通道 0 分析 开/关 → `SendCmd(22, 0)` / `SendCmd(23, 0)`
- `10003`：通道 1 分析 开/关 → `SendCmd(22, 1)` / `SendCmd(23, 1)`
- `10004`：通道 2 分析 开/关 → `SendCmd(22, 2)` / `SendCmd(23, 2)`
- `10005`：通道 3 分析 开/关 → `SendCmd(22, 3)` / `SendCmd(23, 3)`
- `10006`：点火/动作 → 置位时 `SendCmd(20)`（复位时无动作）
- `10007`：点火/动作 → 置位时 `SendCmd(20)`（复位时无动作；当前实现与 10006 相同）

成功时响应：直接回传原始 12 字节请求帧（echo）。

---

## 4. 当前从站“传了什么数据”（总结视图）

从站接口目前对外暴露的数据，分三类：

1. **布尔状态位（功能码 1，地址 10000..10008）**
   - 控温/分析/各通道是否采集中、点火状态、事件状态 bit
2. **分析结果块数据（功能码 3，地址 0..40000）**
   - 按通道分段读取，每次最多取 `1000` 个“寄存器”对应的 `2000` 字节
   - 返回内容本质是结构化的 `ModBusBytes`：设备描述、时间、检测器标识、进样次数、峰数、两路炉温/加热值、以及最多 20 个峰的 RT/峰高/面积/百分比/含量/含量百分比
3. **控制命令（功能码 85，地址 10000..10007）**
   - 外部系统通过写位触发工作站向仪器下发“控温/分析开始停止/点火”等动作

---

## 5. 相关实现文件索引

- 从站服务器（502/503 连接建立、收发事件）：[AsyncTcpServer](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs)
- 从站请求解析与动作映射：`FormMain.method_5`（[FormMain.cs:L933-L1173](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L933-L1173)）
- 从站返回数据打包（峰表/元信息）：[ModBusData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs)
- 仪器会话选择（MID→TcpServerSocket）：[AsyncTcpServer.GetOneInstrumByMID](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L738-L749)
- 主站命令下发（从站写入最终落点）：[TcpServerSocket.SendCmd](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3254-L3321)

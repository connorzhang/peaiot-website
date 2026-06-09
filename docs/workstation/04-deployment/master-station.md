# 主站（Main Server / 25001）功能与协议说明

本文件聚焦“主站”相关逻辑：工作站作为 TCP 服务器监听 `25001`，仪器/硬件主板作为客户端连接；主站负责接收硬件上报数据、解析协议帧、驱动采集/控制流程，并向硬件下发控制命令。

说明范围：仅覆盖 `ServerType=GCSever` 的主站（不是 `502/503` 的 Modbus 端口）。

---

## 1. 关键结论（你后面改功能最常用）

- 主站监听端口：`25001`（见 [AsyncTcpServerMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServerMgr.cs#L23-L29)）
- 主站服务器实现：`AsyncTcpServer`（`ServerType=GCSever`）
  - 连接建立后创建/复用 `TcpServerSocket`
  - 收包后仅对主站执行：`TcpServerSocket.OneDataReceive(...)`（见 [AsyncTcpServer.EndAsyncReceiveData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L498-L516)）
- 主站协议帧头固定为：ASCII `"GCKC"`
- 主站帧结构（工作站收/发一致）：`GCKC + Len(2) + Body(Len) + CRC(1)`
- 主站“会话对象”是 `TcpServerSocket`：
  - 收到帧后按 `byte[24]` 作为“命令号”分发（见 [TcpServerSocket.AnalyseReceivedData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L547-L1058)）
  - UI 下发控制命令统一走 `TcpServerSocket.SendCmd(...)`，命令参数由 `SendCmd_Convert(...)` 从界面/配置组装（见 [TcpServerSocket.SendCmd](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3254-L3321)、[SendCmd_Convert](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2409-L2648)）
- 主站除了 TCP，也支持“串口直连主板”模式：`sysParam.bComEnable==true` 时调用 `mainTcpServer.AddComClient()`，生成 `IsComClient=true` 的 `TcpServerSocket`，下行走串口发送（见 [FormMain.StartTcpServer](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1941-L1960)、[AsyncTcpServer.AddComClient](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L235-L253)、[TcpServerSocket.SendData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3231-L3251)）。

---

## 2. 体系结构与生命周期

### 2.1 “工作站当服务器，仪器当客户端”的网络模型

界面中明确写了该部署方式：工作站作为服务器，仪器作为客户，需要路由器端口转发 `25001/TCP`（见 [DlgIP](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/DlgIP.cs#L36-L37)）。

### 2.2 主站启动与事件回调

主站由主窗体启动（同时也会启动 502/503 的 Modbus 端口）：

- 入口：[FormMain.StartTcpServer](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1941-L1966)
- 创建服务器对象：`cdlMgr.NewTcpServerMgr(this)`（见 [ChromDeviceListMgr.NewTcpServerMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs#L364-L381)）
- 绑定回调并启动监听：
  - `mainTcpServer.OnReceiveData += OnTcpServer0ReceiveData`
  - `mainTcpServer.OnClientDisconnected += OnTcpServer0DisConnect`
  - `mainTcpServer.Start()`
- UI 刷新：`OnTcpServer0ReceiveData` 最终调用 `UpdateChromDevice(e)`，将设备显示为“在线/当前/离线”等图标状态（见 [FormMain.OnTcpServer0ReceiveData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L2058-L2067)、[ChromDeviceCtrl.UpdateChromDevice](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs#L344-L379)）。

### 2.3 连接复用、断线与看门狗

主站连接策略：

- 按 `ClientIP` 判断是否“已存在同 IP 连接”，如果存在则复用老 `TcpServerSocket` 并 `refreshSocket()`（见 [AsyncTcpServer.BeginAsyncReceiveData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L377-L402)、[TcpServerSocket.refreshSocket](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L310-L313)）。
- 按设备 ID 去重：`CheckHasDoubleConnect` 会把同 ID 的重复连接踢掉并迁移 socket（见 [AsyncTcpServer.CheckHasDoubleConnect](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L635-L666)）。
- 超时连接清理：`CheckConnectList()` 若 10 秒无数据会触发断开事件（见 [AsyncTcpServer.CheckConnectList](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L668-L688)；FormMain 有定时调用痕迹见 [FormMain.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L906)）。
- 自动重启监听：当连接断开且 `bAllowAutoRestartListenerWhenCloseSocket==true` 且有效连接数较少，会 Ping 最近的 `LastServerIP`，成功则 Stop/Init/Start 重启监听（见 [AsyncTcpServer.EndAsyncReceiveData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L551-L575)、[CheckIpAvalibleAndReStartListener](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/AsyncTcpServer.cs#L578-L604)）。

---

## 3. 主站协议帧格式（非常关键）

### 3.1 帧总结构

发送侧构帧逻辑在 [TcpServerSocket.SendCmd](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3254-L3321)：

1. `Header(4)`：ASCII `GCKC`
2. `Len(2)`：大端 `short`（见 [IBrainConvert.Short2ByteArray](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/IBrainConvert.cs#L151-L166)）
3. `Body(Len)`：
   - `DeviceID(16)`：字符串编码并补零到 16 字节（见 [IBrainConvert.String2ByteArray](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/IBrainConvert.cs#L129-L143)）
   - `Seq(2)`：序列号 `short_0++`
   - `Cmd(1)`：命令号（下文会列举）
   - `Payload(N)`：视命令不同
4. `CRC(1)`：对 `Body` 做 `BitByBitNo` 校验（查表式 CRC/校验，见 [IBrainConvert.BitByBitNo](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/IBrainConvert.cs#L251-L260)）

接收侧解包逻辑在 [TcpServerSocket.OneDataReceive](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L478-L545)：

- 帧头扫描：寻找 `GCKC`
- 帧长计算：`Len = byte[4]*256 + byte[5]`，整帧长度 = `Len + 7`（4+2+Len+1）
- CRC 校验：对整帧从偏移 `6`（Body 开始）计算 `BitByBitNo`，与最后 1 字节比较
- 通过后进入 `AnalyseReceivedData(frame)`

### 3.2 会话 ID（设备编号）与特殊占位值

`AnalyseReceivedData` 首先读取 `DeviceID = Encoding.ASCII.GetString(frame, 6, 16)`：

- 若 `frame[6]==0` 或 `DeviceID.Trim()==""`，直接忽略（认为无效）
- `TcpServerSocket.ID` 使用 `string_0` 保存“当前会话设备 ID”（见 [TcpServerSocket.ID](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L280-L289)）
- 特殊占位 ID：`709131284A484845` 会被替换成 `string_0`（见 [TcpServerSocket.AnalyseReceivedData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L564-L567)；UI 层也有相同处理见 [FormMain.UpdateChromDevice](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L2113-L2120)）。

---

## 4. 主站接收侧：命令号分发与功能覆盖

主站所有上行数据（硬件→工作站）最终在 [TcpServerSocket.AnalyseReceivedData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L547-L1058) 中分发。

核心点：`Cmd = frame[24]`。

下面将命令按功能域归类（这部分就是你后续改控制/协议时的“索引”）。

### 4.1 主动上报（硬件主动推送）

- `143`：色谱仪主动送出数据（温度/检测器/信号点等），会进入 `AnalyseReceivedData_ChromSend(...)` 做解析并驱动 UI/采集曲线（见 [TcpServerSocket.cs:L1009-L1054](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1009-L1054)、[AnalyseReceivedData_ChromSend](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1060-L1178)）。
- `159`：EPC 数据（代码中调用 `Answer159`，在同方法内处理）。
- `175`：色谱仪主动送出自动进样器数据（连接状态/工作状态/瓶位/针次），并更新 `devManager1.inject*` 字段（见 [TcpServerSocket.cs:L1033-L1046](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1033-L1046)）。
- `251`：色谱仪主动发送异常报警码，影响 `FormMain.StateYiqi`、`bError`，并写入 Modbus 寄存器镜像（见 [TcpServerSocket.cs:L624-L655](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L624-L655)）。

### 4.2 控温/程序升温/事件表

- 控温参数查询/设置应答：`128`（查询）、`136`（设置）
- 控温保护参数查询/设置应答：`234`、`236`
- 程序升温查询/设置应答：`129`、`137`（并根据数据长度推断 `TempProgram=8/16`）
- 外部事件表 0：`130`、`138`
- 外部事件表 1：`228`、`229`
- 外部事件开关状态/应答：`211`、`212`

对应处理集中在 [TcpServerSocket.cs:L684-L744](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L684-L744)、[TcpServerSocket.cs:L954-L967](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L954-L967)。

### 4.3 检测器参数

- 检测器参数查询/设置应答：`141`、`142`（见 [TcpServerSocket.cs:L770-L776](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L770-L776)）

### 4.4 分析流程（开始/停止、通道级）

- 开始控温应答：`144`（置 `ControlTemp=true`）
- 关闭控温应答：`145`（置 `ControlTemp=false`）
- 启动全部样品分析应答：`146`（开启 `bAutoCycle1/2`，清空 channelReady 状态，触发 `Answer146`）
- 停止全部样品分析应答：`147`（关闭 auto cycle，触发 `Answer147`）
- 启动指定通道分析应答：`150`（按 payload[0] 区分通道 0/1/其它，设置 `bStart1/bStart2`、倒计时等）
- 指定通道分析停止应答：`151`

对应处理见 [TcpServerSocket.cs:L777-L863](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L777-L863)。

### 4.5 EPC/气路/网络参数

- 气路配置应答：`163`
- EPC 模块工作参数应答：`164`/`165`
- EPC 名称应答：`166`/`167`
- EPC 气体种类应答：`168`/`169`
- 网络参数应答：`176`/`177`

对应处理见 [TcpServerSocket.cs:L864-L900](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L864-L900)。

### 4.6 点火门限/高压等专项参数（非 GC08 基础表中的扩展命令）

- 点火门限查询应答：`250`（读取 `frame[25]/frame[26]`，除以 10，写到 `ChromDeviceCtrl.tbFireOn/tbFireOn2`）见 [TcpServerSocket.cs:L610-L623](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L610-L623)
- 点火门限设置：`249`（由 UI 文本框组装 2 字节 payload，下发）见 [SendCmd_Convert case 249](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2585-L2643) 与 [ChromDeviceCtrl.BtnFireOnSet](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs#L437-L445)
- 高压设定值查询应答：`253`（读取 `frame[25..26]` 作为 `FPDhighV`，回写到 `MicrFPDCtrl/FIDSet` UI）见 [TcpServerSocket.cs:L656-L683](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L656-L683)
- 高压设定：`252`（payload = 高压值(2字节) + 高压通道索引 `indexFPDHIGHV`）见 [SendCmd_Convert case 252](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2612-L2643)

---

## 5. 主站下行：命令生成与 UI 入口

主站“控制硬件主板”的下行命令主要通过 `TcpServerSocket.SendCmd(...)` 发出。命令 payload 的生成集中在 `SendCmd_Convert(byte cmd)`。

### 5.1 构帧与发送

下行流程：

1. `SendCmd(cmd)` 调用 `SendCmd_Convert(cmd)` 获取 payload
2. 组装 Body：`DeviceID(16) + Seq(2) + Cmd(1) + Payload`
3. 计算 CRC 并发送

见 [TcpServerSocket.SendCmd](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3254-L3321)。

### 5.2 “通道相关命令”的两种发送方式

`SendCmd` 有两个入口：

- `SendCmd(22)` / `SendCmd(23)`：默认使用 `mForm.CurrentChannelIndex` 作为通道号（见 [SendCmd_Convert](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2479-L2486)）。
  - UI 例子：采集面板开始/停止使用此方式（见 [ChromAcqCtrl.toolStripButton1_Click](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromAcqCtrl.cs#L662-L681)）。
- `SendCmd(22, channelMask)` / `SendCmd(23, channelMask)`：显式指定通道（通过 `method_15` 写入 `sglNumberStart/sglNumberEnd`）
  - 见 [TcpServerSocket.method_15](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2226-L2241) 与 [TcpServerSocket.SendCmd(byte, byte)](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3308-L3321)
  - UI 例子：FormMain 存在按 MID/通道显式启动/停止的逻辑（见 [FormMain.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L1093-L1147)）。

### 5.3 常用下行命令与 UI 入口示例

以下是主站最核心、最常改的命令入口（建议你改功能时从这些 UI 事件逆向）：

- 启动/停止分析（单通道）：`22` / `23`
  - UI：采集工具条 Start/Stop（[ChromAcqCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromAcqCtrl.cs#L662-L681)）
- 启动/停止全部样品分析：`18` / `19`
  - UI：在线/设备控制面板中多处调用（可从 `OnlineCtrl` / `MicrFPDCtrl` / `InsDeviceCtrl` 中的 `SendCmd(18/19)` 追踪）
- 开始/关闭控温：`16` / `17`
  - UI：`InsDeviceCtrl` 与 `FormMain` 中均有调用（见 `SendCmd(16/17)` 搜索结果）
- 温控参数设置：`8`（payload 由 UI 写入 `devManager` 生成）
- 程序升温参数设置：`9`
- 外部事件参数设置：`10` / `101`
- 设置自动进样时间：`12`（见 [SendCmd_12](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2287-L2303)）
- 设置时钟：`11`（见 [SendCmd_11](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2271-L2285)）
- EPC 工作参数设置：`37`（见 [SendCmd_37](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L2315-L2328)）
- 点火门限查询/设置：`250` / `249`
  - UI：见 [ChromDeviceCtrl.BtnFireOnCheck](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs#L419-L428)、[ChromDeviceCtrl.BtnFireOnSet](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs#L437-L445)
- 高压设置/查询：`252` / `253`（UI 入口在 `MicrFPDCtrl` / `FIDSet`）

### 5.4 命令字典（代码内已有一份）

仓库内存在一份“命令号→语义”的表，位于 [GC08_GCs.lsItems](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/GC08_GCs.cs#L78-L155)。

虽然主站当前实现主要在 `TcpServerSocket`，但这份表对理解命令语义很有帮助（包括查询命令 `0/1/2...` 与应答 `128/129/130...`）。

---

## 6. 修改建议（你要改“主站控制主板”时怎么下手）

### 6.1 要改协议字段/命令号

- 收包入口：`TcpServerSocket.OneDataReceive`（帧头/长度/CRC）
- 分发入口：`TcpServerSocket.AnalyseReceivedData`（`cmd=frame[24]`）
- 下行入口：`TcpServerSocket.SendCmd` + `SendCmd_Convert`

### 6.2 要改“命令触发点”（UI 按钮/自动流程）

- 采集启动/停止：从 [ChromAcqCtrl.toolStripButton1_Click](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromAcqCtrl.cs#L662-L681) 反查
- 温控相关：从 `InsDeviceCtrl` 中的 `SendCmd(8/9/16/17/66/67/192/193/194/195...)` 入口反查
- 点火门限/高压：从 [ChromDeviceCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs#L419-L445) 与 `MicrFPDCtrl/FIDSet` 入口反查

### 6.3 注意点（容易踩坑）

- `TcpServerSocket` 对 UI 使用大量静态引用（例如 `ChromDeviceCtrl.selfCtrl`），改解析逻辑时要考虑 UI 线程与空引用保护。
- `DeviceID` 有占位值 `709131284A484845` 的特殊兼容逻辑，若你改 ID 策略需同步处理。
- 主站既支持 TCP 也支持串口桥接（`IsComClient`），同一命令在两种通道上都可能出现。


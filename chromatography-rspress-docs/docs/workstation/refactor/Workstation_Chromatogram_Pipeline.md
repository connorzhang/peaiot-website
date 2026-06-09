# 旧版工作站（WinForms）色谱采集与出数链路梳理（供重构参考）

本文基于仓库现有 WinForms 代码（`IBrainChrom2018`）梳理：
- 主板（GC 主控/检测器）与工作站各自承担的职责
- TCP 主协议上行/下行的关键命令与数据内容
- 工作站侧“谱图分析”（检峰/积分/定量）触发点与调用链
- 结果对外发布（Modbus）数据来源

## 1. 结论（先说清楚）

1) **谱图方法相关的检峰/积分/定量出数在工作站完成，不在主板完成。**
- 主板上送：实时点数据 + 状态/参数（主要命令 `Cmd=143`）。
- 工作站本地：保存/打开谱图时，调用算法 `Chromatogram.Process(InstruStyle.GC)` 生成峰表与定量结果。

2) **工作站会把“已算好的峰表/结果”打包成 Modbus 数据对外发布。**
- Modbus 的峰表来自 `Chromatogram.RltPeaks`（工作站计算结果），不是主板上送的峰表。

## 2. 角色边界（主板 vs 工作站）

### 2.1 主板（设备侧）
- 采集检测器信号并周期性上报采样点。
- 上报设备状态（温控/阀/流量/报警等）。
- 接收工作站下发的控制命令（开始/停止、温控开关等）。
- **不承担**：方法积分、检峰、定量、报表计算。

### 2.2 工作站（PC WinForms）
- 维护与主板的 TCP 连接、解包与分发。
- 实时显示曲线（来自主板的点流）。
- 在“分析结束/保存谱图”时，将采集点 + 方法参数组装为 `Chromatogram`，调用 `Chromatogram.Process(...)`：
  - 检峰/积分（基线、面积、峰高、保留时间、宽度等）
  - 定量（含量、校准计算、性能指标等）
- 保存谱图文件（`.sda`）并可打开显示。
- 将 `Chromatogram.RltPeaks` 等结果打包到 Modbus 内存区供外部读取。

## 3. TCP 主协议（GCKC）与关键命令

### 3.1 外层帧格式（工作站已复刻到 Go）
- Header：`"GCKC"`
- BodyLen：2 字节（大端）
- Body：
  - `DeviceId`：16 字节 ASCII（不足补 0）
  - `Seq`：2 字节（大端）
  - `Cmd`：1 字节
  - `Payload`：变长
- CRC：1 字节（表驱动 CRC，Win 版对应 `IBrainConvert.BitByBitNo`）

### 3.2 `Cmd=143`：色谱仪主动送出数据（核心上行）
- 工作站解析入口：`TcpServerSocket.AnalyseReceivedData` → `AnalyseReceivedData_ChromSend(...)`
  - 参考：[TcpServerSocket.cs:L1009-L1177](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L1009-L1177)
- Payload 的结构在 Win 版分两段解析：
  1) 前 12 字节：6 个压缩数值（2 字节/个），用于辅助参数（Win 版用 `IBrainConvert.ByteArray2Float(..., 1)` 解）
  2) 后续：状态/控制位字节 + 检测器段（数量在 payload[18]）

检测器段解析在 Win 版由 `DetectorParse.ParseData(...)` 完成：
- 每个检测器：`detType/polarity/range/freqByte` + `freqByte*10` 个采样点
- 采样点为 4 字节 BCD（高位包含负号标记），并按 `detType` 做换算/衰减系数
  - 参考：[DetectorParse.cs:L46-L170](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/DetectorParse.cs#L46-L170)

## 4. 工作站侧“谱图分析出数”的触发点与调用链

### 4.1 分析触发点：`TcpServerSocket.Save(...)`
当工作站决定“本次通道分析结束，需要生成新谱图文件”时，会调用：

- `TcpServerSocket.Save(Signal OneChannelData, string SaveFilePath, ChartParaOpera Cpara, int ChannelIndex, string Name)`
  - 参考：[TcpServerSocket.cs:L3696-L3865](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L3696-L3865)

在该函数里发生的关键动作：
1) 读取 UI/设备管理器当前设置，补齐方法/温控/采样率等到 `mtdMgr.chromInfoR`。
2) 构造 `Chromatogram`，并把显示窗口参数（满屏时间、Y 上下限）写入 `chromatogram.disLg`：
   - `disLg.lgXBeg = 0f`（X 轴从分析开始时间为 0）
   - `disLg.lgX = fullScreenTime`（满屏时间决定显示窗口宽度）
   - `disLg.lgYBeg/showLowLimit`、`disLg.lgY = showHighLimit-showLowLimit`
3) 将采集点数据挂到 `chromatogram.signal = OneChannelData`。
4) **调用核心分析：`chromatogram.Process(InstruStyle.GC);`**
5) 保存 `.sda`：`chromatogram.SaveToFileOld(SaveFilePath)`。
6) 如设置 `StopAutoAlalyse`，会自动打开谱图窗口：`ChromForm.form.OpenChrom(...)`。

### 4.2 核心分析入口：`Chromatogram.Process(InstruStyle.GC)`
在 `Chromatogram.Process(...)` 内部，关键调用链为：

- `signal.ApplyIntegs(...)`：检峰/积分（基线、面积、峰高、pkRT 等）
- `CalcuResults(...)`：定量/含量等结果计算

参考：
- [Chromatogram.cs:L782-L789](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Chromatogram.cs#L782-L789)

### 4.3 检峰/积分算法（工作站本地）
入口：
- `Signal.ApplyIntegs(...)`：调用 `ApplyIntegs.Apply(...)` 并回填 `peaks`
  - [Signal.cs:L624-L635](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Signal.cs#L624-L635)

算法核心：
- `ApplyIntegs.needProcPeak(...)`：生成基线数组，做 `max(0, y-baseline)` 梯形积分，得到 `area/height/pkRT/width/...`
  - [ApplyIntegs.cs:L2910-L3061](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ApplyIntegs.cs#L2910-L3061)

### 4.4 定量（含量 amount 等）
- `Chromatogram.Process(...)` 内调用 `CalcuResults(...)` 并依赖校准模型（例如 `CaliGnl`）。
  - 校准模型示例：[CaliGnl.cs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnl.cs)

## 5. 结果对外发布（Modbus）数据源

工作站会把 `Chromatogram` 的结果打包成 Modbus 缓冲区：
- `ModBusData.InitBytesVer1(Chromatogram ...)` 从 `Chromatogram.GetPeakAllCompound()` 与 `Chromatogram.RltPeaks` 读取 `pkRT/height/area/amount/...` 生成 `ModBusBytes`。
  - [ModBusData.cs:L75-L163](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ModBusData.cs#L75-L163)

这说明：外部系统读到的“峰表/含量”来自**工作站已算好的结果**。

## 6. 对 Go 重构的直接启示

### 6.1 算法位置
- 若保持旧版一致：应在工作站/边缘节点侧实现 `Chromatogram.Process` 等价链路（检峰/积分/定量）。
- 主板侧只需要保证点流与状态上报正确、控制命令闭环正确。

### 6.2 触发时机
- 旧版是在 `Save(...)` 时触发一次完整分析并落盘。
- 新架构可以等价实现为：
  - “实时显示”与“分析出数”解耦：实时只消费 `Cmd=143`。
  - 在收到“通道结束/分析结束”条件（命令或时间）时，冻结本次点序列并跑一次 `Process`，产出结果/峰表。

### 6.3 显示窗口
- 旧版 X 轴起点固定为 0（从开始分析时间算起）。
- `fullScreenTime` 决定显示窗口宽度（可等于 stopTime，也可小于 stopTime 用于滚动窗口）。
  - 在 Win 版保存时：`disLg.lgXBeg=0`、`disLg.lgX=fullScreenTime`。


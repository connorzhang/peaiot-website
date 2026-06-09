# 功能分析报告：Chromatography-workstation（IBrainChrom）

本报告基于仓库代码静态分析与可编译验证结果整理，目的是帮助后续二次开发时快速定位“功能入口 → 调用链 → 数据落点”。

## 1. 系统定位与总体能力

该程序为 Windows 桌面 WinForms 工作站，面向色谱仪/相关外设的：

- 设备接入与监控（多台设备、多通道）
- 数据采集（串口或 TCP 接入，含 Modbus 相关）
- 谱图显示、积分与结果计算
- 校准（通用校准/专项校准）、方法管理
- 报表预览/打印/导出（DevExpress 报表 + NPOI Excel）
- 历史数据查询（Access/SQLite 双后端）
- GMP/权限/审计追踪（加密狗特性开关 + 登录 + 操作日志/审计文件）

工程信息：

- 解决方案：[IBrainChrom.sln](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom.sln)
- 主项目：[IBrainChrom.csproj](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom.csproj)
- 目标框架：`.NET Framework 4.8`，WinForms

## 2. 运行入口与全局初始化

唯一入口为 [Program.Main](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Program.cs#L51-L85)：

- 单实例互斥：检测已运行实例并前置显示
- 初始化日志：[LogMgr.Create()](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/LogMgr.cs)
- 初始化语言与系统参数：[CtrlLangPS.Create()](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CtrlLangPS.cs)，[SystemParam.Create()](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/SystemParam.cs#L169-L186)
- 初始化词典与检测器参数：`SystemDictionaryList.Create()`、`DetectorParam.Create()`
- GMP 授权开关：若 [DogFeturlMgr.LicencedGMP()](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/DogFeturlMgr.cs#L71-L74) 通过，则弹出登录 [Logon](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Logon.cs)
- 进入主窗体：`Application.Run(new FormMain())`

此外，程序依赖一个本地 DLL（名为 `System.Linq.dll`，并非 .NET 自带 System.Linq）用于公式/拟合等计算：见 [Program.cs:L24-L44](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Program.cs#L24-L44)。

## 3. UI 结构与功能入口（按功能域）

### 3.1 主窗体（实际入口）

主窗体为 [FormMain](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs)。该窗体采用“单窗体 + 多个嵌入式 UserControl”方式聚合核心功能：

- 采集：`ChromAcqCtrl`（[ChromAcqCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromAcqCtrl.cs)）
- 设备：`ChromDeviceCtrl`（[ChromDeviceCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs)）
- 仪器控制/控温/气路/EPC 等：`InsDeviceCtrl`（[InsDeviceCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/InsDeviceCtrl.cs)）
- 方法/组分/时间程序/文件命名等：`MstSet`（[MstSet](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/MstSet.cs)）

主窗体菜单入口集中在 [FormMain.cs:L2793-L2904](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormMain.cs#L2793-L2904)，典型入口包括：

- 文件 → 谱图处理：打开 [ChromForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromForm.cs)
- 文件 → 编辑组份表：打开 [CaliGnlForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnlForm.cs)
- 系统 → 选项：打开 [FrmMsetup](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmMsetup.cs)
- 系统 → 时间程序：打开 [FrmDisposePara](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmDisposePara.cs)
- 检查 → 检查跟踪：打开 [FrmOperLog](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmOperLog.cs)
- 检查 → 权限管理：打开 [frmRightsManager](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/frmRightsManager.cs)

### 3.2 多窗口工作站框架（并存但非默认入口）

仓库还存在典型“工作站多窗口”体系：

- 窗体基类：[LclGnlForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/LclGnlForm.cs)
- 导航/总览：[InstrumentForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/InstrumentForm.cs)
- 窗口菜单（Instrument/DataAcq/Chromatogram/CaliGnl 等）在 [LclGnlForm.cs:L223-L246](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/LclGnlForm.cs#L223-L246)

在二次开发时需要注意：有些功能既有 FormMain 体系，也有 LclGnlForm 体系（例如采集、谱图、校准、设备监视），要明确你修改的是哪条 UI 线。

### 3.3 功能域清单（可见功能）

以下为用户可感知功能域与主要实现文件（非穷举，但覆盖核心能力）：

- 采集：
  - 控件：[ChromAcqCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromAcqCtrl.cs)
  - 窗体：[DataAcqForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/DataAcqForm.cs)
  - 在线/便携界面：[FormOnline](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormOnline.cs)
- 设备与仪器控制：
  - 控件：[ChromDeviceCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceCtrl.cs)、[InsDeviceCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/InsDeviceCtrl.cs)
  - 设备管理：[FrmChromatManager](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmChromatManager.cs)
  - 设备监视：[DevMonitorForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/DevMonitorForm.cs)
- 谱图处理/分析：
  - 主窗体：[ChromForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromForm.cs)
  - 主控件：[ChromFormCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromFormCtrl.cs)
  - 文件搜索/结果表格控件：[ChromFormFileSearchCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromFormFileSearchCtrl.cs)、[ChromFormDataGrid](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromFormDataGrid.cs)
- 方法管理：
  - 面板：[MstSet](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/MstSet.cs)
  - 对话框：[MtdSetupDlg](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/MtdSetupDlg.cs)
- 校准：
  - 通用校准：[CaliGnlForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnlForm.cs)、[CaliGnlUserCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnlUserCtrl.cs)
  - GPC 校准：[CaliGpcForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGpcForm.cs)
  - 自动/专项校准：[FormAUTOCalibra](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormAUTOCalibra.cs)、[FormLYTHCCalibra](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormLYTHCCalibra.cs)
- 报表与导出：
  - 预览壳：[ReportPreviewForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.ReportMgr/ReportPreviewForm.cs)
  - 报表模板：[IBrainChrom2018.Report](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Report/)
  - Excel 导出：[ExportReport](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ExportReport.cs)
- 历史查询：
  - 历史窗体：[FormHistory](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormHistory.cs)、[FormHistoryData](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FormHistoryData.cs)
- 权限/审计/GMP：
  - 登录：[Logon](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Logon.cs)
  - 权限管理：[frmRightsManager](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/frmRightsManager.cs)
  - 操作日志：[FrmOperLog](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmOperLog.cs)
  - 审计追踪文件：[StationAdtTrlForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/StationAdtTrlForm.cs)

## 4. 核心数据结构（后续修改最常用的“对象图”）

程序的核心对象链路可概括为：

`ChromDeviceListMgr` → `ChromDevice` → `MisMgr` → `ChannelChartPara / ChartParaOpera` → `MtdSetup / Integration / componentList / timeProgram` → `Signal / Chromatogram`

### 4.1 设备列表与当前设备

- 设备列表管理器：[ChromDeviceListMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs)
  - 当前设备 ID：`CurrentGCID`
  - 当前通道：`CurrentChannelIdx`
  - 当前设备对象：`CurrentChromDevice`
  - 当前通讯会话：`CurrentTcpServerSocket`（从 `AsyncTcpServerMgr` 取）
  - 启停通讯：`NewTcpServerMgr(...)` / `StopTcpServerMgr()`：[ChromDeviceListMgr.cs:L364-L394](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs#L364-L394)

- 设备实体：[ChromDevice](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDevice.cs)
  - `info`：设备标识/名称等
  - `misMgr`：该设备的“仪器设置/通道设置/方法设置”集合

- 仪器设置聚合：[MisMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.ChromFile/MisMgr.cs)
  - `devManager`：外设管理器（阀、控温、EPC 等）
  - `ChannelChartParaS`：通道显示/采集行为参数
  - `ChartParaOperaS`：通道方法/积分/时间程序/组分表等参数

### 4.2 通道显示/采集行为参数

通道级“采集/显示行为”在 [ChannelChartPara](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChannelChartPara.cs) 中：

- 量程与显示：`showLowLimit/showHighLimit`、`fullScreenTime/stopTime`
- 自动动作：`analysisWhenStop`（停止时自动分析）、`printWhenStop`（停止时自动打印）
- 信号处理：`bClearZero`（清零）、`bBaselineDeduction`（基线扣除）
- 计算基准：`cnlDetectMethod`、`cnlBasisQuantity`（峰高/峰面积等）

### 4.3 通道方法/积分/时间程序/组分表

通道级“方法参数集合”在 [ChartParaOpera](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChartParaOpera.cs) 中：

- `mtdMgr`：方法管理器 [MtdSetup](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/MtdSetup.cs)
- `Integ`：积分参数 [Integration](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Integration.cs)
- `componentList`：组分列表（用于结果显示/报告等）
- `tProgram/evenPara`：时间程序与事件参数
- 文件命名规则：`FileNameAquipName/FileNameChannelName/FileNameDateTime/FileUserSet/...` 等
- 零点时间：`UseUserZeroTime/ZeroTime/ZeroTimeLeft/ZeroTimeRight`

`ChartParaOpera.LoadMtdFile/LoadCalFile`（见 [ChartParaOpera.cs:L75-L101](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChartParaOpera.cs#L75-L101)）会将方法/校准加载后回写到主 UI 的 `MstSet` 面板。

## 5. 关键业务流程（从 UI 到数据落地）

### 5.1 设备接入、服务器与会话

通信侧以 `AsyncTcpServerMgr` 为中心，创建 3 个监听服务（主站 + 2 个 Modbus 端口），见 [ChromDeviceListMgr.NewTcpServerMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs#L364-L381)。

- 主站端口：`25001`
- Modbus 端口：`502`、`503`

当设备连入后，为每个连接创建一个 `TcpServerSocket` 会话对象：[TcpServerSocket](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs)。

### 5.2 数据帧接收与解析（TCP/串口桥接）

`TcpServerSocket` 支持串口桥接（当 `IsComClient` 为真时，会打开串口并将串口收到的数据走同一解析逻辑）：

- 打开串口：`OpenCom()`（内部使用 [SerialPortClient](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/SerialPortClient.cs)）：见 [TcpServerSocket.cs:L421-L437](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L421-L437)

接收解包核心为 [TcpServerSocket.OneDataReceive](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L478-L545)：

- 帧头：ASCII "GCKC"（字节 71,67,75,67），由 `CheckDataBuffStartFlag` 扫描定位：[TcpServerSocket.cs:L451-L465](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L451-L465)
- 帧长：`byte[4]*256 + byte[5] + 7`
- 校验：`IBrainConvert.BitByBitNo(...)` 计算校验字节，比较末尾校验位：[TcpServerSocket.cs:L510-L523](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L510-L523)
- 通过后进入 `AnalyseReceivedData(...)` 分支处理（含设备 ID/握手、状态更新、点数据、命令响应等）：[TcpServerSocket.cs:L547-L578](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L547-L578)

二次开发时，若要改协议、改字段映射到 UI、增加新命令/新状态，优先从 `AnalyseReceivedData` 以及其调用的各类 `Analyse...` 方法切入。

### 5.3 采集停止后的自动动作（保存/清理/UI 状态）

采集完成后会触发谱图保存与信号清理，见 [TcpServerSocket.cs:L400-L418](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L400-L418)：

- 满足条件时调用 `Save(...)` 写入谱图文件
- `Signal.ResetOriDots(...)`、`Signal.ClearPeak()` 清理内存数据
- 回到 UI 线程更新工具条启停状态（Start enabled、Stop disabled）

### 5.4 谱图文件、导入与处理

谱图文件核心结构与读写集中在 [Chromatogram](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Chromatogram.cs)。

支持的文件类型（代码内判断）：

- `.sda`：工作站自有谱图文件
- `.cdf`：AIA/NetCDF
- `.dat`：N2000 相关

谱图处理 UI 入口为 [ChromForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromForm.cs) / [ChromFormCtrl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromFormCtrl.cs)。积分/峰表/报告输出等会在这里汇聚。

### 5.5 校准与拟合

校准模型为 [CaliGnl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnl.cs)，并提供 `.cal` 文件读写（见 [CaliGnl.cs:L580-L592](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnl.cs#L580-L592)）。

拟合/系数计算在 [CmpdFunc.Calcu_coefs](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CmpdFunc.cs#L376-L460) 中，会调用 `Program.linearFit/linearFitPass`（本地 DLL）得到曲线参数与相关系数。

### 5.6 报表与导出

- DevExpress 报表：位于 [IBrainChrom2018.Report](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Report/) 与预览壳 [ReportPreviewForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.ReportMgr/ReportPreviewForm.cs)
- Excel 导出：使用 NPOI，入口为 [ExportReport](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ExportReport.cs)

## 6. 配置、数据落点与文件格式

### 6.1 全局配置文件（exe.xml）

全局配置由 [ParamBase](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/ParamBase.cs) 以 DataSet 写入 XML：

- 配置路径：`Application.ExecutablePath + ".xml"`（例如 `IBrainChrom.exe.xml`）：见 [ParamBase.cs:L43-L46](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/ParamBase.cs#L43-L46)
- 备份路径：`<exe目录>\BackUp\<exe名>.xml`：见 [ParamBase.cs:L47-L55](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/ParamBase.cs#L47-L55)

系统参数封装在 [SystemParam](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/SystemParam.cs)；常用字段包括：

- 数据库类型：`iDbConnectType`（Access/SQLite 分流）
- 数据目录：`strMtdDataFileDir/strSdaDataFileDir/strCalDataFileDir`
- COM/Modbus：`iComNumber/bComEnable/iComModbusType` 与 `iDcsComNumber` 等
- 报表选项与文件命名选项
- 语言：`Language`（影响 `Class49.sysLanguage_0`）

注意：`SystemParam` 中存在 `strPasswordAdmin/strPasswordGuest/...` 字段（见 [SystemParam.cs:L135-L143](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/SystemParam.cs#L135-L143)），属于明文配置风险点；修改认证策略时建议先梳理其使用点。

### 6.2 设备与通道配置（saq.cfg / default.cfg）

[ChromDeviceListMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs) 启动时会加载：

- 工作配置：`Application.StartupPath + "\\saq.cfg"`
- 默认配置：`Application.StartupPath + "\\default.cfg"`

加载失败则回退默认配置（见 [ChromDeviceListMgr.cs:L417-L433](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChromDeviceListMgr.cs#L417-L433)），保存时写回 `saq.cfg`（`SaveWorkSunFile()`）。

### 6.3 历史/业务数据库（Access + SQLite）

数据库访问底层为 [DBBase](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/DBBase.cs)，并由 [Class49](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Class49.cs) 提供大量“门面”方法（按 `iDbConnectType` 分流）。

- 操作日志表 `OLog` 的典型查询入口：见 [FrmOperLog_Load](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/FrmOperLog.cs#L86-L116)
- 插入操作日志受 GMP 授权控制：`DogFeturlMgr.LicencedGMP()`（见 [Class49.cs:L699-L706](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Class49.cs#L699-L706)）

## 7. 授权、权限与审计

### 7.1 加密狗授权（SuperDog）

授权入口为 [DogFeturlMgr](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Unit/DogFeturlMgr.cs)：

- 使用 `SuperDog` API 查询 feature license 类型（perpetual/trial/expiration）
- 提供 `LicencedGMP/LicencedDetector/...` 等能力开关

### 7.2 登录与权限管理

- 登录窗体：[Logon](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Logon.cs)
- 权限管理：[frmRightsManager](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/frmRightsManager.cs)、[frmOperatorManager](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/frmOperatorManager.cs)

### 7.3 审计追踪

审计文件解析/追加写入集中在 [StationAdtTrlForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/StationAdtTrlForm.cs)。

## 8. 二次开发修改指引（按“你可能要改什么”）

### 8.1 改采集协议/增加新状态字段

- 首选入口：[TcpServerSocket.OneDataReceive](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/TcpServerSocket.cs#L478-L545)（帧头/长度/校验）
- 解析分支：`AnalyseReceivedData(...)` 及其内部处理函数
- UI 显示联动：大量更新会直接写到 `ChromDeviceCtrl.selfCtrl`、`InsDeviceCtrl.self` 等静态引用（例如在 `TcpServerSocket` 内更新文本框/状态灯），需要统一梳理这些“静态 UI 绑定点”。

### 8.2 改“停止自动分析/自动打印/文件命名规则”

- 行为开关在 [ChannelChartPara](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChannelChartPara.cs)
- 文件命名规则与零点时间在 [ChartParaOpera](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ChartParaOpera.cs)
- UI 配置入口多在 [MstSet](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/MstSet.cs) 以及 FormMain 的相关菜单/Tab

### 8.3 改结果计算/校准曲线/拟合算法

- 组分/响应与拟合：从 [CmpdFunc](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CmpdFunc.cs) 与 [CaliGnl](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/CaliGnl.cs) 切入
- 若要替换拟合算法：注意 `Program.linearFit/linearFitPass` 来自本地 DLL，替换需要同步处理该依赖与调用点

### 8.4 改报表模板或输出字段

- DevExpress 报表模板：从 [IBrainChrom2018.Report](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.Report/) 各 `Xr*.cs` 入手
- 报表预览与打印壳： [ReportPreviewForm](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018.ReportMgr/ReportPreviewForm.cs)
- Excel 导出： [ExportReport](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/ExportReport.cs)

### 8.5 改历史查询/数据库结构

- DB 分流逻辑：`SystemParam.iDbConnectType` + [Class49](file:///d:/GIT/VS2022/Chromatography-workstation/IBrainChrom2018/Class49.cs) 门面方法
- 具体 SQL：多在 `DBBase.*SqlLite/*Access` 方法内

## 9. 已知风险点与建议

- 运行时依赖较重：DevExpress、DotNetBar、NPOI、SQLite、SuperDog 等；建议建立“依赖清单+版本锁定+发布脚本”。
- 版本一致性风险：`bin\Debug\net48` 中存在 `DevExpress.*.v18.1` 系列程序集，而工程引用为 `DevExpress v22.2`（见 csproj）。若发生运行期加载冲突，需要统一版本或配置 bindingRedirect。
- UI 静态单例耦合：大量 `*.self` / `*.selfCtrl` 静态引用穿透调用，修改功能时建议先画出“调用者→被调用 UI 控件”的依赖图，避免隐式副作用。
- 配置与密码：系统参数中存在密码字段，配置文件为明文 XML，涉及合规时需评估加密/哈希与权限边界。

---

如你告诉我“你计划优先改的功能模块”（例如：采集协议、报表字段、设备参数、自动校准流程、数据库表结构），我可以在此报告基础上再补一份更聚焦的“调用链追踪版”（到具体按钮事件/方法名级别），并标出改动点与回归验证清单。


# 本次讨论纪要（压缩版）

## 背景

本仓库为 WinForms（`.NET Framework 4.8`）色谱工作站项目。最初问题为 `IBrainChrom.csproj` 无法加载（“根级别上的数据无效，第 1 行，位置 1”）。

## 已完成工作

### 1) 修复项目文件加载

- 定位到 `IBrainChrom.csproj` 文件开头存在重复 UTF-8 BOM，导致 VS/MSBuild 解析失败。
- 已重建 `IBrainChrom.csproj` 去除异常字符，使其可正常解析。

### 2) 上传 GitHub 与文档更新

- 已将代码提交并推送到 GitHub 仓库 `connorzhang/Chromatography-workstation` 的 `main` 分支。
- 更新了 `README.md` / `README.en.md`，新增并补充文档：
  - `docs/DEV_SETUP.md`
  - `docs/CHANGELOG.md`

### 3) 谱图分析核心实现梳理（现有 C# 版本）

**核心数据流**

- 文件加载：`Chromatogram.LoadFromFile` 支持 `.sda/.tab/.cdf/.hw/.dat/.org` 等格式。
- 处理编排：`Chromatogram.Process` → `Signal.ApplyIntegs` → `ApplyIntegs.Apply`。
- 引擎核心：`ApplyIntegs` 负责检峰、基线、积分与积分事件表（`IntegRow`）逐行执行。
- UI 到引擎：`ChromFormCtrl` 将鼠标操作转为 `IntegRow` 追加到 `Integration` 并触发 `Process()` 重算。

**关键实现点（摘要）**

- 点列容器：`Signal`（`dots/svDots/oriDots`）。
- 峰模型：`Peak`（`pkN`、左右边界、`bsYs` 基线数组、`area/height/WO5` 等）。
- 基线与积分：`needProcPeak` 生成基线数组并梯形积分求面积。
- 可选加/减谱图：`Chromatogram.AddOrSubtractChrom`。

### 4) 采集→实时显示→保存→自动分析的链路复盘（现有版本）

- 主窗体启动 TCP Server（25001/502/503）：`FormMain.StartTcpServer`。
- TCP 分片拼接与解析：`TcpServerSocket.OneDataReceive` → `AnalyseReceivedData`。
- 开始/停止采集：cmd 22/23；应答 `Answer150/147` 将通道进入采集态并在停止时保存。
- 实时曲线：协议解析后调用 `Signal.AddDots` 增长点列；`ChromAcqCtrl.timer_0_Tick` 定时刷新绘图。
- 保存与分析：`TcpServerSocket.Save` 构建 `Chromatogram` 并调用 `Chromatogram.Process`，落盘 `.sda`；若启用 StopAutoAlalyse 则自动打开谱图窗体。

## 跨平台重构方向（讨论结论）

### 1) 架构形态

- 采用“边缘节点 + 可云化”的三层解耦：采集服务（TCP）/ 分析内核（Rust/Go）/ UI。
- 边缘节点需要具备：TCP 采集、实时展示、周期落盘、本地基本操作、周期结束自动分析并叠加标注。

### 2) 数据标准

- 采纳 VOCs 谱图 XML 标准作为业务标准格式（包含 `DataTime/TimeSpan/Datas/Pollutants`）。
- 同步生成 JSON 版本以便前端/平台通用使用。
- `Pollutants` 为套峰窗口（按环保因子 code/name），用于 targeted integration。

### 3) 标定/方法与实时分析分离

- Method Editor：离线打开谱图 → 框选污染物套峰 → 保存方法版本。
- Realtime Monitor：选择方法 → 周期结束自动套峰分析 → 标注结果。

### 4) 套峰漂移补偿

- 通过左右扩展 `paddingS` 覆盖小漂移。
- 可选窗口内找峰顶（peakmax）并对齐以增强鲁棒性。

## 下一步文档

- 已新增详细规划文档：`docs/CROSS_PLATFORM_WORKSTATION_PLAN.md`。

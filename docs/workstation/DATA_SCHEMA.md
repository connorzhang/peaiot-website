# 核心数据结构设计 (DATA_SCHEMA)

根据“核心数据结构沿用遗留系统”的架构原则，本篇文档提取自旧版 C# 工作站（`IBrainChrom2018`）的底层结构（如 `MtdSetup`, `Compound`, `Peak` 等），并转换为适用于 Go 后端存储（SQLite / JSON）的模型规范。

## 1. 峰与组分结果 (Peak & Result)

这是单次进样分析后，计算出的最核心的数据结构。

### 1.1 峰对象 (Peak)
对应原版 `Peak.cs`，描述检测到的单个色谱峰。

```go
type Peak struct {
    ID          string  `json:"id" sqlite:"primary_key"`
    RunID       string  `json:"run_id" sqlite:"index"` // 关联的分析批次ID
    Name        string  `json:"name"`                  // 组分名称 (如果识别出)
    RetainTime  float64 `json:"retain_time"`           // 保留时间 (min)
    Area        float64 `json:"area"`                  // 峰面积
    Height      float64 `json:"height"`                // 峰高
    Width       float64 `json:"width"`                 // 峰宽
    StartTime   float64 `json:"start_time"`            // 峰起点时间
    EndTime     float64 `json:"end_time"`              // 峰终点时间
    Amount      float64 `json:"amount"`                // 最终浓度/含量 (如 mg/m3)
    PeakStyle   int     `json:"peak_style"`            // 峰类型 (对应遗留代码的类型枚举，如基线峰、拖尾峰)
}
```

## 2. 分析方法与校准 (Method & Calibration)

对应原版的 `MtdSetup.cs` 和 `CaliGnl.cs`，是进行峰识别和浓度计算的基准。

### 2.1 组分信息 (Compound / CmpdInfo)
定义需要识别的物质及其校准参数。

```go
type Compound struct {
    ID           string  `json:"id" sqlite:"primary_key"`
    MethodID     string  `json:"method_id" sqlite:"index"`
    Name         string  `json:"name"`           // 组分名称 (如 "甲烷", "总烃")
    RetainTime   float64 `json:"retain_time"`    // 标准保留时间
    LeftWindow   float64 `json:"left_window"`    // 左识别窗口 (默认绝对时间)
    RightWindow  float64 `json:"right_window"`   // 右识别窗口
    IsISTD       bool    `json:"is_istd"`        // 是否为内标物
    RespStyle    int     `json:"resp_style"`     // 响应类型 (0: 面积, 1: 峰高)
    CurveFunc    int     `json:"curve_func"`     // 拟合曲线函数 (0: 线性, 1: 多项式等)
    Levels       []Level `json:"levels" sqlite:"-"` // 校准级别集合 (对应原 levels 数组)
}
```

### 2.2 校准级别 (Level)
用于多点标定，描述在某个标气浓度下，期望得到的面积/高度。

```go
type Level struct {
    LevelIndex  int     `json:"level_index"` // 级别编号 (1-20)
    Amount      float64 `json:"amount"`      // 标准浓度 (如 10.0 mg/m3)
    Response    float64 `json:"response"`    // 对应的标准响应值 (面积或峰高)
}
```

### 2.3 积分参数 (Integration)
对应原版 `Integration.cs`，指导内核如何进行基线切割。

```go
type Integration struct {
    MinArea     float64 `json:"min_area"`     // 最小峰面积阈值 (过滤噪声)
    MinHeight   float64 `json:"min_height"`   // 最小峰高阈值
    Slope       float64 `json:"slope"`        // 斜率阈值 (识别峰起点/终点)
}
```

## 3. 硬件控制与系统配置 (SystemConfig & Hardware)

对应原版的 `Instrument.cs` 和底层反控参数。在线监测重构中，这里重点聚焦于温控和气路。

### 3.1 外部事件与多位阀 (Event Table)
在线监测最常用的多位阀切换时间程序。

```go
type EventRow struct {
    Time       float64 `json:"time"`        // 触发时间 (min)
    EventMask  int     `json:"event_mask"`  // 事件掩码 (对应继电器/阀的状态)
}
```

### 3.2 仪器控制参数 (Hardware Config)
保存当前的控温、点火及气路设定值。

```go
type HardwareConfig struct {
    Temperatures map[string]float64 `json:"temperatures"` // key: "Inj1", "Col", "Det1"
    EPCs         map[string]float64 `json:"epcs"`         // key: "Carrier1", "H2", "Air"
    Ignite       bool               `json:"ignite"`       // FID 点火状态
}
```

---
*注：本数据结构严格沿用了旧版软件的核心概念 (如 `RetainTime`, `LeftWindow`, `Levels`, `Integration` 参数等)，并根据 Go 语言和 RESTful API 的惯例转换为驼峰命名与 JSON 标签，以确保内核算法能与老软件逻辑平滑兼容。*
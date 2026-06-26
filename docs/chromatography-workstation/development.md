# 开发指南

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 开发环境

### 1. 安装 Go

**Windows**：
```powershell
choco install golang
```

**Linux/macOS**：
```bash
# 使用官方安装脚本
curl -fsSL https://go.dev/dl/go1.22.0.linux-amd64.tar.gz | sudo tar -C /usr/local -xz
```

### 2. 项目结构

```
Chromatography-workstation/
├── src/
│   └── edge/                    # Go 边缘节点代码
│       ├── cmd/                 # 命令行入口
│       │   └── collector/       # 主程序
│       ├── internal/            # 内部包
│       │   ├── analyzer/        # 积分分析器
│       │   ├── protocol/        # 通信协议
│       │   ├── sila2/           # SiLA 2 实现
│       │   └── telemetry/       # 遥测上报
│       ├── api/                 # API 定义
│       └── static/              # 前端静态资源
└── docs/                        # 文档
```

### 3. 依赖管理

```bash
cd src/edge
go mod tidy
```

---

## 开发流程

### 1. 本地运行

```powershell
cd src/edge
go run ./cmd/collector
```

**访问地址**：http://localhost:8080

### 2. 代码结构

#### 核心文件

| 文件 | 说明 |
|------|------|
| `main.go` | 主程序入口 |
| `engine_scheduler.go` | 循环调度器 |
| `hal_interface.go` | 硬件抽象接口 |
| `persist_file.go` | 数据持久化 |
| `sila2_gateway.go` | SiLA 2 HTTP 网关 |

#### 目录职责

| 目录 | 职责 |
|------|------|
| `internal/analyzer` | 色谱数据积分分析 |
| `internal/protocol` | GCKC 协议解析 |
| `internal/sila2` | SiLA 2 协议实现 |
| `internal/models` | 数据模型定义 |

### 3. 调试模式

```powershell
# 启用调试日志
$env:EDGE_LOG_LEVEL="debug"
go run ./cmd/collector
```

### 4. 测试

```bash
# 运行所有测试
go test ./...

# 运行特定包测试
go test ./internal/analyzer/...

# 生成测试覆盖率
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

---

## 代码规范

### 1. Go 编码规范

遵循 [Go 官方编码规范](https://go.dev/doc/effective_go)：

```go
// 正确示例
func ProcessData(data []float64) error {
    if len(data) == 0 {
        return errors.New("empty data")
    }
    // 处理逻辑
    return nil
}
```

### 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 包名 | 小写，无下划线 | `analyzer`, `protocol` |
| 函数名 | PascalCase | `ProcessData` |
| 变量名 | camelCase | `deviceID`, `traceData` |
| 常量名 | UPPER_SNAKE_CASE | `MAX_RETRY`, `DEFAULT_PORT` |

### 3. 注释规范

```go
// Analyze 执行色谱数据分析
// 参数:
//   trace - 原始谱图数据
//   method - 分析方法配置
//   gitSHA - 版本标识
//   now - 分析时间
// 返回: 分析结果和错误信息
func Analyze(trace contracts.Trace, method contracts.Method, 
    gitSHA string, now time.Time) (contracts.Result, error) {
    // 实现代码
}
```

---

## 提交规范

### 提交信息格式

```
<类型>(<模块>): <简短描述>

<详细描述>

<相关Issue/PR>
```

### 类型说明

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复Bug |
| `docs` | 文档更新 |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具更新 |

### 示例

```
feat(analyzer): 添加基线校正算法

- 实现自适应基线检测
- 支持多种基线模式选择
- 优化噪声过滤逻辑

Closes #123
```

---

## 发布流程

### 版本号管理

使用语义化版本：`vX.Y.Z`

- `X`：主版本号（重大变更）
- `Y`：次版本号（新功能）
- `Z`：修订号（Bug修复）

### 更新版本号

修改以下文件：

1. `cmd/collector/main.go` - `AppVersion`
2. `internal/sila2/silaservice.go` - `ServerVersion`
3. `internal/analyzer/analyze.go` - `EngineVersion`
4. `static/index.html` - JS引用版本
5. `static/js/app.js` - 模块引用版本

### 发布步骤

```bash
# 1. 更新版本号
# 2. 编译所有平台
make build-linux
make build-arm64
make build-armv7

# 3. 运行测试
go test ./...

# 4. 创建发布
git tag v0.3.88
git push origin v0.3.88
```
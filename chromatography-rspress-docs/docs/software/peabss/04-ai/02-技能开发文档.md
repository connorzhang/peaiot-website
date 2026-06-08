# PEABSS AI技能开发文档

## 一、系统架构

### 1. 技能服务架构

PEABSS系统采用**双服务架构**来提供AI技能：

| 服务 | 语言 | 运行方式 | 通信协议 | 职责 |
|------|------|----------|----------|------|
| **MCP服务** | Go | 主进程内置 | HTTP | 系统核心技能、实时数据处理、设备管理 |
| **Python AI服务** | Python | 独立进程 | gRPC | 复杂AI分析、预测、模式识别 |

### 2. 技能注册机制

#### MCP服务（Go端）
- **注册方式**：手动注册
- **注册入口**：`portal/mcp/skills/device_skills.go` 中的 `GetDeviceSkills()`
- **技能实现**：实现 `interfaces.Skill` 接口
- **管理机制**：`SkillRegistry` 技能注册中心

#### Python AI服务
- **注册方式**：自动注册
- **注册入口**：`python/ai_service/skills/skill_manager.py` 中的 `register_skills()`
- **技能实现**：继承 `Skill` 基类
- **管理机制**：`SkillManager` 技能管理器

### 3. 技能调用方式

#### MCP服务
- **接口**：`POST /portal/mcp/call`
- **参数**：`{"tool_name": "skill_name", "arguments": {"param1": "value1"}}`
- **返回**：技能执行结果（JSON格式）

#### Python AI服务
- **接口**：gRPC `ExecuteSkill`
- **参数**：`{"skill_name": "skill_name", "parameters": {"param1": "value1"}}`
- **返回**：`{"success": true, "result": "result_data"}`

## 二、已完成技能

### MCP服务（Go端）
| 技能名称 | 功能描述 | 数据来源 | 状态 |
|---------|---------|---------|------|
| get_device_list | 获取设备列表 | PostgreSQL | ✅ 已完成 |
| get_device_history | 获取设备历史数据 | Elasticsearch | ✅ 已完成 |
| get_device_rtd_data | 获取设备实时数据 | Elasticsearch | ✅ 已完成 |
| get_multiple_devices_latest_data | 批量获取设备最新数据 | Elasticsearch | ✅ 已完成 |
| get_device_factor_stat | 获取设备因子统计数据 | Elasticsearch | ✅ 已完成 |
| get_device_trend_data | 获取设备趋势数据 | Elasticsearch | ✅ 已完成 |
| check_device_status | 检查设备在线状态 | PostgreSQL | ✅ 已完成 |
| get_enterprise_device_status | 统计企业设备状态 | PostgreSQL | ✅ 已完成 |
| get_enterprise_all_devices_latest_data | 获取企业所有设备最新数据 | PostgreSQL + Elasticsearch | ✅ 已完成 |
| get_environment_data | 查询设备环境数据 | Elasticsearch | ✅ 已完成 |
| compare_multi_device_data | 多设备数据对比 | Elasticsearch | ✅ 已完成 |
| analyze_environment_statistics | 环境数据统计分析 | Elasticsearch | ✅ 已完成 |
| detect_environment_anomaly | 环境数据异常检测 | Elasticsearch | ✅ 已完成 |
| predict_environment_anomaly | 环境异常预测 | Elasticsearch | ✅ 已完成 |
| predict_environment_trend | 环境趋势预测 | Elasticsearch | ✅ 已完成 |
| analyze_multi_factor_correlation | 多因子相关性分析 | Elasticsearch | ✅ 已完成 |
| get_environment_improvement_advice | 环境改善建议 | Elasticsearch | ✅ 已完成 |
| analyze_with_copilot | Copilot 分析 | Elasticsearch + AI | ✅ 已完成 |
| analyze_multi_device_coordination | 多设备协同分析 | Elasticsearch | ✅ 已完成 |
| assess_environment_risk | 环境风险评估 | Elasticsearch | ✅ 已完成 |
| analyze_energy_consumption | 能源消耗分析 | Elasticsearch | ✅ 已完成 |
| assess_environment_compliance | 环境合规评估 | Elasticsearch | ✅ 已完成 |
| diagnose_device_failure | 设备故障诊断 | Elasticsearch | ✅ 已完成 |
| get_device_maintenance_advice | 设备维护建议 | Elasticsearch | ✅ 已完成 |
| get_enterprise_environment_overview | 企业环境概览 | PostgreSQL + Elasticsearch | ✅ 已完成 |
| send_sms_notification | 发送短信通知 | 外部服务 | ✅ 已完成 |
| send_email_notification | 发送邮件通知 | 外部服务 | ✅ 已完成 |
| ollama_ai | Ollama AI 分析 | 外部服务 | ✅ 已完成 |
| compare_historical_data | 历史数据对比 | Elasticsearch | ✅ 已完成 |
| visualize_environment_data | 环境数据可视化 | Elasticsearch | ✅ 已完成 |

### Python AI服务
| 技能名称 | 功能描述 | 状态 |
|---------|---------|------|
| device_list | 获取设备列表 | ✅ 已完成 |
| device_status | 获取设备详细状态 | ✅ 已完成 |
| check_device_status | 检查设备在线状态 | ✅ 已完成 |
| get_enterprise_device_status | 统计企业设备状态 | ✅ 已完成 |
| get_environment_data | 查询设备环境数据 | ✅ 已完成 |
| compare_multi_device_data | 多设备数据对比 | ✅ 已完成 |
| analyze_environment_statistics | 环境数据统计分析 | ✅ 已完成 |
| detect_environment_anomaly | 环境数据异常检测 | ✅ 已完成 |
| alarm_statistics | 报警统计 | ✅ 已完成 |
| data_analysis | 数据分析 | ✅ 已完成 |
| predict_environment_trend | 环境数据预测分析 | ✅ 已完成 |

## 三、待开发技能

### 高级技能（基于ES）
| 技能名称 | 功能描述 | 数据来源 | 优先级 | 建议实现 |
|---------|---------|---------|--------|----------|
| analyze_regional_environment | 区域环境分析 | Elasticsearch | P3 | Python |
| assess_data_quality | 环境数据质量评估 | Elasticsearch | P3 | Go |
| optimize_energy_consumption | 能源消耗优化 | Elasticsearch | P2 | Python |
| intelligent_alarm_prediction | 智能告警预测 | Elasticsearch | P2 | Python |

### 企业级技能（综合）
| 技能名称 | 功能描述 | 数据来源 | 优先级 | 建议实现 |
|---------|---------|---------|--------|----------|
| get_enterprise_anomaly_statistics | 企业异常统计 | PostgreSQL + Elasticsearch | P2 | Go |
| analyze_enterprise_environment_trend | 企业环境趋势 | Elasticsearch | P3 | Python |
| enterprise_compliance_report | 企业合规性报告 | Elasticsearch | P3 | Python |
| enterprise_risk_management | 企业风险管理 | PostgreSQL + Elasticsearch | P2 | Go |

## 四、工具实现

### 1. 工具与技能的关系

PEABSS系统采用**技能（Skill）**和**工具（Tool）**两套机制：

| 机制 | 用途 | 实现接口 | 注册位置 |
|------|------|----------|----------|
| **技能（Skill）** | 用于AI系统集成 | `interfaces.Skill` | `GetDeviceSkills()` |
| **工具（Tool）** | 用于传统API调用 | `Tool` | `registerTools()` |

### 2. 已实现的工具

所有技能都已经有对应的工具实现，包括：

| 工具名称 | 对应技能 | 功能描述 |
|---------|---------|---------|
| get_device_list | DeviceListSkill | 获取设备列表 |
| get_device_history | DeviceHistorySkill | 获取设备历史数据 |
| get_device_rtd_data | DeviceRtdDataSkill | 获取设备实时数据 |
| get_multiple_devices_latest_data | MultipleDevicesLatestDataSkill | 批量获取设备最新数据 |
| get_device_factor_stat | DeviceFactorStatSkill | 获取设备因子统计数据 |
| get_device_trend_data | DeviceTrendDataSkill | 获取设备趋势数据 |
| check_device_status | DeviceStatusCheckSkill | 检查设备在线状态 |
| get_enterprise_device_status | EnterpriseDeviceStatusSkill | 统计企业设备状态 |
| get_enterprise_all_devices_latest_data | EnterpriseAllDevicesLatestDataSkill | 获取企业所有设备最新数据 |
| get_environment_data | EnvironmentDataQuerySkill | 查询设备环境数据 |
| compare_multi_device_data | MultiDeviceDataComparisonSkill | 多设备数据对比 |
| analyze_environment_statistics | EnvironmentStatisticsSkill | 环境数据统计分析 |
| detect_environment_anomaly | EnvironmentAnomalyDetectionSkill | 环境数据异常检测 |
| predict_environment_anomaly | EnvironmentAnomalyPredictionSkill | 环境异常预测 |
| predict_environment_trend | EnvironmentPredictionSkill | 环境趋势预测 |
| analyze_multi_factor_correlation | MultiFactorCorrelationSkill | 多因子相关性分析 |
| get_environment_improvement_advice | EnvironmentImprovementAdviceSkill | 环境改善建议 |
| analyze_with_copilot | CopilotAnalysisSkill | Copilot 分析 |
| analyze_multi_device_coordination | MultiDeviceCoordinationAnalysisSkill | 多设备协同分析 |
| assess_environment_risk | EnvironmentRiskAssessmentSkill | 环境风险评估 |
| analyze_energy_consumption | EnergyConsumptionAnalysisSkill | 能源消耗分析 |
| assess_environment_compliance | EnvironmentComplianceSkill | 环境合规评估 |
| diagnose_device_failure | DeviceDiagnosisSkill | 设备故障诊断 |
| get_device_maintenance_advice | DeviceMaintenanceAdviceSkill | 设备维护建议 |
| get_enterprise_environment_overview | EnterpriseEnvironmentOverviewSkill | 企业环境概览 |
| send_sms_notification | SMSSkill | 发送短信通知 |
| send_email_notification | EmailSkill | 发送邮件通知 |
| ollama_ai | OllamaAISkill | Ollama AI 分析 |
| compare_historical_data | HistoricalDataComparisonSkill | 历史数据对比 |
| visualize_environment_data | EnvironmentVisualizationSkill | 环境数据可视化 |

### 3. 工具调用方式

- **接口**：`POST /portal/mcp/call`
- **参数**：`{"tool_name": "tool_name", "arguments": {"param1": "value1"}}`
- **返回**：工具执行结果（JSON格式）

## 五、技能开发规范

### 1. 命名规范
- 技能名称使用小写字母，单词间用下划线分隔
- 技能描述清晰简洁，说明技能的功能和用途
- 保持Go端和Python端技能名称的一致性

### 2. 接口规范
- **Go端**：实现 `interfaces.Skill` 接口
  - `Name()`：技能名称
  - `Description()`：技能描述
  - `Parameters()`：参数定义（JSON Schema）
  - `Execute()`：执行逻辑

- **Python端**：继承 `Skill` 基类
  - `__init__()`：初始化技能
  - `get_parameters()`：参数定义
  - `execute()`：执行逻辑

### 3. 数据来源
- 设备基本信息、在线状态：PostgreSQL
- 环境监测数据、历史数据：Elasticsearch

### 4. 性能优化
- **批量查询**：使用批量查询减少网络开销
- **数据缓存**：对频繁查询的数据进行缓存
- **并行处理**：使用goroutine提高处理效率
- **数据过滤**：只查询必要的字段和数据

### 5. 安全规范
- **权限控制**：验证用户对设备的访问权限
- **输入验证**：严格验证技能参数
- **错误处理**：提供清晰的错误信息

## 五、技能开发流程

### 1. 技能设计
1. 确定技能的功能和用途
2. 定义技能的参数和返回格式
3. 选择合适的实现语言（Go或Python）
4. 设计技能的执行逻辑

### 2. 技能实现
- **Go端**：
  1. 在 `portal/mcp/skills/` 目录创建技能实现
  2. 在 `GetDeviceSkills()` 中注册技能
  3. 实现 `interfaces.Skill` 接口

- **Python端**：
  1. 在 `python/ai_service/skills/` 目录创建技能实现
  2. 在 `skill_manager.py` 的 `register_skills()` 中注册技能
  3. 继承 `Skill` 基类并实现相关方法

### 3. 技能测试
- 测试技能的参数验证
- 测试技能的执行逻辑
- 测试技能的错误处理
- 测试技能的性能和可靠性

### 4. 技能部署
- 重新启动服务以加载新技能
- 验证技能是否正确注册
- 测试技能的调用接口

## 六、技能集成方式

### 1. 前端集成
- 通过 `POST /portal/mcp/call` 接口调用MCP技能
- 展示技能执行结果
- 提供技能参数配置界面

### 2. AI系统集成
- 通过gRPC调用Python AI服务
- 利用AI技能进行复杂分析
- 实现智能决策和预测

### 3. 系统内部集成
- 其他服务通过内部API调用技能
- 自动化流程中集成技能
- 告警系统与技能集成

## 七、技能管理最佳实践

### 1. 技能版本管理
- 记录技能的版本信息
- 保持技能接口的向后兼容性
- 提供技能升级和回滚机制

### 2. 技能监控
- 监控技能的执行性能
- 记录技能的调用频率和成功率
- 识别异常技能和性能瓶颈

### 3. 技能状态管理
- **状态监控**：实时监控技能的健康状态
- **健康检查**：定期执行技能健康检查
- **状态同步**：技能状态的自动更新
- **调用保护**：确保只调用可用的技能
- **API端点**：
  - `GET /portal/mcp/skill/status` - 获取所有技能状态
  - `GET /portal/mcp/skill/status/:skillName` - 获取指定技能状态
  - `POST /portal/mcp/skill/check/:skillName` - 检查技能健康状态

### 4. 技能文档
- 为每个技能提供详细的文档
- 说明技能的功能、参数和返回格式
- 提供技能的使用示例

### 5. 技能安全
- 限制技能的访问权限
- 防止技能被恶意调用
- 保护敏感数据

## 八、架构优化建议

### 1. 统一技能注册中心
- 实现技能自动发现和注册机制
- 提供统一的技能目录服务
- 支持技能的动态注册和注销

### 2. API网关
- 统一对外接口
- 智能路由到合适的服务
- 负载均衡和容错

### 3. 技能编排
- 支持技能的组合和编排
- 实现复杂的工作流
- 提供技能的依赖管理

### 4. 技能市场
- 支持第三方技能的集成
- 提供技能的评级和推荐
- 实现技能的版本控制

## 九、技能状态管理系统

### 1. 系统架构
- **状态管理器**：`SkillStatusManager` 负责管理技能状态
- **健康检查**：定期执行技能健康检查
- **状态存储**：内存存储技能状态，支持持久化
- **API接口**：提供技能状态查询和管理接口

### 2. 技能状态结构
```go
type SkillStatus struct {
    Name        string    // 技能名称
    Available   bool      // 是否可用
    LastCheck   time.Time // 最后检查时间
    Error       string    // 错误信息
    HealthScore float64   // 健康评分
}
```

### 3. 健康检查机制
- **检查频率**：默认每5分钟执行一次
- **检查方式**：调用技能的健康检查方法
- **结果处理**：根据检查结果更新技能状态

### 4. 状态同步机制
- **执行前检查**：调用技能前检查状态
- **执行后更新**：根据执行结果更新状态
- **异常处理**：捕获技能执行异常并更新状态

### 5. 集成方式
- **技能注册**：注册技能时自动添加状态
- **技能执行**：执行技能时检查和更新状态
- **服务启动**：启动时初始化技能状态

## 十、技术栈

### Go端
- Go 1.20+
- PostgreSQL
- Elasticsearch
- gRPC

### Python端
- Python 3.9+
- NumPy（用于数据处理）
- LangChain
- gRPC

## 十一、总结

PEABSS系统采用双服务架构来提供AI技能，充分利用了Go和Python的优势：

1. **技术互补**：Go处理系统核心逻辑和实时数据，Python处理复杂的AI分析
2. **功能分离**：清晰的职责划分，便于维护和扩展
3. **可扩展性**：可以独立升级和扩展两端的功能
4. **可靠性**：一个服务故障不影响另一个服务
5. **状态管理**：完善的技能状态管理系统，确保技能的可靠性

通过合理的技能开发规范和管理机制，系统能够提供高质量的AI技能，满足不同场景的需求。未来，通过进一步的架构优化，可以实现更灵活、更强大的技能生态系统。
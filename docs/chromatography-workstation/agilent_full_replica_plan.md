# 安捷伦化学工作站 (Agilent ChemStation) 全功能复刻主计划

> 🏷️ 当前版本: v0.3.42 | ⏱️ 最后同步: 2026-06-26 20:05:40 | 🔗 构建 Commit: 80ddc26


## 核心复刻原则 (Core Principles)
1. **100% 功能与操作流复刻**：必须涵盖安捷伦所有核心模块的业务逻辑，包括数据结构、操作方法、快捷键支持。
2. **现代化 UI/UX 优化**：不强求老旧 MFC 界面的像素级复制，使用 React + Tailwind 打造高密度、响应式、更符合现代工业软件习惯的操作界面。
3. **“胖后端、瘦前端”架构**：复杂的积分算法、硬件状态机、数据降采样必须全部在 Rust (Salvo) 中实现，React 仅负责高性能视图渲染。

---

## 模块执行清单 (Execution Checklist)

### 阶段 1：核心基建与在线监控 (已完成)
- [x] Rust 硬件模拟器 (双通道: TCD & FID)
- [x] Rust 边缘网关 (Salvo) WebSocket 实时流推送
- [x] 屏蔽浏览器默认行为，实现原生级菜单与快捷键 (Ctrl+O, Ctrl+S)
- [x] 方法与运行控制 (Method & Run Control)：高密度属性网格 + 多通道堆叠色谱图

### 阶段 2：序列与自动进样 (Sequence Management) - **[已完成]**
- [x] **序列序列表界面**：类似 Excel 的数据网格编辑。
- [x] 核心字段支持：Line (行号), Location (瓶位), Sample Name (样品名), Method Name (方法名), Inj/Location (进样次数), Inj Volume (进样量)。
- [x] **操作流复刻**：支持复制、粘贴、填充递增 (Fill Down)、序列校验 (Sequence Summary)。
- [x] **序列状态机 (Rust Backend)**：Rust 接管序列的循环执行逻辑（加载方法 -> 移动进样盘 -> 进样 -> 数据采集 -> 分析报告 -> 下一针）。

### 阶段 3：数据分析与积分引擎 (Data Analysis) - **[已完成]**
- [x] **图表交互操作流**：鼠标框选放大 (Zoom in)、双击恢复原图、拖拽平移。
- [x] **积分结果网格**：Ret Time (保留时间), Type (峰类型, 如 BB, VV), Width (峰宽), Area (面积), Height (峰高), Area %。
- [x] **手动积分工具栏**：切线撇去 (Tangent Skim)、合并峰、强制基线。
- [x] **Rust 积分引擎对接**：前端发送手动积分指令，Rust 引擎计算后下发更新的峰边界与面积。

### 阶段 4：校准与定量 (Calibration & Quantitation) - **[已完成]**
- [x] **校准曲线视图**：支持线性 (Linear)、二次 (Quadratic)、原点强制 (Force Origin) 等拟合模式。
- [x] **校准表 (Calibration Table)**：Level (级别), Amount (浓度), Response (响应值), ISTD (内标) 配置。
- [x] **自动更新操作流**：运行完标准品后，一键更新方法中的校准曲线。

### 阶段 5：报告排版与批处理 (Reporting & Batch Review) - **[已完成]**
- [x] **报告排版器 (Report Layout)**：支持拖拽组合色谱图、结果表、方法参数、公司 Logo。已对接后端动态积分数据并生成 A4 报表视图。
- [x] **批处理审核 (Batch Review)**：快速翻阅序列运行的所有结果，确认积分状态，一键批准并生成 PDF。

### 阶段 6：系统配置与审计追踪 (System & Audit) - **[已完成]**
- [x] **审计追踪 (Audit Trail)**：记录所有方法修改、手动积分操作、仪器状态变化，符合 21 CFR Part 11 要求。前后端 API 对接完成，支持写入与查询。
- [x] **权限管理**：Operator, Manager, Admin 角色隔离。

### 阶段 7：系统适用性测试 (System Suitability - SST) - **[已完成]**
- [x] **SST 核心算法 (Rust)**：实现 USP/EP/JP 药典标准的算法，计算理论塔板数 (Theoretical Plates)、分离度 (Resolution)、拖尾因子 (Tailing Factor) 与对称因子 (Symmetry)。
- [x] **SST 报告与网格 (React)**：在数据分析模块中追加高级药典参数视图，支持红绿灯阈值警告 (如 $R_s > 1.5$)。

### 阶段 8：DAD/PDA 三维光谱分析 (3D Spectral Analysis) - **[已完成]**
- [x] **光谱提取**：支持从 3D 数据矩阵中提取特定时间的紫外吸收光谱 (UV-Vis Spectra)。
- [x] **峰纯度与光谱库 (Peak Purity & Library)**：光谱相似度计算与峰纯度验证算法。

### 阶段 9：早期维护反馈与诊断 (EMF & Diagnostics) - **[已完成]**
- [x] **仪器健康状态监控**：统计泵密封垫磨损、氘灯/钨灯点亮小时数、进样针穿刺次数。
- [x] **预防性维护报警**：基于阈值的维护寿命倒计时与图形化仪表盘。

---

## 终极工业深度功能清单 (Extreme Industrial Features) - **[已完成]**

### 阶段 10：高级色谱控制与算法 (Advanced Chromatography) - **[已完成]**
- [x] **保留时间锁定 (Retention Time Locking, RTL)**：核心算法下沉 Rust，通过微调载气压力，确保在更换色谱柱或仪器后，目标化合物的保留时间保持不变。
- [x] **方法翻译器 (Method Translator)**：在更换载气（如 He 换 H2）或色谱柱尺寸时，自动计算并平移所有温控和压力参数。
- [x] **峰纯度数学解卷积 (Peak Purity Deconvolution)**：利用 DAD/PDA 3D 数据，计算相似度因子，判断色谱峰下是否隐藏共流出组分。

### 阶段 11：企业级合规与工作流 (Enterprise & Compliance) - **[已完成]**
- [x] **多级电子签名 (Advanced E-Signatures)**：实现“分析员-审核员-批准员”三级签名的合规流程，绑定特定版本的数据与审计追踪。
- [x] **LDAP/Active Directory 集成**：支持企业域账号单点登录 (SSO) 和 IT 安全策略强制执行。

---

## 终极填补：安捷伦残缺企业级功能补全计划 (Ultimate Missing Features) - **[执行中]**

### 阶段 12：智能进样器程序 (Intelligent Injector Program / Sample Prep) - **[已完成]**
- [x] **可视化洗针与进样流**：通过拖拽指令（Draw, Mix, Dispense, Wash, Wait），编排机械臂与注射器的前处理动作。
- [x] **在线衍生化/稀释**：在进样前自动完成化学反应与稀释。

### 阶段 13：二维色谱控制与中心切割 (2D-LC / GCxGC Valve Control) - **[已完成]**
- [x] **阀切换时间表 (Valve Event Table)**：毫秒级精度的十通阀/六通阀控制时间表，用于将第一维流出的目标峰切割到第二维。
- [x] **中心切割视图**：在色谱图上直接标记切割窗口，并同步至方法。

### 阶段 14：SST 质量控制图与趋势分析 (Control Charts & Trending) - **[已完成]**
- [x] **控制图生成**：监控多次运行中某化合物的保留时间、理论塔板数、面积的漂移趋势。
- [x] **统计学边界报警**：计算 3-Sigma 警戒线与控制线，检测非随机误差。

### 阶段 15：自定义计算器与报告公式 (Custom Calculator & Reporting)
- [x] **基于 AST 的公式解析引擎**：允许用户在数据分析中输入自定义公式（如 `Area / ISTD_Area * 1000`）。
- [x] **自定义结果列**：将计算结果作为新列动态附加到积分结果网格中。

### 阶段 16：ECM 企业内容管理系统对接 (ECM Integration)
- [x] **安全数据归档 (Vaulting)**：锁定 .D 文件夹，防篡改，并建立数据生命周期与版本控制。

---

## 盲区补全：安捷伦核心高阶拓展功能 (Missed Advanced Features) - **[待规划]**

基于对 Agilent OpenLab CDS 及高级 ChemStation 的深度重新评估，以下属于更高维度的垂直细分功能：

### 阶段 17：质谱联用与光谱深度解析 (LC/GC-MS Integration) - **[已完成]**
- [x] **质谱数据处理**：支持单四极杆 (SQ) 或 Q-TOF 数据的提取离子流图 (EIC) 与总离子流图 (TIC)。
- [x] **NIST 谱库检索**：质谱峰的自动解卷积 (AMDIS) 与在线/离线 NIST 谱库比对。

### 阶段 18：凝胶渗透/尺寸排阻色谱 (GPC/SEC Analysis) - **[已完成]**
- [x] **聚合物分子量计算**：实现数均分子量 (Mn)、重均分子量 (Mw)、Z均分子量 (Mz) 及多分散性指数 (PDI) 算法。

### 阶段 19：制备色谱与智能序列 (Prep-LC & Intelligent Sequence) - **[已完成]**
- [x] **自动馏分收集 (Fraction Collection)**：基于峰高、斜率或保留时间触发收集阀。
- [x] **智能序列决断**：根据前一针的运行结果（如发现杂质超标），动态触发重进样、改变进样量或运行洗针方法。
- [x] **仪器休眠/唤醒方法**：周末自动化运行结束后自动进入低流速/关灯模式，工作日自动唤醒并预热。

# 开发环境配置（VS2022）

本项目为 WinForms（`.NET Framework 4.8`，`net48`）项目，解决方案版本固定为 VS2022 `17.12.35527.113`。

## 必装软件（与 docs/vs2022.txt 对齐）

- Visual Studio 2022（建议与参考机一致）：`17.12.3`
- .NET Framework：`4.8`（需要安装 Developer Pack / Targeting Pack，确保能编译 `net48`）

## 安装顺序（推荐）

1. 安装 VS2022
2. 在 VS Installer 中导入本仓库根目录的 `.vsconfig`，补齐工作负载与组件
3. 安装 DevExpress `22.2`（需要 VS 集成/设计器时必装）
4. 安装/启用 VS 扩展（如 Copilot、IntelliCode 等）

## VS2022 工作负载（最低集合）

- `.NET 桌面开发`

仓库根目录已提供 `.vsconfig`，用于一键选择工作负载/组件。

## 第三方组件（影响能否编译/设计器）

项目引用了 DevExpress（在 `IBrainChrom.csproj` 中是绝对路径 `C:\Program Files\DevExpress 22.2\...`）。

- 如果要正常打开 DevExpress 设计器/控件编辑器：需要安装 DevExpress `22.2`（路径需与 csproj 一致，或安装到默认目录）。
- 如果只需要跑起来/编译（不依赖设计器）：可以用已打包的 DLL（见 `bin/Debug/net48`），但仍建议最终补齐 DevExpress 安装。

说明：`docs/vs2022.txt` 中列的 DevExpress 扩展（Dashboard/Reporting/DeploymentTool 等）通常由 DevExpress 安装程序自动安装/更新，不建议单独从市场找 VSIX。

## 项目依赖 DLL（SF-G 目录）

`IBrainChrom.csproj` 需要以下依赖 DLL（已改为从仓库内 `SF-G/` 引用）：

- `SF-G/System.Data.SQLite.dll` + `SF-G/SQLite.Interop.dll`
- `SF-G/NPOI*.dll`
- `SF-G/HZH_Controls.dll`
- `SF-G/DevComponents.DotNetBar2.dll`
- `SF-G/log4net.dll`
- `SF-G/Microsoft.Office.Interop.Word.dll`
- `SF-G/NPlot.dll`
- `SF-G/dog_net_windows.dll`

如果你是从其它位置拷贝/新拉取代码，确保 `SF-G/` 目录存在且文件齐全。

## VS 扩展（参考机已安装）

下面是参考机的扩展清单（来自 [vs2022.txt](file:///i:/GIT/VS2022/YQ51215-GC_.NET_SH/docs/vs2022.txt)），一般不影响编译，但影响开发体验与 DevExpress 设计器：

- DevExpress Dashboard Extension `1.4`
- DevExpress Reporting Extension `1.4`
- DevExpress Reporting Tools Extension `1.0`
- DevExpress.DeploymentTool `1.0`
- DevExpress.ExpressApp.Design.DynamicPackage `1.0`
- DevExpress.ExpressApp.DesignPackage `1.0`
- Visual Studio IntelliCode `2.2`
- GitHub Copilot `17.12.38.29086`

### 哪些“插件”必须装？

- 必须（影响编译）：VS2022 + `.NET Framework 4.8 Targeting Pack`
- 必须（影响 DevExpress 设计器/编译）：DevExpress `22.2`
- 可选（不影响编译，只影响体验）：GitHub Copilot、IntelliCode、TypeScript Tools、JVM Debugger、GoogleTest/Boost.Test 适配器等

### 插件从哪里装？

- DevExpress 系列：用 DevExpress `22.2` 安装程序（会安装 VS 集成与 VSIX）
- GitHub Copilot：Visual Studio 的“管理扩展”中安装（需要 GitHub 账号登录）
- IntelliCode：多数 VS2022 已内置；如果未启用可在“管理扩展”中安装/启用

## 一键检查/初始化

- 环境检查脚本：`tools/check-dev-env.ps1`
- 依赖 DLL 初始化脚本：`tools/bootstrap-sf-g.ps1`

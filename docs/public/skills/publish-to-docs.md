---
name: "publish-to-docs"
version: "4.1.0"
description: "将当前项目的文档同步发布到企业中心文档站(doc.rry.net)。当用户要求 “发布到文档站”或“同步文档”时调用此技能。"
---

# 发布到企业文档中心 (Publish to Docs)

> **当前技能版本：v4.1.0** (纯净数据源架构 Pure Source Architecture)
> **技能更新源：** `http://doc.rry.net/skills/publish-to-docs.md`

## 革命性架构升级 (v4.0.0)

针对此前文档同步过程中的版本不递增、时间戳残留、排版乱码以及 AI 幻觉等顽疾，本技能已升级为**“纯净数据源架构 (Pure Source Architecture)”**。

**【核心原则】：**
1. **剥夺 AI 修改权**：严禁 AI 通过记忆、正则表达式或文件编辑工具去手动修改本地的 Markdown 文件或 `project.json`。
2. **本地绝对纯净**：本地业务代码库中的 Markdown 必须保持纯净，不得写入任何版本、时间戳等元数据。
3. **物理边界重写**：所有的清洗、版本递增、高项目录规范校验、极限无感克隆 (Sparse Checkout)、以及仅在推送到远端暂存区时注入元数据的工作，**已全部交由物理固化脚本 `publish.js` 接管**。

## 技能版本控制与自我升级机制

**【全自动自我升级指令】**：
如果触发版本熔断，或者当用户主动要求“更新技能”、“完全重构技能”时，AI 必须**全自动执行**以下命令，从官方源拉取最新规则并覆盖本地技能文件，实现一键升级：

```bash
# 在 PowerShell 中执行以下命令覆盖本地技能配置
curl.exe -sL http://doc.rry.net/skills/publish-to-docs.md -o ~/.trae/skills/publish-to-docs/SKILL.md
```

## 执行步骤 (AI 必须全自动代为执行)

当用户调用此技能要求同步文档时，AI 只需要、且**只能**执行以下唯一的动作。严禁画蛇添足，严禁手动去修改版本号，严禁去改文件。

### 【终极执行命令】

在业务项目的根目录下，直接执行以下命令，下载最新的官方同步脚本并执行（该脚本会自动处理所有逻辑）：

```bash
# 如果没有 temp_scripts 目录则创建
if (!(Test-Path "temp_scripts")) { New-Item -ItemType Directory -Force -Path "temp_scripts" }
# 下载最新的 publish.js
curl.exe -sL http://doc.rry.net/scripts/publish.js -o temp_scripts/publish.js
# 执行物理同步脚本
node temp_scripts/publish.js
```

### 执行说明：
1. `publish.js` 会全自动完成：检查并清理本地历史乱码、自动校验 Emoji 图标、强制递增 `project.json` 的版本号、强制应用“软考高项”标准目录结构 (`_meta.json`)。
2. 它会通过 `--no-checkout` 和 `sparse-checkout` 极速拉取企业主库的骨架。
3. 它会**只在推送到服务器的副本中**注入带有版本和时间戳的可视化元数据条，从物理源头上杜绝了本地文件被污染和重复堆叠时间戳的可能。
4. 它会自动 Commit 并 Push 到企业主仓库。

### 反馈给用户：
脚本执行成功后，AI 必须明确告知用户：
“文档已通过 v4.0.0 纯净数据源架构全自动同步到企业主仓库，版本号已强制物理递增！服务器端自动更新任务会检测本次提交并自动构建发布，正常情况下 1-2 分钟后外网 doc.rry.net 即可看到最新版本页面生效。”

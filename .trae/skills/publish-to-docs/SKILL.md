---
name: "publish-to-docs"
description: "将当前项目的文档同步发布到企业中心文档站(doc.rry.net)。当用户要求“发布到文档站”或“同步文档”时调用此技能。"
---

# 发布到企业文档中心 (Publish to Docs)

该技能用于将任意业务项目（硬件、软件等）的说明书文档，通过免 API 的 Git 中转架构，自动推送到奕柏科技的企业文档中心主仓库，从而触发服务器端 Webhook 自动部署到 `doc.rry.net`。

## 执行步骤 (AI 必须全自动代为执行)

当用户调用此技能时，AI 需要严格按照以下步骤**全自动**执行（利用终端或 Node.js 脚本，不要让用户手动敲命令，只要结果）：

### 1. 确定分类与文档源路径
- 检查当前业务项目中的文档存放路径（通常为 `docs/` 或类似目录）。
- 确认该文档所属的**大类**（`hardware` 或 `software`）以及**子项目名称**（如 `workstation`、`micro-gc`）。
- *如果当前上下文中不明确，AI 可以主动询问用户一次：“请问本文档属于硬件(hardware)还是软件(software)？子项目名称是什么？”*

### 2. 克隆文档主仓库
- 在当前项目的上一级目录（或系统的 Temp 目录）建立临时文件夹，执行克隆操作：
  ```bash
  git clone git@github.com:connorzhang/peaiot-website.git temp_docs_repo
  ```

### 3. 复制并组织文档
- 进入克隆下来的主仓库中，文档统一存放在：`temp_docs_repo/chromatography-rspress-docs/docs/`
- 在该路径下，根据步骤 1 确定的分类创建目录：`temp_docs_repo/chromatography-rspress-docs/docs/<大类>/<子项目名>/`
- 将当前业务项目中的所有 Markdown 文档（`.md`, `.mdx`）及相关的静态资源，全部复制到上述目标目录中。
  - *注意：如果在目标目录已存在旧文档，请直接覆盖同步更新。*

### 4. 提交并推送到主仓库
- 进入 `temp_docs_repo` 目录内，自动执行 Git 提交流程：
  ```bash
  git add chromatography-rspress-docs/docs/
  git commit -m "docs: 自动同步 <子项目名> 项目文档"
  git push origin main
  ```
  *(注：遵循用户的核心习惯，执行 git push 时直接全自动执行，无需询问确认)*

### 5. 清理与结果反馈
- 推送成功后，删除临时克隆的 `temp_docs_repo` 目录。
- 向用户明确反馈执行结果：“文档已成功推送到文档中心主仓库。Git Webhook 已触发，服务器 (doc.rry.net) 正在自动拉取并重新编译发布，预计 1-2 分钟后即可在网页端看到最新文档！”

## 核心规则与红线
- **完全自动化**：必须代用户执行克隆、复制、提交和推送的所有操作。
- **强制分类参数**：任何文档都必须有明确的 `<大类>/<子项目名>` 层级，绝对不能直接丢在根目录下，以保证多站点路由隔离的架构完整性。
- **免 API 原则**：严禁尝试使用宝塔 API 或 FTP 直传文件，必须且只能通过 `git push` 到主仓库来触发更新。
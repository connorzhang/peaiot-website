---
name: "publish-to-docs"
version: "2.4.1"
description: "将当前项目的文档同步发布到企业中心文档站(doc.rry.net)。当用户要求 “发布到文档站”或“同步文档”时调用此技能。"
---

# 发布到企业文档中心 (Publish to Docs)

> **当前技能版本：v2.4.1** (支持主仓库最低版本强制校验、关键破坏性动作前二次校验、单项目目录最小化同步、浅克隆与稀疏检出、并发推送重试、现代扁平化与标签化架构、项目侧边栏自治、首页兜底、防乱码编码规范、同步后自动发布闭环、README 兼容与代码块语言容错)
> **技能更新源：** `http://doc.rry.net/skills/publish-to-docs.md`

## 技能版本控制与自我升级机制 (Self-Updating Mechanism)

**版本号的作用**：本技能配置存在严格的版本控制（当前为 v2.4.1）。远端文档站会在 `sync-policy.json` 中声明最低允许的技能版本。如果 AI 发现当前技能版本过低，或者旧版架构不兼容，会被**强制熔断**以防破坏远端文档库架构。

**【全自动自我升级指令】**：
如果触发版本熔断，或者当用户主动要求“更新技能”、“升级文档同步技能”时，AI 必须明白是要从服务器下载最新的版本。此时 AI 必须**全自动执行**以下命令，从官方源拉取最新规则并覆盖本地技能文件，实现一键升级：

```bash
# 在 PowerShell 中执行以下命令覆盖本地技能配置
curl.exe -sL http://doc.rry.net/skills/publish-to-docs.md -o ~/.trae/skills/publish-to-docs/SKILL.md
```
*升级完成后，AI 需提示用户：“全局技能已成功从服务器更新至最新版，请重新执行同步任务！”*

---

该技能用于将任意业务项目（硬件、软件等）的说明书文档，通过 Git 中转架构自动推送到奕柏科技的企业文档中心主仓库。主仓库收到推送后，由 `doc.rry.net` 服务器端的自动更新任务拉取最新代码、重新生成项目索引、编译并发布静态站点。

## 执行步骤 (AI 必须全自动代为执行)

当用户调用此技能时，AI 需要严格按照以下步骤**全自动**执行（利用终端或 Node.js 脚本，不要让用户手动敲命令，只要结果）：

### 1. 检查并生成项目标签配置 (project.json)
- 检查当前业务项目的文档目录（如 `docs/`）下是否存在 `project.json` 文件。
- 如果**不存在**，AI 必须主动分析项目的 README 或文档内容，**全自动生成**一个 `project.json`，格式如下：
  ```json
  {
    "id": "当前项目英文缩写（唯一目录名，如 peabss）",
    "title": "项目中文名称",
    "description": "项目一句话简介",
    "tags": ["软件系统", "云端平台", "可多选标签..."],
    "icon": "🌐（选择一个合适的 Emoji）",
    "repo": "当前项目的完整 Git URL (如 git@github.com:xxx/yyy.git)"
  }
  ```
- **【强制红线】**：`repo` 字段必须使用当前项目的完整 Git 仓库 URL，以防止跨平台同名冲突。

### 1.5 生成并维护侧边栏配置 (_meta.json)
- 框架遵循“项目自治”原则，左侧侧边栏的排序和展示名称完全由各项目自身控制。
- 检查当前业务项目的文档目录（如 `docs/`）下是否存在 `_meta.json` 文件。
- 如果**不存在**，AI 必须主动基于当前的 Markdown 文件结构，为项目自动生成一个 `_meta.json` 配置文件，以确保侧边栏的易读性（例如：给文件排序、设置中文 label 等）。目录项推荐显式写 `"type": "dir"`，文件项推荐显式写 `"type": "file"`；新版主框架会兼容省略 `type` 的常见写法，但技能生成时仍应尽量写全，减少歧义。
  ```json
  [
    "index",
    {
      "type": "dir",
      "name": "guide",
      "label": "使用指南"
    }
  ]
  ```
- 提示用户：项目后续可以自行修改此 `_meta.json` 文件。同步时，AI 会将其一并打包，文档站主框架将完全按照该配置渲染项目的侧边栏。

### 1.6 确保存在项目首页 (index.md)
- 检查当前业务项目的文档目录（如 `docs/`）下是否存在 `index.md` 或 `index.mdx` 文件。
- 如果**不存在**，但存在 `README.md` 或 `README.mdx`，AI 应优先基于 README 内容生成或复制一个 UTF-8 编码的 `index.md`，让项目目录地址 `https://doc.rry.net/<project-id>/` 可直接访问；新版主框架可以把 README 作为页面入口参与索引，但默认首页仍推荐使用 `index.md`。
- 如果 `index.md` 与 README 都不存在，AI 必须主动生成一个简短的 `index.md` 作为该项目的默认首页（可基于项目说明生成欢迎语）。
- **【强制编码规范】**：如果 AI 在 Windows (PowerShell) 环境下通过命令生成文件，**必须强制指定使用 UTF-8 编码**（例如使用 `Set-Content -Encoding UTF8` 或 Node.js 的 `fs.writeFileSync(..., 'utf-8')`），绝对禁止使用默认的 `>` 重定向或 `echo`，否则会导致文档站出现中文乱码！
- **【强制红线】**：由于文档站是静态站点，如果没有 `index.md`，访问该项目目录时会导致 403 Forbidden 报错，所以必须确保项目存在默认首页。

### 2. 最小化克隆文档主仓库
- 在当前项目的上一级目录（或系统的 Temp 目录）建立临时文件夹，执行**浅克隆 + 稀疏检出**。单项目同步只需要读取 `sync-policy.json` 和目标项目目录 `docs/<project-id>/`，不得拉取、扫描、修改其它项目目录。
  ```bash
  git clone --depth=1 --filter=blob:none --sparse git@github.com:connorzhang/peaiot-website.git temp_docs_repo
  cd temp_docs_repo
  git sparse-checkout set sync-policy.json docs/<project-id>
  ```
- 如果当前 Git 环境不支持 `--filter=blob:none` 或 `--sparse`，才允许退化为浅克隆 `git clone --depth=1 ...`，但仍必须只操作 `docs/<project-id>/`。

### 2.5 架构兼容性与版本熔断校验 (Version Check)
- 读取克隆下来的主仓库中的架构策略文件：`temp_docs_repo/sync-policy.json`。
- 提取其中的 `min_skill_version` 字段（如 `"2.1.0"`）。
- **【强制红线】版本熔断**：对比本技能声明的当前版本（即 `v2.4.1`）与 `min_skill_version`。如果本技能版本低于主仓库的最低要求，**必须立即中止**，并向用户抛出红色警告：“🔴 致命错误：当前同步技能版本过低，与远端文档站架构不兼容！为了防止破坏文档库，请先拉取最新技能脚本更新全局配置后重试。”，绝不允许往下执行任何清空或复制动作。
- **【强制红线】不依赖外网最新版**：强制熔断只以当前主仓库 `sync-policy.json` 的 `min_skill_version` 为准，不依赖 `doc.rry.net/skills/publish-to-docs.md` 是否可访问，也不以外网最新版检查作为放行条件。
- **【强制红线】关键动作前二次校验**：在执行清空目标目录、提交、push 之前，AI 必须再次执行 `git fetch origin main`，并读取最新 `origin/main:sync-policy.json` 的 `min_skill_version` 重新对比当前技能版本。如果同步过程中最低版本被提高，必须立即中止，不得继续清空、提交或推送。

### 3. 防覆盖校验与扁平化复制 (Ownership Check)
- 在主仓库的目标项目目录下，检查是否已经存在 `docs/<id>/project.json`。
- **【强制红线】冲突熔断**：如果该目录存在，读取该目录下的旧 `project.json`。对比其中的 `repo` 与当前项目的 `repo` 是否完全一致。如果不一致，说明该 `id` 已被其他业务抢占，必须**立即中止操作**，并向用户抛出红色警告：“致命错误：项目 ID 冲突！该标识已被其他仓库占用，请修改 project.json 中的 id”。
- 校验通过后，**必须先清空**目标目录 `temp_docs_repo/docs/<id>/` 下的所有旧文件，然后再将当前业务项目文档目录下的所有文件复制进去。
- **【强制红线】单项目边界**：同步过程只允许删除、复制、修改 `temp_docs_repo/docs/<id>/` 这一棵目录；不得读取其它 `docs/<other-id>/` 目录内容，不得清理其它项目，不得修改主仓库路由配置。框架会在服务器构建阶段自动扫描项目并生成首页与探索页。

### 3.5 构建兼容性预检 (Build Safety Check)
- AI 在同步前必须扫描 Markdown/MDX 代码块语言标记，避免使用 Rspress/Shiki 不支持的语言导致整个文档站构建失败。
- 不确定是否被支持的语言必须降级为 `txt`；例如 ` ```hex `、` ```plaintext `、` ```cmd ` 等应改为 ` ```txt `、` ```txt `、` ```bash ` 或其它确定支持的语言。
- 如果页面同步后线上没有更新，AI 必须按链路排查：主仓库是否收到提交、服务器自动任务是否拉取、`npm run build:doc` 是否成功、构建产物是否覆盖发布；优先检查构建失败日志，不能反复重复上传同一批文件。

### 4. 提交并推送到主仓库
- 进入 `temp_docs_repo` 目录内，自动执行 Git 提交流程：
  ```bash
  git add docs/<project-id>/
  git commit -m "docs: 自动同步 <子项目名> 项目文档"
  git push origin main
  ```
- **【强制红线】提交范围校验**：提交前必须执行差异检查，只允许本次提交包含 `docs/<project-id>/` 下的文件变更；如果发现其它路径变更，必须中止并回滚这些无关变更。
- **并发推送处理**：如果 `git push` 因 `non-fast-forward` 失败，说明有其它项目刚刚先推送成功。AI 必须自动执行 `git fetch origin main`、`git rebase origin/main`，确认差异仍只包含 `docs/<project-id>/` 后再次 push。不同项目并发同步应通过 rebase 自动合并，不应让用户手动处理。
- **同项目覆盖规则**：如果多人同时同步同一个 `project-id`，镜像同步以最后一次成功推送为准。AI 必须在反馈中明确这是同项目业务层覆盖，不属于跨项目误覆盖。
  *(注：遵循用户的核心习惯，执行 git push 时直接全自动执行，无需询问确认)*

### 5. 自动发布触发与结果反馈
- 推送成功后，删除临时克隆的 `temp_docs_repo` 目录。
- 文档主仓库部署了服务器端自动更新任务，任务会定时检查 `origin/main` 是否出现新提交。一旦发现新提交，会自动执行 `npm install --include=dev --registry=https://registry.npmmirror.com`、`npm run build:doc`，并把 `build_doc/` 覆盖发布到 `doc.rry.net` 的公开目录。
- AI 必须明确告知用户：“文档已成功推送到文档中心主仓库。服务器端自动更新任务会检测本次提交并自动构建发布，正常情况下 1-2 分钟后页面生效。”
- 如果用户反馈页面未更新，AI 应优先检查主仓库是否收到提交、`docs/components/projects.json` 是否包含项目、线上页面是否仍是旧构建，以及服务器自动更新日志，而不是让用户手动重新配置。

## 核心规则与红线
- **完全自动化**：必须代用户执行克隆、复制、提交和推送的所有操作。
- **最低版本实时校验**：每次使用技能必须读取主仓库 `sync-policy.json` 校验 `min_skill_version`；清空目录、提交、push 前必须重新 fetch 并二次校验，不能依赖外网最新版检查替代最低版本熔断。
- **单项目最小化同步**：单项目同步只允许拉取、校验、清空、复制、提交 `docs/<project-id>/`，不得操作其它项目目录；禁止使用 `git add docs/` 这类全目录提交。
- **扁平项目目录**：任何项目都必须同步到 `docs/<project-id>/`，项目内部目录和侧边栏由项目自身 `_meta.json` 管理，主框架只扫描项目并生成首页/探索页索引。
- **自动发布闭环**：项目同步后只需要 `git push` 到主仓库，后续由文档站服务器自动拉取、构建和发布；严禁依赖人工每次重新配置或手动上传才能生效。
- **构建安全**：同步前必须保证 Markdown 代码块语言、UTF-8 编码、项目首页和 `_meta.json` 都不会导致主站构建失败；构建失败会阻塞所有项目页面更新。

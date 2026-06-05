# 奕柏科技 (PEAIOT) 静态企业官网 - AI 上下文交接文档

> **致接手的 AI 助手：**
> 当你看到这份文档时，说明这是一个跨窗口/跨会话的项目交接。请仔细阅读以下所有架构设计、历史踩坑记录以及**最高优先级的核心规则**。在充分理解本文件内容之前，请勿对项目代码进行任何修改。

## 1. 项目基本信息
* **项目名称：** 奕柏科技企业文档中心 / 官方静态网站
* **关联品牌：** 奕柏科技、豌豆易联 (PEAIOT)
* **业务核心：** IDC机房建设与运维、一站式智能工程与信息化解决方案
* **部署目标：** 宝塔 A6 面板 (`peaiot.cn` 及 `doc.rry.net` 等纯静态站点)

## 2. 技术栈与架构
* **核心框架：** [Rspress](https://rspress.dev/) (字节跳动开源的基于 Rust 的极速静态站点生成器 SSG)
* **UI 框架：** React + TailwindCSS
* **架构哲学 (Jamstack)：** 纯静态、无数据库、无后端 API。所有页面在 `npm run build` 时预渲染为 HTML，保证极致的访问速度和物理级别的防黑客安全。

## 3. 🔴 最高优先级核心规则 (TRAE CORE RULES)

**在本项目中进行任何开发时，必须严格遵守以下红线规则：**

### 规则一：绝对的本地化原则 (禁止使用任何第三方外部服务)
* **严禁**使用外部图床、外部 CDN（如 Unsplash、Vercel 等）。
* **严禁**将 AI 文生图的异步接口（如 `text_to_image`）直接挂载到 `<img src="..."/>` 上。
* **正确做法：** 所有图片、字体、Icon、视频等静态资源，**必须**真实下载到本地的 `docs/public/` 目录中，然后在代码中使用根路径引用（例如：`<img src="/idc_hero_new.jpg" />`）。

### 规则二：执行操作优先原则
* 用户明确偏好：凡是可以直接通过脚本或工具代为执行的操作（如编译、打包、通过宝塔 API 上传部署、运行网络测试脚本），**必须由 AI 直接全自动执行**，只给用户反馈最终结果，绝不要只给一堆命令让用户手动复制粘贴。

## 4. 历史踩坑与魔改记录 (非常重要)

为了实现定制化的企业官网外观，我们对 Rspress 进行了深度魔改。在后续开发中请注意避开以下深坑：

### 4.1 Rspress 官方导航栏冲突问题
* **问题：** Rspress 默认会强制渲染一个带有搜索框的导航栏，这与我们定制的纯净企业官网 UI 严重冲突，且层级过高会导致菜单点击失效。
* **解决机制：** 
  1. 页面 Frontmatter 中必须设置 `navbar: false`。
  2. 在 `theme/index.css` 中注入了强制隐藏代码：`.rspress-nav { display: none !important; }`。
* **注意：** 项目目前使用了自定义的 `<Navbar />` 组件（位于 `src/components/` 下），请不要再尝试调用 Rspress 官方的导航配置。

### 4.2 锚点平滑滚动失效问题
* **问题：** 在单页应用中，使用 `<a href="#services">` 会被 Rspress 底层的 React Router 拦截，导致无法平滑滚动到指定区域。
* **解决机制：** 自定义导航栏中的菜单全部改用了 `<button>` 标签，并绑定了原生的 `window.scrollTo` / `scrollIntoView` 事件来实现跳转。
* **注意：** 为了防止 button 出现系统默认的灰色背景，必须加上 Tailwind 的 `bg-transparent border-none outline-none` 样式。

## 5. 自动化部署机制 (宝塔 API)

项目根目录下包含 `deploy_to_bt.js` 部署脚本。
* **原理：** 调用宝塔面板接口自动化完成部署。
* **鉴权算法：** 宝塔最新的安全哈希算法为 `md5(timestamp + md5(API_KEY))`。
* **部署流程：** 
  1. `npm run build` 生成 `doc_build` 目录。
  2. 压缩为 `build.zip`。
  3. 通过宝塔 API `UploadFile` 上传并解压覆盖到服务器网站根目录。
* **注意：** 在向宝塔写入新文件（如 `auto_update.sh`）时，如果报“文件不存在”，需要先调用 `CreateFile` API 创建空文件再调用 `SaveFileBody`。

## 6. 常用命令指令
* 本地开发：`npm run dev`
* 生产构建：`npm run build`
* 一键构建+打包+部署：
  ```powershell
  npm run build ; Compress-Archive -Path doc_build\* -DestinationPath build.zip -Force ; node deploy_to_bt.js
  ```

---
**接手的 AI 助手，阅读完本文件后，请回复：“已完全理解 PEAIOT 官网项目上下文及核心规则，准备好开始开发。” 并等待用户的下一步指令。**
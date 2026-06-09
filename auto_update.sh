#!/bin/bash
exec > /www/wwwroot/doc.rry.net/docs_factory/webhook.log 2>&1

# 宝塔 WebHook 自动拉取与编译部署脚本
# 用途：监听 GitHub 推送，自动编译文档并发布到隔离目录

echo "========================================================================="
echo "开始执行自动部署 WebHook 任务 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "Starting deployment at $(date)"
echo "========================================================================="

# 加载 Node.js 环境（如果使用了 nvm 或默认环境不在 path 中）
export PATH=$PATH:/usr/local/bin:/usr/bin:/usr/local/node/bin
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 1. 定义站点根目录变量
SITE_ROOT="/www/wwwroot/doc.rry.net"
SOURCE_DIR="${SITE_ROOT}/docs_factory"
PUBLIC_DIR="${SITE_ROOT}/public_html"

# 2. 检查源码目录是否存在
if [ ! -d "${SOURCE_DIR}" ]; then
  echo "错误: 源码目录 ${SOURCE_DIR} 不存在！请先在宝塔终端中手动 git clone 一次仓库代码到该目录。"
  exit 1
fi

# 3. 进入源码目录并拉取最新代码
echo ">>> 进入源码目录并拉取最新文档..."
cd ${SOURCE_DIR} || exit 1

# 强制放弃本地所有未提交的修改，确保与远程代码库一致
git reset --hard
git pull origin main

echo ">>> 代码拉取完成！"

# 4. 安装依赖并编译文档
echo ">>> 开始安装依赖 (npm install)..."
npm install

echo ">>> 开始编译文档 (npm run build) ..."
# 在根目录执行文档构建
npm run build:doc

# 5. 物理隔离部署：将编译产物移动到公开访问区
echo ">>> 开始将编译好的静态页面部署到 public_html 目录..."

# 确保 public_html 目录存在
mkdir -p ${PUBLIC_DIR}

# 将构建好的文件拷贝到公开访问区 (强制覆盖)
cp -r build_doc/* ${PUBLIC_DIR}/

echo "========================================================================="
echo "自动部署成功！网站内容已更新 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "Deployment finished at $(date)"
echo "========================================================================="

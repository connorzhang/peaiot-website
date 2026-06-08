#!/bin/bash
# 宝塔 WebHook 自动拉取与编译部署脚本
# 用途：监听 GitHub 推送，自动编译文档并发布到隔离目录

echo "========================================================================="
echo "开始执行自动部署 WebHook 任务 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "========================================================================="

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
# 进入专门的文档中心目录进行构建
cd chromatography-rspress-docs || exit 1
npm run build

# 5. 物理隔离部署：将编译产物移动到公开访问区
echo ">>> 开始将编译好的静态页面部署到 public_html 目录..."

# 确保 public_html 目录存在
mkdir -p ${PUBLIC_DIR}

# 清空旧的静态页面（排除可能存在的隐藏文件如 .user.ini）
find ${PUBLIC_DIR} -mindepth 1 -maxdepth 1 ! -name ".user.ini" -exec rm -rf {} +

# 将构建好的文件拷贝到公开访问区
cp -r ../build_doc/* ${PUBLIC_DIR}/

echo "========================================================================="
echo "自动部署成功！网站内容已更新 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "========================================================================="

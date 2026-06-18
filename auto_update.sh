#!/bin/bash
set -euo pipefail

SITE_ROOT="/www/wwwroot/doc.rry.net"
SOURCE_DIR="${SITE_ROOT}/docs_factory"
PUBLIC_DIR="${SITE_ROOT}/public_html"
LOG_FILE="${SITE_ROOT}/auto_update.log"
LOCK_FILE="${SITE_ROOT}/auto_update.lock"
LAST_FILE="${SOURCE_DIR}/.last_deployed_commit"

exec >> "${LOG_FILE}" 2>&1
exec 9>"${LOCK_FILE}"
flock -n 9 || exit 0

echo "========================================================================="
echo "自动部署检查开始 - $(date "+%Y-%m-%d %H:%M:%S")"

export HOME=/root
export PATH="/www/server/nodejs/v22.12.0/bin:/www/server/nodejs/v22.13.1/bin:/www/server/nodejs/v20.19.0/bin:/www/server/nodejs/v20.12.2/bin:/usr/local/node/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"

if [ ! -d "${SOURCE_DIR}/.git" ]; then
  echo "源码仓库不存在: ${SOURCE_DIR}"
  exit 1
fi

git config --global --add safe.directory "${SOURCE_DIR}" >/dev/null 2>&1 || true

cd "${SOURCE_DIR}"
git fetch origin main
REMOTE_COMMIT="$(git rev-parse origin/main)"
LAST_COMMIT=""
if [ -f "${LAST_FILE}" ]; then
  LAST_COMMIT="$(cat "${LAST_FILE}")"
fi

if [ "${REMOTE_COMMIT}" = "${LAST_COMMIT}" ]; then
  echo "没有新提交，跳过构建: ${REMOTE_COMMIT}"
  exit 0
fi

git reset --hard origin/main

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "开始安装依赖"
npm install --include=dev --registry=https://registry.npmmirror.com

echo "开始构建文档站"
npm run build:doc

mkdir -p "${PUBLIC_DIR}"
rm -rf "${PUBLIC_DIR:?}"/*
cp -r build_doc/* "${PUBLIC_DIR}/"
printf "%s" "${REMOTE_COMMIT}" > "${LAST_FILE}"

echo "自动部署成功: ${REMOTE_COMMIT}"
echo "完成时间 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "========================================================================="

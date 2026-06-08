# PEABSS APP 接口文档

## 说明
- Base URL: 按部署环境填写（示例使用 http://<host>:<port>）
- 认证方式:
  - 读接口大多放行（见 `service/portalserver/session_skip.json`）
  - 写入/敏感接口使用 JWT（从 `/app/login` 获取）
- Token 传递: `Authorization: Bearer <token>`
- 提交类型: `application/x-www-form-urlencoded`
- 返回格式: JSON；SSE 为 `text/event-stream`

### 目录
- 认证与注册
  - POST `/app/login`
  - POST `/app/register`
- 版本信息
  - GET `/app/ver`
- 设备相关
  - POST `/app/dev/list`
  - GET `/app/dev/add`
- 数据查询（v1/v2/v3）
  - GET `/app/data/rtd`
  - GET `/app/v2/data/rtd`
  - GET `/app/v2/data/md`
  - GET `/app/v2/data/hd`
  - GET `/app/v2/data/dd`
  - POST `/app/v3/rtd`
  - POST `/app/v3/rtdbymn`
- 实时推送（SSE）
  - GET `/app/hj212/dashboard/data/sse`

---

## 认证与注册

### 1) 登录
- 方法/路径: POST `/app/login`
- 入参（JSON）
```json
{ "username": "admin", "password": "admin123" }
```
- 成功响应
```json
{
  "username": "admin",
  "level": "master",
  "org_id": "ORG_ID",
  "Realname": "管理员",
  "token": "JWT_TOKEN_HERE"
}
```
- 失败响应（400）
```json
{ "msg": "用户名和密码不能为空" }
{ "msg": "用户不存在" }
{ "msg": "密码错误" }
```
- 示例（curl）
```bash
curl -X POST http://<host>:<port>/app/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2) 注册
- 方法/路径: POST `/app/register`
- 入参（form）
  - `username` string
  - `password` string
  - `password2` string
  - `vcode` string
- 成功
```json
{ "msg": "注册成功" }
```
- 失败（示例）
```json
{ "msg": "用户名已存在" }
{ "msg": "两次输入的密码不一致" }
{ "msg": "无效验证码" }
{ "msg": "密码必须为数字和字符组合" }
```

---

## 版本信息

### 3) 获取版本
- 方法/路径: GET `/app/ver`
- 响应
```json
{
  "APPID": "",
  "VERSION": "1.0.4",
  "STATUS": "0",
  "NOTES": "版本号:V1.0.4\\n\\n 1:更新数据显示\\n 2:全新界面",
  "URL": "http://down.16861.com/pea1.0.4.apk"
}
```

---

## 设备相关

### 4) 设备列表（需登录）
- 方法/路径: POST `/app/dev/list`
- 认证: Header `Authorization: Bearer <token>`
- 返回: 设备数组（按用户组织过滤），结构参考后端 `models.Device`
- 示例（curl）
```bash
curl -X POST http://<host>:<port>/app/dev/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5) 添加设备（需登录，写操作）
- 方法/路径: GET `/app/dev/add`
- 认证: Header `Authorization: Bearer <token>`
- 入参（query）
  - `mn` string（必填，后端从中派生 `imei` 与 `productClass`）
  - `version` string（可选）
  - `address` string（可选）
  - `remark` string（可选）
- 业务说明
  - `deviceType` 固定 `peaedge`
  - `OnDash` 设为 `1`
  - `name` 默认与 `mn` 相同
- 成功响应
```json
{ "success": "success" }
```
- 示例（curl）
```bash
curl "http://<host>:<port>/app/dev/add?mn=PEAxxxxxxxxx&version=1.0.0&address=A&remark=B" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 数据查询（放行读取）

> 放行规则详见 `service/portalserver/session_skip.json` 中的 `paths/prefixs`。

### 6) 实时数据（v1）
- 方法/路径: GET `/app/data/rtd`
- 常用入参（query）
  - `mn` string
- 返回: `[]map[string]string`（含 `DataTime`, `MN`, `Device` 及各因子键值）
- 示例（curl）
```bash
curl "http://<host>:<port>/app/data/rtd?mn=DEVICE_MN"
```

### 7) 实时数据（v2: rtd）
- 方法/路径: GET `/app/v2/data/rtd`
- 入参（query）
  - `mn` string（必填）
  - `size` int（可选，默认100）
- 返回: `[]map[string]interface{}`，将各因子 `(<Flag>)<值>` 扁平化，`DataTime` 转标准格式
- 示例响应
```json
[
  {
    "DataTime": "2024-08-19 12:34:56",
    "SomeField": "value",
    "a34005": "(N)12.3",
    "a34001": "(N)4.56"
  }
]
```
- 示例（curl）
```bash
curl "http://<host>:<port>/app/v2/data/rtd?mn=DEVICE_MN&size=50"
```

### 8) 分视图数据（v2: md/hd/dd）
- 方法/路径
  - GET `/app/v2/data/md?mn=...`
  - GET `/app/v2/data/hd?mn=...`
  - GET `/app/v2/data/dd?mn=...`
- 入参: `mn` string（必填）
- 返回: 与 rtd 类似的扁平化结构（不同视图/粒度）
- 示例（curl）
```bash
curl "http://<host>:<port>/app/v2/data/md?mn=DEVICE_MN"
curl "http://<host>:<port>/app/v2/data/hd?mn=DEVICE_MN"
curl "http://<host>:<port>/app/v2/data/dd?mn=DEVICE_MN"
```

---

## 实时推送（SSE，需登录）

### 9) 设备汇总实时数据（v3，需登录）
- 方法/路径: POST `/app/v3/rtd`
- 认证: Header `Authorization: Bearer <token>`
- 逻辑:
  1) 解析 Token 获取当前用户组织设备列表（同 `/app/dev/list`）
  2) 对每个设备的 `MN` 按 `/portal/hj212/rtddata/query`（ES 逻辑）方式取最新一条数据
  3) 合并为数组返回
- 返回: `[]map[string]string`，每个元素为某设备最新数据，含 `DataTime`, `MN`, `Device` 及各因子
- 示例（curl）
```bash
curl -X POST http://<host>:<port>/app/v3/rtd \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10) 按MN查询设备实时数据（v3，需登录）
- 方法/路径: POST `/app/v3/rtdbymn`
- 认证: Header `Authorization: Bearer <token>`
- 逻辑: 根据指定MN号查询该设备的实时数据
- 请求体（JSON）:
```json
{
  "mn": "PEA780303861959066842845",
  "from": 0,
  "size": 100
}
```
- 参数说明:
  - `mn` (必需): 设备MN号
  - `from` (可选): 分页起始位置，默认0
  - `size` (可选): 返回数据条数，默认100条
- 返回: `[]map[string]interface{}`，每个元素为一条数据记录，含 `DataTime`, `MN` 及各因子
- 示例（curl）
```bash
# 获取前100条数据
curl -X POST http://<host>:<port>/app/v3/rtdbymn \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mn":"PEA780303861959066842845","from":0,"size":100}'

# 获取第101-200条数据（分页）
curl -X POST http://<host>:<port>/app/v3/rtdbymn \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mn":"PEA780303861959066842845","from":100,"size":100}'
```

### 10) 看板数据 SSE
- 方法/路径: GET `/app/hj212/dashboard/data/sse`
- 认证: Header `Authorization: Bearer <token>`
- 响应类型: `text/event-stream`
- 推送数据示例
```json
[
  {
    "id": 1,
    "projectNumber": "#01",
    "projectName": "设备名称",
    "particle": "12.34",
    "smoke": "5.67",
    "alarmStatus": "正常",
    "faultStatus": "正常",
    "statusClass": "normal"
  }
]
```
- 示例（curl，长连接）
```bash
curl -N http://<host>:<port>/app/hj212/dashboard/data/sse \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- 认证失败（SSE 内返回）
```
data: {"error": "认证失败", "message": "token无效或解析失败"}
```

---

## 常见问题（FAQ）

- 访问被重定向到 `/login?errmsg=用户未登录或登录过期`
  - 触发了 portal 端 session 拦截；APP 接口已在 `session_skip.json` 放行。
  - 确认访问路径以 `/app/` 开头；SSE/写操作需要携带 Token。

- CORS
  - 登录接口已设置 CORS 头；其他接口如需跨域，请在前端使用 `mode: cors` 并确保服务端允许。

- Token 有效期
  - 由后端签发策略决定（当前一年）；到期需重新登录获取。

- 安全提示
  - `/app/dev/add` 属写操作，请在受信任环境使用并校验参数。



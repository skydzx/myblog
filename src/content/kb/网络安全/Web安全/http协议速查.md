---
title: HTTP 协议速查
date: 2026-08-04
tags: [Web安全, HTTP, 请求头, 响应头, 状态码, 方法]
summary: HTTP 请求/响应头、状态码、HTTP 方法速查，含安全相关响应头。
---

> 个人 Web 基础笔记整理。

## 1. 请求头（Request Headers）

```text
Accept            接受什么介质类型（*/* 任何，type/* 子类型，type/sub-type 特定）
Accept-Charset    接收的字符集
Accept-Encoding   接收的编码/压缩方法（gzip, deflate）
Accept-Language   接收的语言
Accept-Ranges     是否接受分段请求（bytes / none）
Authorization     身份验证信息
Cache-Control     缓存控制（no-cache / max-age）
Connection        连接管理（close / keep-alive）
Host              目标域名/IP和端口
If-Match          对象的 ETag 未变则执行
If-Modified-Since 对象在该时间后修改则执行（否则 304）
If-None-Match     ETag 改变则执行
If-Range          对象未变返回缺失部分
If-Unmodified-Since 该时间后没修改则执行
Pragma            Pragma: no-cache（等价 Cache-Control: no-cache）
Proxy-Authorization  代理身份验证
Range             取对象的哪部分
Referer           来源网页
User-Agent        浏览器身份
```

## 2. 响应头（Response Headers）

```text
Age               缓存实体存在时间
Cache-Control     public/private/no-cache/no-store/max-age
Connection        close / keep-alive
Content-Encoding  压缩方法（gzip, deflate）
Content-Language  语言
Content-Length    长度
Content-Range     部分对象位置
Content-Type      对象类型（application/xml 等）
Date              发送时间
ETag              对象标志值（判断是否改变）
Expires           过期时间
Last-Modified     最后修改时间
Location          对象已被移到的位置
Pragma            HTTP/1.0 缓存控制
Proxy-Authenticate 代理身份验证要求
Refresh           多长时间刷新/重定向
Retry-After       何时可重试
Server            软件名称和版本
Transfer-Encoding 编码方式（chunked 分块）
Vary              缓存条件
```

### 安全响应头

```text
X-Frame-Options           控制是否可在 frame/iframe 中展示（防点击劫持）
X-XSS-Protection          启用 IE 的 XSS 过滤
X-Content-Type-Options    防 MIME 类型嗅探（nosniff）
Strict-Transport-Security (HSTS)  强制 HTTPS
Content-Security-Policy   (CSP)   减少 XSS（指定可加载资源）
```

## 3. 状态码

```text
1xx 信息性
  100 请求处理中

2xx 成功
  200 OK
  204 No Content
  206 Partial Content（范围请求）

3xx 重定向
  301 永久移动
  302 临时移动
  303 See Other（GET 定向获取）
  304 Not Modified（用缓存）
  307 临时重定向（不把 POST 变 GET）

4xx 客户端错误
  400 Bad Request（语法错误）
  401 Unauthorized（需认证）
  403 Forbidden（拒绝访问）
  404 Not Found

5xx 服务器错误
  500 Internal Server Error
  501 Not Implemented
  502 Bad Gateway（上游无效响应）
  503 Service Unavailable（超载/维护）
  504 Gateway Timeout（上游超时）
  505 HTTP Version Not Supported
```

## 4. HTTP 方法

```text
GET      获取资源（幂等，参数在 URL）
POST     提交数据（非幂等，数据在请求体）
PUT      上传/完全替换资源
DELETE   删除资源
PATCH    部分更新
HEAD     同 GET 但不返回消息体（查元数据）
OPTIONS  描述资源通信选项（探测支持的方法）
CONNECT  建立 TCP/IP 隧道（HTTPS 代理）
TRACE    回显请求消息（测试/诊断，存在安全风险应禁用）
```

---

> **一句话总结**：HTTP 头带请求/响应元信息，状态码分 1-5xx 大类，方法分读写删改。安全上注意 `Server` 头暴露版本、`TRACE` 反射、以及用安全响应头（HSTS/CSP/X-Frame-Options）加固。

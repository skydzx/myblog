---
title: Linux 常用命令速查
date: 2026-07-18
tags: [linux, 运维, 命令行]
summary: 安全/运维常用命令集合，持续更新。
---

## 网络诊断

```bash
# 查看监听端口
ss -tlnp

# 查看所有连接（含进程）
ss -tanp

# 抓包
tcpdump -i eth0 -nn port 443

# DNS 查询
dig +short A example.com
```

## 文件查找

```bash
# 按名查找
find / -name "*.conf" 2>/dev/null

# 查找含某字符串的文件
grep -r "password" /etc/ 2>/dev/null

# 最近修改的文件
find . -mtime -1 -type f
```

## 用户与权限

```bash
# 查看当前用户 id
id

# 查看 sudo 权限
sudo -l

# 查找 SUID 文件
find / -perm -4000 -type f 2>/dev/null
```

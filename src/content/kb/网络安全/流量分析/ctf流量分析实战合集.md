---
title: CTF 流量分析实战合集
date: 2026-08-04
tags: [CTF, 流量分析, pcap, 蚁剑, RSA, SMB, NTLM, hashcat]
summary: CTF 流量分析（pcap）实战技巧合集：协议分级、蚁剑流量识别与解密、FTP/RSA、SMB/NTLM hashcat 爆破、webshell 定位。
---

> 个人 CTF 流量分析作业合集整理。核心方法论：**协议分级找异常 → 过滤关键字 → TCP 流跟踪 → 定位数据/导出对象**。

## 0. 通用方法论

```text
1. 协议分级（Statistics → Protocol Hierarchy）：占比少的协议往往有问题
2. 关键字过滤：http contains "xxx" / tcp contains "xxx"
3. TCP 流跟踪（Follow TCP Stream）：看完整交互
4. 导出 HTTP 对象（File → Export Objects → HTTP）：拿文件
5. 可疑文件用 010 Editor / binwalk / CyberChef 分析
```

---

## 1. 蚁剑（AntSword）流量识别与解密

蚁剑是常见的一句话木马连接工具，流量特征明显：

```text
识别特征：
- User-Agent 含蚁剑特征
- 请求体大量 `%` 编码（URL 加密）
- 分隔符、等号，但不是 base64（可能是公钥加密）
```

解密流程（以 Ant 流量分析为例）：

```text
1. 过滤 http，跟踪 TCP 流
2. 由 User-Agent 判断是蚁剑流量
3. 看见 % → URL 解密
4. 有大量分隔符/等号 → 可能公钥加密（RSA）
5. 在 POST 包返回值中找 publickey
6. 手搓公钥：base64 解密 → 转 16 进制 → 公钥加密分隔符是 `02 81`，加密指数 `02 03`，私钥加密 `02 82`
7. 或用 Python 脚本解出公钥，按 RSA 公式推导 flag
```

Domainhacker 变体：

```text
1. http 过滤 + tcp 流跟踪，`ini_set` 一眼蚁剑
2. 复制选中区域到 CyberChef URL 解码
3. 解码后重点看执行了什么命令（常见：先截取字符串，再 base64，前两位是混淆）
4. 导出 HTTP 对象，找到 .rar，用解出的密码解开，找 hash 值（NTLM 即 flag）
```

## 2. 文件伪装识别（010 / binwalk）

```text
例：Capture.pcapng
1. TCP 跟踪，原始数据保存
2. 压缩包打开发现 flag.zip 但无法解压（提示"并非压缩包文件"）
3. 010 打开 → 发现其实是 PNG 图像
4. 改后缀 .png → 得到 flag
```

工具：`binwalk`（分离）、010 Editor（看文件头）、`zsteg`（PNG 隐写）。

## 3. FTP 数据导出 + RSA 解密（数据分析）

```text
1. 协议分级发现 FTP Data 占比小 → 导出对象
2. 发现加密文件 + 私钥
3. 私钥 base64 解码转 16 进制：
   - 私钥标识 `02 82`，公钥标识 `02 81`，公钥指数 `02 03`
4. RSA 参数：n = p×q（模数）、e（公钥指数，常 65537）、d（私钥指数）、p/q（素数因子）、dp/dq/d_inv（加速参数）
5. 手搓或写 Python 脚本解出密文 → flag
```

## 4. SMB2 / NTLMSSP 哈希爆破（hashcat）

CTF 里 SMB2 流量常见，解题套路固定：

```text
SMB2 下有 Data → 过滤 ntlmssp
提取 4 个字段拼 hash：
  username :: domain : ServerChallenge : NTproofstring : modifiedntlmv2response
拼出格式：
  username::domain:ServerChallenge:NTproofstring:modifiedntlmv2response
```

hashcat 爆破：

```bash
# 存成 password:hash 或指定 -m
hashcat -m <mode> -a <attack> hash.txt wordlist.txt
# 掩码：?u 大写 ?l 小写 ?d 数字，密码长度 6-8 位可试
# ?u?l?d?d?d?d → ?u?l?l?d?d?d ...
```

附加技巧：

```text
- 密码格式在题目里常给提示（如 "haticehatice12580"）
- 导出 SMB 对象拿文件（zip/图片），用 ARCHPR 掩码爆破 zip 密码
- 导出后发现加密 → 结合已知密码解压
```

## 5. 综合流量分析（流浪分析·11问）

完整攻防流量题的通用思路（HTTP 过滤器为主）：

```text
1. 找扫描器：http contains "acunetix"（可溯源黑客 IP）
2. 找登录后台：http.request.method=="POST" 追踪 login
3. 找登录凭据：POST && http contains "rec=login" && ip.src==黑客IP
4. 找 webshell：images 目录下出现 .php 很可疑 → tcp contains "<?php @eval"
   （一句话木马特征：eval 函数 + base64 加密内容 + 传递值）
5. robots.txt 中的 flag：过滤 http contains "robots.txt" 追踪流
6. 找数据库密码：http.response.code==200 && http contains "database"
7. 找数据库内容：mysql contains "hash_code" && ip.src==数据库IP
8. 账号爆破结果：tcp contains "账号@test.com"（MD5 解码）
9. 网卡配置：tcp contains "eth0"（外网/内网 IP）
10. 邮件系统登录：POST && http contains "mail"，返回 200 数据中找 AES 加密函数与密钥
    （CryptoJS AES CBC、密钥/IV 字符串 → 用在线工具解）
11. VPN IP：统计 → IPv4 对话，排除 SMB 服务器，PING 关系判断黑客 IP
```

## 6. 流量提取压缩包并解析

```text
1. 协议分级，找占比少的数据
2. 导出对象，得到压缩包/加密文件
3. 结合其他线索（密码提示/hash）解压
```

---

> **一句话总结**：流量分析题 = 协议分级找异常 + 关键字过滤缩小范围 + 追踪流看细节 + 导出对象拿文件。蚁剑流量认 User-Agent 和 URL 编码，SMB 流量认 NTLM 四字段拼 hash，RSA 流量认 `02 81/02 82/02 03` 标识。

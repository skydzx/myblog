---
title: 内存取证 Volatility 实战
date: 2026-08-04
tags: [CTF, 内存取证, Volatility, raw, 取证, netscan, pslist]
summary: Volatility 内存取证实战：imageinfo 判断系统、netscan 找网络连接、pslist+memdump 提取进程、mspaint 屏幕内容恢复、Passware 取密码。
---

> 个人 CTF 内存取证作业整理（MemoryLife.raw 案例）。

## 1. 常用工具

| 工具 | 作用 |
|------|------|
| **Volatility** | 开源内存取证框架，支持多种系统/内存格式，提取进程、网络、文件等 |
| **FTK Imager** | 磁盘取证为主，也支持创建/分析内存映像 |
| **Rekall** | 类似 Volatility 的开源内存分析工具 |
| **Passware Kit Forensic** | 从内存/磁盘提取并恢复密码 |
| **010 Editor / GIMP** | 分析 dump 出的进程内存 / 图像 |

## 2. 核心命令流程

```bash
# ① 先看镜像信息（99% 的取证第一步），判断操作系统
volatility.exe -f MemoryLife.raw imageinfo
# → Win7SP1x64

# ② 带 profile 扫描网络连接（找黑客对外连接的 IP/端口）
volatility.exe -f MemoryLife.raw --profile=Win7SP1x64 netscan
# netscan 能提取：活跃连接、打开端口、本地/远程 IP

# ③ 列出进程（找目标进程 PID）
volatility.exe -f MemoryLife.raw --profile=Win7SP1x64 pslist

# ④ 提取指定进程内存映像
volatility.exe -f MemoryLife.raw --profile=Win7SP1x64 memdump -p <PID> -D .
# 或 procdump（某些场景）
```

## 3. 案例：黑客工具对外连接（nc.exe）

```text
1. netscan 结果中注意 nc.exe（Netcat）
2. 发现 nc.exe 连接到 192.168.233.1:54266
   怀疑点：
   - nc 常被黑客用于反弹 Shell / 传数据 / 绕过防火墙
   - 高端口 54266 不用于标准服务
   - 内部 IP 却走非常规端口 = 隐蔽通信嫌疑
3. 提交格式 IP_PORT → flag{192.168.233.1_54266}
```

## 4. 案例：用户开机密码

```text
方法一（麻烦）：分析内存提取密码哈希（多为 MD5），再自行破解
方法二（推荐）：Passware Kit Forensic → Memory Analysis → 加载 .raw
→ 直接给出明文密码 → flag{abc123456}
```

## 5. 案例：进程环境变量（LOGONSERVER）

```text
1. 题目问黑客工具的 LOGONSERVER 环境变量
2. 已知工具是 nc.exe（第3节）→ pslist 找 PID（3036）
3. memdump -p 3036 导出
4. 010 Editor 搜索 "LOGONSERVER"
5. 值格式是 UNC 路径：\xxx-PC → flag{\BGS-CHENYJ-PC}
```

## 6. 案例：屏幕内容恢复（mspaint.exe）

```text
1. 屏幕内容 → 找 mspaint.exe（画图程序），PID 4312
2. memdump -p 4312 导出
3. GIMP 打开报"未知文件类型" → 改后缀 .data 再打开
4. 多试调整 宽/高：宽度 576、高度 2350 → 显示 flag{gydk5sp}
```

## 7. 案例：文件修改时间

```text
在内存中搜索文件名（如 wps.ini），读出最后修改时间：
2023-09-19 03:31:27 UTC+0000
提交格式 YYYY-MM-DD_hh:mm:ss_+0000 → flag{2023-09-19_03:31:27_+0000}
```

---

## 8. TLCP 流量分析（SM2 公钥提取）

国密 TLCP 握手包中提取参数：

```text
1. ClientHello 提取客户端随机数（32字节hex）
2. ServerHello 提取服务端随机数 + 协商密码套件
3. 提取服务端签名证书公钥（双证书体系：签名证书 + 加密证书）
4. 手搓 SM2 公钥：
   - "04||X||Y" 是 SM2 公钥非压缩表示
   - 签名头 30 45（30=String型, 45=长度），四种模式 00/01/10/11
   - X = 02 21 00 b8b4f96c...（32字节）
   - Y = 02 20 294db4ed...（32字节）
   - 公钥 = 04 + X + Y
5. 预主密钥：提取签名值
```

---

> **一句话总结**：内存取证固定套路 = `imageinfo` 判断系统 → `pslist`/`netscan` 找目标 → `memdump` 导出进程内存 → 010/GIMP 分析。工具进程（nc/mspaint）往往是出题点。

---

## 📸 原文截图

### CTF-内存取证-tlcp流量分析-23092730105-董智雄

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 1](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/01.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 2](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/02.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 3](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/03.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 4](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/04.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 5](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/05.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 6](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/06.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 7](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/07.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 8](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/08.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 9](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/09.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 10](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/10.jpeg)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 11](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/11.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 12](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/12.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 13](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/13.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 14](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/14.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 15](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/15.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 16](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/16.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 17](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/17.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 18](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/18.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 19](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/19.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 20](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/20.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 21](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/21.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 22](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/22.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 23](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/23.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 24](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/24.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 25](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/25.png)

![CTF-内存取证-tlcp流量分析-23092730105-董智雄 26](/images/kb/网络安全/流量分析/内存取证volatility实战/CTF-内存取证-tlcp流量分析-23092730105-董智雄/26.png)


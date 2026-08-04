---
title: BurpSuite 暴力破解
date: 2026-08-04
tags: [暴力破解, BurpSuite, Intruder, Web安全, 渗透测试]
summary: BurpSuite Intruder 四种爆破模式、带 token 验证的高等级爆破绕过、sleep 延迟对抗。
---

> 个人 DVWA 暴力破解作业整理（Brute Force 模块 LOW/MEDIUM/HIGH）。

## 1. 基础流程（LOW）

```text
1. username 盲猜 admin，密码随便填
2. BurpSuite 抓包，发送到 Intruder
3. 选择爆破变量（password），加载字典，Start Attack
4. 按 Length 排序，长度异常的即正确密码
```

## 2. Intruder 四种模式

| 模式 | 适用场景 | 特点 |
|------|---------|------|
| **Sniper（狙击手）** | 爆破单个变量 | 一次替换一个变量，其余固定 |
| **Battering ram（攻城锤）** | 多变量用同一字典 | 所有变量替换相同值 |
| **Pitchfork（音叉）** | 多变量各配字典 | 字典逐行对应，以最短的为准 |
| **Cluster bomb（集束炸弹）** | 多变量组合爆破 | 所有位置所有组合穷举 |

> 单字段爆破用 **Sniper**；多字段（用户名+密码）用 **Cluster bomb**。

## 3. MEDIUM：sleep 延迟对抗

```text
源码区别：登录失败后 sleep(2)（休眠2秒）
影响：延长爆破时间，但结果不受影响
对抗：调低线程数/超时，耐心等待；或确认是否可并发
```

## 4. HIGH：token 验证绕过

```text
源码区别：sleep(rand(0,3)) 随机休眠 + 每次登录需要 token
token 机制：服务端在表单中植入 token，提交时校验，爆破需带有效 token
```

绕过思路：

```text
1. 假设已知用户名 admin，只爆破密码（带 token）
2. 抓包分析 token 来源（藏在响应页面/JS 中）
3. 用 Intruder 的 Recursive Grep 或宏（Macros）自动提取最新 token
4. 每个请求先用上一响应中的 token 填充再提交
```

BurpSuite 高级用法：

```text
- 宏（Session Handling Rules → Macros）：自动登录获取 token
- Recursive Grep：从响应提取 token 用于下一个请求
- 并发 + 延迟控制：应对 sleep 限速
```

---

> **一句话总结**：爆破的核心是"字典 + 合适模式 + 处理动态 token"。低等级直接 Sniper 按长度找答案；高等级要靠宏/正则提取 token，把"动态验证"变成"可爆破"。

---

## 📸 原文截图

### Brute-Force

![Brute-Force 1](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/01.png)

![Brute-Force 2](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/02.png)

![Brute-Force 3](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/03.png)

![Brute-Force 4](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/04.png)

![Brute-Force 5](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/05.png)

![Brute-Force 6](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/06.png)

![Brute-Force 7](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/07.png)

![Brute-Force 8](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/08.png)

![Brute-Force 9](/images/kb/网络安全/渗透测试/burp暴力破解/Brute-Force/09.png)


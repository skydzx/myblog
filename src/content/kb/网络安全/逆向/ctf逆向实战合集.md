---
title: CTF 逆向实战合集
date: 2026-08-04
tags: [CTF, 逆向, XOR解密, 链表, Ghidra, 栈分析, 猜数字, PE]
summary: CTF 逆向实战：MingYue 链表异或、Game 灯泡 XOR 解密、Re0 猜数字、re1 strcmp 内存数据、Stack 栈分析、Notepad PE 结构。
---

> 个人 CTF 逆向作业合集整理。工具：IDA/Ghidra（F5 伪代码）、010 Editor、GDB。

## 0. 通用套路

```text
1. 找到 main 函数，F5 查看伪 C 代码
2. 定位加密/验证逻辑（链表、XOR、strcmp、随机数）
3. 找出加密数据 + 密钥数组
4. 写 Python 脚本还原 flag
```

## 1. MingYue.exe（链表 + XOR）

```text
分析：
1. main 分配 16 字节内存，赋给全局变量 qword_140004618（链表头）
2. sub_1400011E0 创建新节点并链接到链表（存输入字符）
3. sub_140001220 遍历链表，与预定义字符串 '..v4p$$!>Y59-' 匹配
4. 原文中有替换表 ')(*&^%489$!057@#><:2163qwe'
5. 关键运算 v7 ^ 7u（按位异或）
```

解密脚本：

```python
table = ")(*&^%489$!057@#><:2163qwe"
arr = "/..v4p$$!>Y59-"

def find(ch):
    for i, char in enumerate(table):
        if char == ch:
            return i

num = 0
offset = []
for i in range(14):
    num *= 26
    offset.append(find(chr(ord(arr[i]) ^ 7)))
    num += offset[i]

print(num)   # 2484524302484524302 → 输入对话框即 flag
```

> 套路：**链表存字符 + 替换表映射 + XOR 变换**，逆向时先还原替换表再逐位异或。

## 2. Game.exe（8 灯泡 + 双重 XOR）

```text
游戏规则：8 个灯泡，输入 n(1-8) 切换第 n 个及相邻 n-1/n+1 的状态，全亮得 flag
关键在 flag 生成函数 sub_457AB4 → sub_45E940：
- v5[56]：XOR 密钥数组
- v2[22] / v3[32]：加密后的 flag
- 解密：decrypted[i] = (encrypted[i] ^ v5[i]) ^ 0x13
```

```python
v5 = [18,64,98,5,2,4,6,3,6,48,49,65,32,12,48,65,
      31,78,62,32,49,32,1,57,96,3,21,9,4,62,3,5,
      4,1,2,3,44,65,78,32,16,97,54,16,44,52,32,64,
      89,45,32,65,15,34,18,16]

encrypted = ([ord(c) for c in "{ "] + [18,98,119,108,65,41,124,80,
      125,38,124,111,74,49,83,108,94,108,84,6] +
      list(bytes.fromhex("60532C79686E205F7565637B7F7760306B475C1D516B5A55400C2B4C560D7201")) +
      [0x75, 0x7E])

flag = bytes([(encrypted[i] ^ v5[i] ^ 0x13) for i in range(56)])
print(flag.split(b'\x00')[0].decode())
# zsctf{T9is_tOpic_1s_v5ry_int7resting_b6t_others_are_n0t}
```

## 3. Re0.exe（猜数字 + XOR）

```text
255 轮猜 0-10 随机数，全对触发 sub_401000 打印 flag
flag 生成：v2 前 22 字节，每字节 ^ 0x22
```

```python
encrypted = [ord(c) for c in "DNCEY"] + [19,19,68,27,21,18,71,67,27,22,19,23,20,19,16,20,95]
flag = ''.join(chr(b ^ 0x22) for b in encrypted)
print(flag)   # flag{11f970ea94156126}
```

## 4. re1.exe（strcmp 内存数据）

```text
1. v5 从 xmmword_413E34 加载 16 字节（加密 flag）
2. strcmp(v5, 用户输入) 校验
3. 点开 xmmword_413E34：3074656D30633165577B465443545544
   → ASCII 是 0tem0c1eW{FTCTUD，反过来就是 flag
```

```text
反转：DUTCTF{We1c0met0DUTCTF...}
```

> 套路：**strcmp 直接比内存常量**，双击内存数据看 ASCII，注意是否要反转。

## 5. Stack 分析（x86 栈帧）

```text
FUN_00401020 调用 entry() 并 printf，栈操作：
- 函数入口（Prologue）：push ebp（esp-=4）→ mov ebp, esp
- 局部变量：未显式 sub esp（优化到寄存器）
- 调用 entry：call 把返回地址压栈（esp-=4）
```

x86 栈帧结构（高→低地址）：

```text
高地址
  | 调用者栈帧       |
  | 参数2 (5)       | ← [ebp+12]
  | 参数1 (3)       | ← [ebp+8]
  | 返回地址        | ← [ebp+4]
  | 保存的 ebp      | ← 当前 ebp
  | 局部变量1 (x)   | ← [ebp-4]
  | 临时数据        | ← 当前 esp
低地址
```

> cdecl 调用约定：**从右向左入栈，调用者清理栈**。

## 6. Notepad.exe（PE 文件结构）

```text
文件头分析（010 Editor）：
- 4D 5A = MZ（DOS 头标识）
- DosHeader(0h,40h) → DosStub(40h,A8h) → NtHeader(F0h,108h)
- FileHeader：Machine=AMD64, NumberOfSections=7
- Section：.text(代码) .rdata(只读) .data(初始化数据) .pdata(异常)
  .rsrc(资源) .reloc(重定位)
- ImportDescriptor：依赖的 DLL（GDI32, USER32, CRT）
```

> 识别 PE：文件头 `4D 5A`（MZ），PE 头 `50 45`（PE）。节区 `.text/.data/.rdata/.bss` 各司其职。

---

> **一句话总结**：逆向题常见三类——① 输入变换（XOR/替换表）验证，② 游戏/交互逻辑控制 flag 触发，③ 直接 strcmp 内存常量。核心是**找到加密数据 + 密钥/变换规则，写脚本还原**。

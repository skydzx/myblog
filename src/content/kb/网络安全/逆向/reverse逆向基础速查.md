---
title: 逆向基础速查
date: 2026-08-04
tags: [逆向, 汇编, PE, ELF, 栈, 缓冲区溢出, 加壳脱壳, ROP, 固件]
summary: 逆向工程基础速查：可执行文件格式、寄存器、汇编指令、调用约定、内存分配、栈帧、缓冲区溢出、加壳脱壳、防护机制、ROP。
---

> 个人逆向课笔记整理。覆盖从文件格式到漏洞利用的完整知识链。

## 1. 可执行文件格式

| 平台 | 格式 | 说明 |
|------|------|------|
| Windows | PE（EXE/DLL/SYS） | DOS 头 `4D 5A`(MZ) → PE 头 `50 45` → 节区 |
| Linux/Unix | ELF | `.text` 代码 / `.data` 数据 / `.bss` 未初始化 / `.got`/`.plt` |
| Android | DEX / SO | Dalvik 字节码 / 原生库 |

PE 节区分工：`.text` 代码、`.rdata` 只读数据、`.data` 初始化数据、`.bss` 未初始化变量、`.rsrc` 资源、`.reloc` 重定位、`.pdata` 异常。

ELF 动态链接：`PLT`（过程连接表，延时加载）→ `GOT`（全局偏移表）→ 真实地址。

## 2. 寄存器

```text
通用寄存器（按位宽递增）：
  AX/EAX/RAX   累加器（运算）
  BX/EBX/RBX   地址计算/数据
  CX/ECX/RCX   循环计数/移位
  DX/EDX/RDX   I/O 操作

指针/基址：
  SP/ESP/RSP   栈顶指针
  BP/EBP/RBP   基址指针（访问局部变量/参数）
  IP/EIP/RIP   指令指针（指向下一条指令）

段寄存器：
  CS 代码段 / DS 数据段 / SS 栈段 / ES 扩展段

标志寄存器：
  OF 溢出 / SF 符号 / ZF 零 / CF 进位 / AF 辅助进位 / PF 奇偶 / DF 方向 / IF 中断
```

## 3. 汇编基础

```text
数据传送：MOV（赋值）、LEA（取偏移地址）、XCHG（交换）、PUSH/POP（压栈/出栈）
算术：ADD/SUB/INC/DEC/NEG（取负）
移位：SAL/SAR/SHL/SHR
逻辑：AND/OR/XOR/NOT
跳转：JMP（无条件）、CALL（调用）、RET（返回）
标志：CLD（清方向标志 DF=0）、STD（置 DF=1）
其他：NOP（90H 空操作）、INT/INTO（中断）、HLT（停机）

函数调用压栈顺序：从右向左
堆栈：先进后出（FILO），压栈压一个字长
```

示例：

```asm
MOV EAX, 27H        ; 赋值
MOV EAX, NEXT       ; 取地址
PUSH 0x1234
POP  EAX            ; 出栈到 EAX
```

## 4. 调用约定

| 约定 | 入栈方向 | 栈清理 | 传参方式 |
|------|---------|--------|---------|
| `__cdecl` | 从右向左 | 调用者 | 栈 |
| `__stdcall` | 从右向左 | 被调用者 | 栈 |
| `__fastcall` | 从右向左 | 被调用者 | 寄存器（RCX/RDX/R8/R9）+ 栈 |

## 5. 内存分配

```text
静态分配：编译时分配（全局/静态变量），整个程序生命周期存在
栈分配：函数调用时自动分配，返回自动释放（局部变量）
堆分配：运行时 malloc/calloc/realloc + free（手动管理）
共享内存：shmget/shmdt，多进程 IPC

C++ new/delete 对应 malloc/free
```

## 6. 栈帧结构（x86）

```text
高地址
  | 调用者栈帧       |
  | 参数2           | ← [ebp+12]
  | 参数1           | ← [ebp+8]
  | 返回地址        | ← [ebp+4]
  | 保存的 ebp      | ← 当前 ebp
  | 局部变量        | ← [ebp-4]
  | 临时数据/寄存器 | ← 当前 esp（低地址）
```

## 7. 缓冲区溢出与不安全函数

**高危函数**：`scanf`、`gets`、`strcpy`、`strcat`、`sprintf`、`memcpy`、`strlen`、`strncpy`。

```text
经典坑：scanf 看似限定 10 字符，但字符串输出自动补 \0，可越界覆盖返回地址
```

安全替代：`memcpy_s`、`strcpy_s` 等带长度参数版本。

## 8. 加壳与脱壳

```text
压缩壳（UPX）：文件变小；加密壳：文件变大
UPX 识别：pushad / popad 特征，upx.github.io 认版本
脱壳：先找到 OEP（原始入口点），dump 内存，修复导入表（IAT）
```

工具：UPX、PEiD、Detect-It-Easy、OllyDbg/x64dbg。

## 9. 防护机制（内存缓解）

```text
ASLR     地址随机化，随机化基址
NX bits  栈不可执行
Canary  栈保护（cookie，函数入口 xor 校验）
DEP      数据执行保护
GS       编译开关（栈 cookie）
Safe Unlinking  堆保护
TLS Callback    反反调试
```

GCC 加固编译：

```bash
gcc -Wl,-z,relro,-z,now -fstack-protector-strong -D_FORTIFY_SOURCE=2
```

## 10. ROP 利用

```text
1. 计算溢出点（padding 到返回地址）
2. 分析栈帧结构
3. 找 gadget（指令片段，如 pop rdi; ret），拼 ROP 链

变体：BROP（blind ROP）、SROP（sigreturn）
Seccomp 限制：禁止 system，只允许 open/read/write/exit
```

## 11. 固件分析

```bash
file tp_link.bin          # 看文件类型（固件常是 gzip 压缩的内核）
binwalk tp_link.bin       # 检测/分离文件系统（SquashFS 等）
gzip -d                   # 纯 gzip 直接解压
# 提取 SquashFS 后可 mount 查看文件系统
```

## 12. 调试技巧

```text
GDB / x64dbg / OllyDbg 断点、单步（F8/F9）
反调试对抗：IsDebuggerPresent、比较进程 MD5、时间差检测
花指令/垃圾代码：混淆真实逻辑，需要耐心 NOP 掉或脚本还原
```

---

> **一句话总结**：逆向从"识格式（PE/ELF）→ 认寄存器/汇编 → 懂调用约定/栈帧"起步，CTF 常见是"找加密逻辑（XOR/链表）写脚本还原"，漏洞利用则走向"溢出 + ROP + 绕过 ASLR/NX/Canary"。

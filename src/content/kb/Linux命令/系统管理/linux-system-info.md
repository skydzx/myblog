---
title: Linux 查看系统硬件信息
date: 2026-08-01
tags: [linux, 系统信息, dmidecode, cpuinfo, meminfo, 排查]
summary: 查看设备型号、操作系统版本、内核、硬盘、内存、CPU、进程内存的一站式速查。
---

## 查看设备型号

```bash
dmidecode -s system-product-name
# → R5210_G10  （服务器型号）
```

### dmidecode 报 command not found 的处理

1. **需要 root 账号登录**（`sudo -i` 或直接 root）
2. **需要安装 dmidecode 工具**
   ```bash
   yum install dmidecode        # CentOS/RHEL
   apt install dmidecode        # Debian/Ubuntu
   ```
3. **不想安装**：用 `whereis dmidecode` 找二进制位置（一般在 `/usr/sbin` 下），
   然后 `cd /usr/sbin && ./dmidecode -s system-product-name`
   > ⚠️ 手动执行必须加 `./` 前缀，否则 shell 找不到命令

---

## 查看操作系统版本

```bash
lsb_release -a                 # LSB 发行版信息（含版本号）
cat /etc/redhat-release        # CentOS/RHEL 专用
cat /etc/os-release            # 通用，较新系统都有
```

---

## 查看内核版本

```bash
cat /proc/version              # 内核版本 + 编译信息
uname -r                       # 只看内核版本号（如 4.18.0-348.el8.x86_64）
uname -a                       # 全部信息（含架构，x86_64 = 64 位）
```

> `uname -a` 里 `x86_64` = 64 位系统，`i686`/`i386` = 32 位

---

## 查看硬盘大小

```bash
lsblk                          # 树形结构，推荐（一眼看到所有盘和分区大小）
fdisk -l                       # 详细分区表（含扇区数，需 root）
df -h                          # 查看各挂载点的容量和使用率
```

---

## 查看内存大小

```bash
cat /proc/meminfo | grep MemTotal
# MemTotal: 32941268 kB        ← 除以 1024² ≈ 32G

free -h                        # 更友好的显示（含已用/缓存）
```

---

## 查看 CPU

```bash
# 物理 CPU 个数（有几个插槽）
cat /proc/cpuinfo | grep "physical id" | uniq | wc -l
# → 2

# 每颗 CPU 的核数
cat /proc/cpuinfo | grep "cpu cores" | uniq
# cpu cores : 4

# CPU 型号
cat /proc/cpuinfo | grep 'model name' | uniq
# model name : Intel(R) Xeon(R) CPU E5630 @ 2.53GHz
```

> 总结：该服务器有 **2 颗 4 核 CPU**，型号 Intel Xeon E5630 @ 2.53GHz
> （`uniq` 删除重复行，`wc -l` 统计行数）

---

## 查看进程 / JVM 内存

```bash
ps -ef | grep java
# root 9787 1 0 Sep17 ? 00:02:48 .../java -Xms50m -Xmx256m
```

- `-Xms` = JVM 分配的**最小堆内存**
- `-Xmx` = JVM 分配的**最大堆内存**

> 查看任意进程内存占用：`ps -o pid,rss,cmd -p <PID>`（RSS 是实际常驻内存）

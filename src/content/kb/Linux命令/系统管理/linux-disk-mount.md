---
title: Linux 磁盘分区与挂载
date: 2026-08-01
tags: [linux, 磁盘, mount, fstab, fdisk, 系统管理]
summary: 查看磁盘、分区格式化、mount 挂载卸载、/etc/fstab 开机自动挂载、常见挂载场景。
---

## 查看磁盘与分区

```bash
lsblk                # 树形结构（推荐）：盘名/大小/挂载点一目了然
fdisk -l             # 详细分区表（需 root）
blkid                # 查看分区 UUID 和文件系统类型
df -h                # 各挂载点容量和使用率
findmnt              # 查看所有挂载点及来源
```

---

## 分区与格式化

```bash
# 交互式分区（进入后：n 新建 → p 主分区 → w 写盘）
fdisk /dev/sdb

# 重新读取分区表（分区后不重启刷新）
partprobe /dev/sdb

# 格式化
mkfs.ext4 /dev/sdb1
mkfs.xfs  /dev/sdb1     # RHEL/CentOS 7+ 默认 xfs
mkfs.vfat /dev/sdb1     # 兼容 Windows 的 FAT32
```

---

## 挂载与卸载

```bash
mount /dev/sdb1 /mnt/data        # 挂载到目录
umount /mnt/data                 # 卸载（用挂载点）
umount /dev/sdb1                 # 卸载（用设备）
```

### 常用挂载选项

```bash
mount -o ro /dev/sdb1 /mnt/data      # 只读挂载
mount -o noexec /dev/sdb1 /mnt/data  # 禁止执行该分区上的程序（安全加固）
mount -o noatime /dev/sdb1 /mnt/data # 不更新访问时间（省 IO）
mount -o remount,rw /mnt/data        # 重新挂载为读写（修复只读文件系统）
```

### 特殊挂载场景

```bash
# 挂载 ISO 镜像
mount -o loop xxx.iso /mnt/iso

# 挂载 U 盘
mount /dev/sdb1 /mnt/usb

# 挂载网络共享（NFS）
mount -t nfs 192.168.1.10:/data /mnt/nfs
```

---

## 开机自动挂载（/etc/fstab）

```bash
# 先用 blkid 查 UUID
blkid /dev/sdb1
# → /dev/sdb1: UUID="a1b2c3d4-..." TYPE="ext4"

# 编辑 /etc/fstab，追加一行：
# UUID=xxx  挂载点  文件系统  选项  备份  检查
UUID=a1b2c3d4-...  /mnt/data  ext4  defaults  0  2

# 写完后立即验证（重要！fstab 写错会导致开机失败）
mount -a
```

> ⚠️ **fstab 写错 = 开机进不了系统**。写完一定先 `mount -a` 验证。
> 救援方法：开机进单用户模式，把 fstab 改回来。

---

## 新硬盘挂载完整流程

```bash
# 1. 查看新盘（比如 /dev/sdb）
lsblk

# 2. 分区
fdisk /dev/sdb        # n → p → w
partprobe /dev/sdb

# 3. 格式化
mkfs.ext4 /dev/sdb1

# 4. 创建挂载点并挂载
mkdir -p /mnt/data
mount /dev/sdb1 /mnt/data

# 5. 写入 fstab 实现开机自动挂载
blkid /dev/sdb1       # 记下 UUID
# 编辑 /etc/fstab 加一行（见上节）
mount -a              # 验证
```

---

## 常用场景速查

| 需求 | 命令 |
|------|------|
| 卸载时提示 device is busy | `fuser -km /mnt/data` 或 `lsof /mnt/data` 找占用进程 |
| 修复 read-only filesystem | `mount -o remount,rw /mnt/data` |
| 分区后不重启刷新 | `partprobe /dev/sdb` |
| 查看某个目录在哪个分区 | `df -h /dir` |
| 临时挂载用完就删 | 直接 `umount`，别写 fstab |
| 数据盘扩容 | `growpart` + `resize2fs`（ext4）或 `xfs_growfs`（xfs） |

---

## 相关：软链接速查

创建软链接的命令在 [Linux 文件与目录操作速查](/kb/Linux命令/系统管理/linux-file-operations/) 里：

```bash
ln -s /path/to/target link   # 创建软链接（快捷方式）
ls -l link                   # 查看指向
readlink link                # 只显示指向的路径
```

---
title: Linux 文件权限速查
date: 2026-08-01
tags: [linux, 权限, chmod, chown, umask, 系统管理]
summary: 权限基础、chmod、chown、umask、权限排查——文件权限完整速查。
---

## 权限基础概念

```
-rwxrwxrwx  1  user  group  4096  Aug 1 20:00  filename
│├─┤├─┤├─┤
│ │   │   └── 其他人(o)权限
│ │   └────── 所属组(g)权限
│ └────────── 所有者(u)权限
└──────────── 文件类型（- 文件 / d 目录 / l 链接）
```

| 权限 | 字母 | 数字 |
|------|------|------|
| 读 | r | 4 |
| 写 | w | 2 |
| 执行 | x | 1 |

例：`rwx = 7`，`rw- = 6`，`r-- = 4`

### 文件类型标识

| 符号 | 含义 |
|------|------|
| `-` | 普通文件 |
| `d` | 目录 |
| `l` | 符号链接 |
| `b` | 块设备 |
| `c` | 字符设备 |
| `s` | socket |
| `p` | 管道 |

---

## chmod（修改权限）

### 数字方式

```bash
chmod 777 file        # 所有人 读写执行
chmod 755 file        # 所有者rwx，其他人r-x
chmod 644 file        # 所有者rw-，其他人r--
chmod -R 777 /dir     # 递归修改整个目录
```

### 符号方式

```bash
chmod u+x file        # 给所有者加执行
chmod g+w file        # 给组加写
chmod o-r file        # 去掉其他人的读
chmod a+w file        # 所有人加写（a = all）
chmod -R o+rw /dir    # 递归给其他人加读写
```

### 特殊权限位

```bash
chmod g+s /dir        # SGID：新建文件继承父目录的组
chmod u+s file        # SUID：以文件所有者身份执行（如 /usr/bin/passwd）
chmod o+t /dir        # Sticky：只有文件所有者能删除（如 /tmp）
```

### ⚠️ 目录的 x 权限（常见坑）

```bash
chmod 644 /dir    # ❌ 目录没 x 就进不去，等于废了
chmod 755 /dir    # ✅ 目录至少要有 x 才能 cd 进入
```

> 目录：`r` = 能 ls 列表，`x` = 能 cd 进入，`w` = 能在里面创建/删除文件

---

## chown / chgrp（修改所有者和组）

```bash
chown user file              # 改所有者
chown user:group file        # 改所有者 + 组
chown :group file            # 只改组
chown -R user:group /dir     # 递归改整个目录

chgrp group file             # 改组
chgrp -R group /dir          # 递归改组
```

---

## umask（默认权限掩码）

```bash
umask            # 查看当前掩码（如 0022）
umask 0002       # 设置掩码（新建文件默认 664，目录 775）
```

> 新建文件权限 = 666 - umask
> 新建目录权限 = 777 - umask

永久生效：写入 `/etc/profile` 或 `~/.bashrc`

---

## 查看与排查权限

```bash
ls -la /path             # 查看文件权限
ls -ld /path             # 只看目录本身权限
stat file                # 详细信息（含数字权限）
namei -l /path/to/file   # 逐级检查路径每一层的权限（排查神器）
id                       # 当前用户 UID、GID、所属组
id username              # 查看指定用户
groups username          # 查看某用户的组

# 批量查找
find /dir -perm 777                  # 找出所有 777 的文件
find /dir ! -user www-data           # 找出不属于 www-data 的文件
find /dir -type f ! -perm 644        # 找出权限不是 644 的文件
```

---

## 常用场景速查（权限相关）

| 需求 | 命令 |
|------|------|
| 让所有人都能改整个目录 | `chmod -R 777 /dir` |
| 只让同组人能改 | `chgrp -R mygroup /dir && chmod -R g+w /dir` |
| 新建文件自动继承组权限 | `chmod g+s /dir` |
| 网站目录给 www 用户 | `chown -R www-data:www-data /var/www` |
| 脚本可执行 | `chmod +x script.sh` |
| 恢复安全权限 | `find /dir -type d -exec chmod 755 {} \;` + `find /dir -type f -exec chmod 644 {} \;` |
| 文件被锁 chmod 无效 | `lsattr file` → `chattr -i file` |
| 权限对但服务 403 | `restorecon -Rv /var/www`（SELinux） |

---

## 注意事项

- **目录必须有 `x` 权限**才能 `cd` 进入，光有 `r` 只能 `ls` 列表
- **删除文件**取决于**父目录**的写权限，不是文件本身的权限
- `777` 在生产环境是安全隐患，优先用 `组 + g+w` 或 `ACL` 方案
- `/etc/shadow` 权限必须是 `600`，否则系统拒绝登录
- 修改 `/etc`、`/usr` 等系统目录权限可能导致系统崩溃
- `chmod 777` 解决不了所有问题 → 检查 `chattr`、SELinux、ACL、文件系统是否只读（`mount | grep ro`）

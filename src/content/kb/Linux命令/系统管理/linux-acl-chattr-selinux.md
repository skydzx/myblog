---
title: ACL、chattr 与 SELinux
date: 2026-08-01
tags: [linux, ACL, chattr, SELinux, 权限]
summary: 比普通权限更精细的控制——ACL 访问控制列表、chattr 文件属性、SELinux 上下文，以及「chmod 777 无效」的排查思路。
---

## ACL（更精细的权限控制）

普通权限只能设 owner/group/other 三档，ACL 可以给任意用户/组单独授权。

```bash
# 查看 ACL
getfacl file

# 给用户 dzx 对某文件的读写权限
setfacl -m u:dzx:rw file

# 递归设置目录
setfacl -R -m u:dzx:rwx /dir

# 设置默认 ACL（新建文件自动继承）
setfacl -d -m u:dzx:rwx /dir

# 删除某条 ACL
setfacl -x u:dzx file

# 清除所有 ACL
setfacl -b file
```

---

## chattr 文件属性（比权限更"硬"的限制）

chmod 能改的权限 root 都能改，但 chattr 的属性 root 也不能随便动。

```bash
chattr +i file       # 锁定文件，root 也不能改/删
chattr -i file       # 解锁
chattr +a file       # 只能追加，不能修改/删除已有内容
chattr -a file       # 取消追加限制
lsattr file          # 查看属性
lsattr -R /dir       # 递归查看
```

> 很多人遇到 `Permission denied` 但 `chmod 777` 也没用，往往就是 `+i` 锁了。

---

## SELinux（CentOS/RHEL 系必踩的坑）

```bash
getenforce                          # 查看状态（Enforcing/Permissive/Disabled）
sestatus                            # 详细信息

ls -Z file                          # 查看安全上下文
ls -Zd /dir                         # 查看目录上下文

chcon -t httpd_sys_content_t file   # 改上下文
restorecon -Rv /var/www             # 恢复默认上下文（推荐）

# 临时关闭（重启恢复）
setenforce 0

# 永久关闭
sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
```

> 权限明明 777 还是 403？大概率是 SELinux 上下文不对。

---

## 排查「chmod 777 无效」的完整思路

按顺序排查，从上到下最常见：

1. **文件属性**：`lsattr file` → 是否 `+i` / `+a` 锁了 → `chattr -i file` 解锁
2. **SELinux**：`getenforce` 是否 Enforcing → 上下文是否正确 → `restorecon -Rv` 修复
3. **ACL**：`getfacl file` → 是否有额外 ACL 条目冲突
4. **文件系统只读**：`mount | grep ro` → 是否以只读方式挂载
5. **父目录权限**：`namei -l /path/to/file` → 路径上每一层是否有 x 权限

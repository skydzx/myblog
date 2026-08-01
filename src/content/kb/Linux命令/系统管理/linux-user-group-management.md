---
title: Linux 用户与用户组管理
date: 2026-08-01
tags: [linux, 用户管理, useradd, usermod, sudo, 系统管理]
summary: 用户、密码、用户组、su/sudo 完整速查，含关键系统文件表和常见场景。
---

## 查看用户信息

```bash
whoami                    # 当前用户名
id                        # 当前用户 UID、GID、所属组
id username               # 查看指定用户
who                       # 当前登录的用户
w                         # 更详细的登录信息（含正在执行的命令）
last                      # 登录历史
lastlog                   # 每个用户最后一次登录
cat /etc/passwd           # 所有用户列表
cat /etc/shadow           # 密码哈希（需 root）
```

---

## 创建用户

```bash
useradd username                  # 创建用户（不建家目录）
useradd -m username               # 创建用户 + 家目录
useradd -m -s /bin/bash username  # 指定 shell
useradd -m -g group username      # 指定主组
useradd -m -G sudo,docker username # 指定附加组
useradd -u 1005 username          # 指定 UID
useradd -e 2026-12-31 username    # 设置过期时间

# Debian/Ubuntu 更友好的方式
adduser username                  # 交互式创建（自动建家目录、设密码）
```

---

## 修改用户

```bash
usermod -l newname oldname        # 改用户名
usermod -d /home/newdir username  # 改家目录
usermod -m -d /home/newdir username # 改家目录并迁移文件
usermod -s /bin/zsh username      # 改默认 shell
usermod -aG docker username       # 追加到附加组（-a 不能漏！）
usermod -g newgroup username      # 改主组
usermod -L username               # 锁定账户
usermod -U username               # 解锁账户
usermod -e "" username            # 取消过期时间
usermod -s /usr/sbin/nologin username  # 禁止登录
```

> ⚠️ `usermod -G` 不加 `-a` 会**覆盖**原有附加组，一定要用 `-aG`。

---

## 删除用户

```bash
userdel username              # 删除用户（保留家目录）
userdel -r username           # 删除用户 + 家目录 + 邮箱
```

---

## 密码管理

```bash
passwd                        # 修改当前用户密码
passwd username               # 修改指定用户密码（需 root）
passwd -l username            # 锁定密码（不能登录）
passwd -u username            # 解锁密码
passwd -d username            # 删除密码（免密登录，危险）
passwd -e username            # 强制下次登录改密码
passwd -S username            # 查看密码状态

# 非交互式设密码（脚本常用）
echo "username:password" | chpasswd
echo -e "newpass\nnewpass" | passwd username
```

### 密码过期策略

```bash
chage -l username             # 查看密码过期策略
chage -M 90 username          # 90 天后过期
chage -m 7 username           # 最少 7 天才能改
chage -W 14 username          # 过期前 14 天提醒
chage -E 2026-12-31 username  # 账户到期日
```

配置文件：`/etc/login.defs`、`/etc/pam.d/common-password`

---

## 用户组管理

### 查看组

```bash
groups                        # 当前用户所属组
groups username               # 指定用户的组
cat /etc/group                # 所有组列表
getent group groupname        # 查看组详情（含成员）
```

### 创建 / 删除组

```bash
groupadd groupname            # 创建组
groupadd -g 2001 groupname    # 指定 GID
groupdel groupname            # 删除组（不能是某用户的主组）
```

### 修改组

```bash
groupmod -n newname oldname   # 改组名
groupmod -g 2002 groupname    # 改 GID
```

### 组成员管理

```bash
gpasswd -a username groupname   # 把用户加入组
gpasswd -d username groupname   # 从组中移除用户
gpasswd -M user1,user2 groupname # 设置组成员（覆盖）
gpasswd groupname               # 设置组密码
newgrp groupname                # 临时切换当前有效组
```

---

## 切换用户与 sudo

```bash
su username                 # 切换用户（保留当前环境）
su - username               # 切换用户 + 加载完整环境（推荐）
sudo command                # 以 root 执行单条命令
sudo -i                     # 切换到 root shell
sudo -u user command        # 以指定用户执行
sudo -l                     # 查看当前用户有哪些 sudo 权限
```

### sudo 配置

```bash
visudo                      # 编辑 /etc/sudoers（必须用这个命令）

# 常用配置示例：
dzx ALL=(ALL) ALL                           # dzx 可 sudo 一切
dzx ALL=(ALL) NOPASSWD: ALL                 # 免密 sudo
dzx ALL=(ALL) NOPASSWD: /usr/bin/systemctl  # 只能免密执行 systemctl
%docker ALL=(ALL) NOPASSWD: /usr/bin/docker # docker 组免密执行 docker
```

---

## 关键系统文件

| 文件 | 内容 |
|------|------|
| `/etc/passwd` | 用户基本信息（用户名:UID:GID:家目录:shell） |
| `/etc/shadow` | 密码哈希 + 过期策略 |
| `/etc/group` | 组信息（组名:GID:成员列表） |
| `/etc/gshadow` | 组密码 |
| `/etc/sudoers` | sudo 权限配置 |
| `/etc/login.defs` | 全局登录策略（UID 范围、密码策略等） |
| `/etc/default/useradd` | useradd 默认参数 |
| `/etc/skel/` | 新用户家目录模板 |
| `/home/username/` | 用户家目录 |

---

## 常用场景速查（用户相关）

| 需求 | 命令 |
|------|------|
| 新建开发用户并加入 docker 组 | `useradd -m -s /bin/bash dev && usermod -aG docker dev && passwd dev` |
| 禁止用户 SSH 登录 | `usermod -s /usr/sbin/nologin username` |
| 临时锁定离职员工账户 | `usermod -L username && passwd -l username` |
| 查看谁有 sudo 权限 | `grep -E 'sudo|wheel' /etc/group` |
| 找出 UID=0 的账户（排查后门） | `awk -F: '$3==0' /etc/passwd` |
| 找出没有密码的账户 | `awk -F: '($2=="")' /etc/shadow` |
| 找出能登录的 shell 账户 | `grep -v nologin /etc/passwd | grep -v false` |
| 批量创建用户 | 写脚本循环 `useradd` + `chpasswd` |

---

## 注意事项

- `usermod -aG` 后用户需要**重新登录**才生效（或 `newgrp groupname`）
- 删除用户前先用 `find / -user username` 检查是否有遗留文件
- 生产环境不要直接编辑 `/etc/passwd`，用 `useradd/usermod` 命令
- `su -` 和 `su` 区别很大：前者加载 `.bashrc`/`.profile`，环境变量完全不同

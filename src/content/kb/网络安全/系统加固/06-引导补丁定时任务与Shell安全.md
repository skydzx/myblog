---
title: 引导、补丁、定时任务与 Shell 安全
date: 2026-08-04
tags: [安全基线, 系统加固, GRUB, 补丁, cron, TMOUT, LD_PRELOAD, Linux]
summary: GRUB 引导密码、单用户模式保护、软件包补丁管理、cron/at 权限控制、环境变量与 Shell 安全。
---

> 对应「Linux 安全基线加固手册」第 9-12 章。

## 1. GRUB 引导密码保护

防止攻击者通过物理接触进单用户模式绕过认证：

```bash
# 生成 GRUB2 密码哈希
grub2-mkpasswd-pbkdf2
# 输出: PBKDF2 hash of your password is grub.pbkdf2.sha512.10000.XXXXX...

# 写入 GRUB 配置
cat >> /etc/grub.d/01_users << 'EOF'
cat << EOFPASSWORD
set superusers="root"
password_pbkdf2 root grub.pbkdf2.sha512.10000.XXXXX
EOFPASSWORD
EOF

chmod 600 /etc/grub.d/01_users

# 重新生成 GRUB 配置
grub2-mkconfig -o /boot/grub2/grub.cfg          # BIOS
grub2-mkconfig -o /boot/efi/EFI/centos/grub.cfg  # UEFI

# 验证
grep "password_pbkdf2" /boot/grub2/grub.cfg
```

## 2. 单用户模式保护

```bash
# RHEL 7+ 由 GRUB 密码保护 rescue/emergency
grep sulogin /usr/lib/systemd/system/rescue.service
grep sulogin /usr/lib/systemd/system/emergency.service
# 期望包含: ExecStart=-/usr/lib/systemd/systemd-sulogin-shell rescue

# RHEL 6: 检查 /etc/sysconfig/init
grep SINGLE /etc/sysconfig/init     # 期望: SINGLE=/sbin/sulogin
```

## 3. /etc/securetty 限制 root 终端登录

```bash
# 最严格：清空文件（root 只能通过 su/sudo/ssh+密钥登录）
cp /etc/securetty /etc/securetty.bak
echo "# 禁止root直接终端登录" > /etc/securetty
chmod 600 /etc/securetty
```

## 4. 禁用 Ctrl+Alt+Del

```bash
# RHEL 7+
systemctl mask ctrl-alt-del.target

# RHEL 6
sed -i 's/^exec/#exec/' /etc/init/control-alt-delete.conf
```

---

## 5. 软件包最小化与源安全

```bash
# 检查已装包数量（最小化安装应较少）
rpm -qa | wc -l              # RHEL/CentOS
dpkg -l | wc -l              # Debian/Ubuntu

# 开发工具在生产环境不应有
rpm -qa | grep -iE "gcc|make|kernel-devel|perl-devel"
dpkg -l | grep -iE "gcc|make|linux-headers"

# 图形界面
systemctl get-default     # 期望 multi-user.target
systemctl set-default multi-user.target
```

软件源安全：

```bash
# 检查第三方源 / gpg 校验
grep gpgcheck /etc/yum.conf                    # 期望 gpgcheck=1
grep -r "gpgcheck" /etc/yum.repos.d/ | grep "=0"   # 不应存在
```

## 6. 补丁管理

```bash
# 检查可用更新
yum check-update                    # RHEL
apt list --upgradable               # Debian/Ubuntu

# 安全更新
yum updateinfo list security        # RHEL
yum update --security -y            # 应用安全更新

# 自动安全更新
# RHEL: yum-cron
yum install -y yum-cron
sed -i 's/update_cmd = default/update_cmd = security/' /etc/yum/yum-cron.conf
sed -i 's/apply_updates = no/apply_updates = yes/' /etc/yum/yum-cron.conf
systemctl enable --now yum-cron
# Ubuntu: unattended-upgrades
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 7. 包完整性校验

```bash
# RPM 完整性（S.5....T. 表示大小/MD5/时间被改）
rpm -Va 2>/dev/null | grep -v "^..5" | head -50
rpm -V coreutils openssh-server shadow-utils sudo

# Debian/Ubuntu
debsums -c 2>/dev/null | head -50     # apt install debsums
```

---

## 8. cron 权限控制

```bash
# cron 目录权限
stat -c "%a %U:%G %n" /etc/crontab /etc/cron.d/
chmod 600 /etc/crontab
chmod 700 /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly

# 白名单 / 黑名单
echo "root" > /etc/cron.allow
rm -f /etc/cron.deny
chmod 600 /etc/cron.allow

# 列出所有用户 crontab
for u in $(awk -F: '{print $1}' /etc/passwd); do
    crontab -l -u "$u" 2>/dev/null && echo "↑ 用户: $u"
done

# 检查危险命令
grep -rn "chmod 777\|wget\|curl.*|.*sh\|bash\|nc " \
  /etc/cron.d/ /etc/crontab /var/spool/cron/ 2>/dev/null
```

## 9. at 任务安全

```bash
systemctl status atd 2>/dev/null
echo "root" > /etc/at.allow
rm -f /etc/at.deny
chmod 600 /etc/at.allow
atq    # 查看队列
```

---

## 10. PATH 与环境变量安全

```bash
# 检查 PATH 是否含不安全路径
echo $PATH | tr ':' '\n' | grep -E "^\.$|^\.\./|^/tmp|^/var/tmp"

# 加固 PATH
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# 检查危险配置
grep -rn "chmod 777\|umask 000\|PATH.*\.\|LD_PRELOAD" \
  /etc/profile /etc/profile.d/ /etc/bashrc /etc/environment 2>/dev/null
```

## 11. TMOUT 超时自动注销

```bash
cat > /etc/profile.d/tmout.sh << 'EOF'
TMOUT=300
readonly TMOUT
export TMOUT
EOF
chmod 644 /etc/profile.d/tmout.sh
```

## 12. 用户 Shell 与历史安全

```bash
# 用户 shell 检查
awk -F: '{print $1" → "$7}' /etc/passwd | grep -v nologin | grep -v false

# .bashrc/.bash_profile 权限与危险命令
for d in /home/*/; do
    user=$(basename "$d")
    for f in .bashrc .bash_profile .profile; do
        [[ -f "${d}${f}" ]] || continue
        perms=$(stat -c "%a" "${d}${f}")
        [[ "$perms" != "644" && "$perms" != "600" ]] && \
          echo "⚠️ $user/$f 权限异常: $perms"
        grep -n "chmod 777\|LD_PRELOAD\|curl.*|.*sh" "${d}${f}" 2>/dev/null && \
          echo "🚨 $user/$f 存在危险命令"
    done
done

# .bash_history 不应被其他用户读取
find /home /root -name ".bash_history" -perm /o+r 2>/dev/null
```

## 13. LD_PRELOAD 防护

```bash
# 排查恶意 LD_PRELOAD
grep -rn "LD_PRELOAD" /etc/profile /etc/profile.d/ /etc/environment \
  /home/*/.bashrc /home/*/.bash_profile /root/.bashrc 2>/dev/null

# 全局预加载（正常应为空或系统库）
cat /etc/ld.so.preload 2>/dev/null
ls /etc/ld.so.conf.d/ && cat /etc/ld.so.conf.d/*
```

---
title: SSH 远程访问加固
date: 2026-08-04
tags: [安全基线, 系统加固, SSH, sshd_config, 密钥认证, Linux]
summary: SSH 服务加固：sshd_config 核心配置、密钥认证、用户白名单、超时、加密算法、日志审计。
---

> 对应「Linux 安全基线加固手册」第 3 章。

## 1. 核心配置

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.$(date +%F).bak

cat > /tmp/sshd_hardening.conf << 'EOF'
# ===== 端口与协议 =====
Port 2222                    # 修改默认端口（可选）
Protocol 2                   # 仅 SSHv2

# ===== 认证控制 =====
PermitRootLogin no           # 禁止 root 远程登录
PasswordAuthentication no    # 禁用密码（仅密钥）
PubkeyAuthentication yes     # 启用密钥
PermitEmptyPasswords no      # 禁止空密码
MaxAuthTries 3               # 最多尝试3次
MaxSessions 5                # 最大会话数

# ===== 用户白名单 =====
AllowUsers admin deploy ops
# AllowGroups sshusers

# ===== 超时与转发 =====
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no

# ===== 加密算法（禁用弱算法）=====
Ciphers aes256-ctr,aes192-ctr,aes128-ctr,aes256-gcm@openssh.com
MACs hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512

# ===== 其他 =====
PermitUserEnvironment no
LoginGraceTime 30
Banner /etc/ssh/banner
EOF

# 合并到主配置
sshd -t                      # 语法检查！
systemctl restart sshd
```

> ⚠️ 修改端口/禁用密码前，务必保留一个已建立的连接，并在另一个终端 `sshd -t` 验证语法。误配置会导致被锁在门外。

## 2. SSH 密钥管理

```bash
# 生成强密钥（ed25519）
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "admin@$(hostname)"

# 设置正确权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519

# 审核所有 authorized_keys（排查未知公钥）
for f in $(find /home /root -name "authorized_keys" 2>/dev/null); do
    echo "=== $f ==="
    cat "$f"
done
```

## 3. SSH 日志审计

```bash
# 检查登录日志
grep "sshd" /var/log/secure | tail -100          # RHEL
grep "sshd" /var/log/auth.log | tail -100        # Debian/Ubuntu

# 失败登录来源统计
grep "Failed password" /var/log/secure | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn

# root 登录尝试
grep "root" /var/log/secure | grep sshd
```

## 4. 附加建议

- **fail2ban**：对 SSH 失败登录自动封禁来源 IP（`fail2ban` 配合 `sshd` jail）
- **防火墙**：仅对已知管理网段开放 SSH 端口（见防火墙加固章节）
- **监控**：把 `Failed password` 告警接入监控，暴力破解达到阈值即告警

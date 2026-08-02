---
title: VMware 虚拟机无法获取 IP 地址排查
date: 2026-08-02
tags: [vmware, DHCP, NAT, netplan, 网络排查, ubuntu]
summary: Ubuntu 虚拟机在 VMware 中无法获取 IPv4 地址的完整排查流程与解决方案。
---

## 问题现象

Ubuntu 22.04 虚拟机（VMware Workstation）开机后无法获取 IPv4 地址：

```bash
$ ip addr show ens33
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:0c:29:c5:b8:bb brd ff:ff:ff:ff:ff:ff
    altname enp2s1
```

网卡状态为 `UP, LOWER_UP`（物理链路正常），但没有 `inet` 行（无 IPv4 地址）。

---

## 基础知识

### VMware 网络模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| NAT | 虚拟机通过宿主机共享 IP 上网，VMware 提供虚拟 DHCP 和 NAT 服务 | 最常用，无需额外配置 |
| 桥接（Bridged） | 虚拟机直接接入物理网络，从物理路由器获取 IP | 需要虚拟机有独立 IP |
| 仅主机（Host-Only） | 虚拟机只能与宿主机通信，无法上网 | 隔离测试环境 |

### VMware NAT 模式的关键服务（Windows 宿主机）

| 服务 | 作用 |
|------|------|
| VMware DHCP Service | 为 NAT/Host-Only 网络中的虚拟机分配 IP |
| VMware NAT Service | 地址转换，让虚拟机通过宿主机上网 |
| VMware Authorization Service | 管理权限和虚拟机访问控制 |

> ⚠️ 如果 DHCP Service 未运行，虚拟机发出 DHCP DISCOVER 后不会收到任何 OFFER，45 秒后超时。

### DHCP 工作流程

```
虚拟机                          VMware DHCP Server
  |--- DHCP DISCOVER (广播) -------->|   ← 请求分配IP
  |<-- DHCP OFFER ------------------|   ← 提供可用IP
  |--- DHCP REQUEST --------------->|   ← 确认接受
  |<-- DHCP ACK --------------------|   ← 最终确认
```

如果 DHCP Service 未运行，第一步 DISCOVER 就石沉大海。

---

## 排查步骤

### 1. 确认网卡物理状态

```bash
ip link show ens33
```

`state UP + LOWER_UP` 表示链路正常，问题不在物理层。

### 2. 确认 IP 地址

```bash
ip addr show ens33
```

没有 `inet` 行 → 未获取到 IPv4 地址。

### 3. 检查 NetworkManager 状态

```bash
nmcli device status
# ens33 一直卡在"正在获取 IP 配置" → DHCP 无响应
```

### 4. 查看 NetworkManager 日志

```bash
journalctl -u NetworkManager --no-pager -n 50
# 关键日志：
# dhcp4 (ens33): activation: beginning transaction (timeout in 45 seconds)
# dhcp4 (ens33): state changed no lease
# device (ens33): state change: ip-config -> failed (reason 'ip-config-unavailable')
```

`no lease` = DHCP 服务器没有回应任何地址。

### 5. 尝试手动重连

```bash
sudo nmcli device disconnect ens33
sudo nmcli device connect ens33
# 报错：激活连接失败：IP 配置无法保留
```

### 6. 排除虚拟机内部配置问题

```bash
# 备份原有配置
sudo mkdir -p /etc/netplan/backup
sudo mv /etc/netplan/*.yaml /etc/netplan/backup/

# 创建新配置
sudo tee /etc/netplan/01-netcfg.yaml << 'EOF'
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    ens33:
      dhcp4: true
      dhcp6: false
EOF

# 设置权限并应用
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan apply
```

问题依旧 → 排除虚拟机内部，锁定宿主机端。

---

## 根本原因

**宿主机上的 VMware DHCP Service 和 NAT Service 未启动。**

虚拟机网卡链路正常（LOWER_UP）、netplan 配置正确、NetworkManager 正常工作，但 DHCP DISCOVER 广播包发出后，宿主机上没有任何进程监听回应。

---

## 解决方案

### 方法一：图形界面启动服务

`Win + R` → `services.msc` → 找到以下服务，设为「正在运行」+「自动」：

- VMware DHCP Service
- VMware NAT Service
- VMware Authorization Service

### 方法二：命令行（管理员 CMD）

```cmd
:: 查看服务状态
sc query "VMware DHCP Service"
sc query "VMware NAT Service"
sc query "VMware Authorization Service"

:: 启动服务
net start "VMware NAT Service"
net start "VMware DHCP Service"

:: 设置开机自启
sc config "VMware DHCP Service" start= auto
sc config "VMware NAT Service" start= auto
sc config "VMware Authorization Service" start= auto
```

### 方法三：虚拟网络编辑器重置（服务正常但仍不通）

1. 以管理员身份运行 VMware Workstation
2. 编辑 → 虚拟网络编辑器 → 更改设置
3. 点击「恢复默认设置」→ 应用 → 确定

### 验证修复

```bash
sudo nmcli device disconnect ens33
sleep 2
sudo nmcli device connect ens33
sleep 5
ip addr show ens33
# 应看到：inet 192.168.xxx.xxx/24 ... dynamic ens33

ping -c 3 8.8.8.8        # 测试外网
ping -c 3 www.baidu.com   # 测试 DNS
```

---

## 排查命令速查

| 命令 | 用途 |
|------|------|
| `ip link show` | 查看网卡物理状态（UP/DOWN） |
| `ip addr show` | 查看 IP 地址分配 |
| `nmcli device status` | 查看 NetworkManager 设备状态 |
| `nmcli connection show` | 查看已配置的连接 |
| `journalctl -u NetworkManager -n 50` | 查看 NM 最近日志 |
| `sudo netplan apply` | 应用 netplan 配置 |
| `sudo netplan try` | 尝试配置（120 秒无确认自动回滚） |
| `cat /etc/netplan/*.yaml` | 查看当前网络配置 |
| `ip route show` | 查看路由表 |
| `cat /etc/resolv.conf` | 查看 DNS 配置 |

---

## 经验总结

1. **先看链路再看地址**：`LOWER_UP` 说明物理层没问题，问题在 DHCP/IP 层
2. **虚拟机网络问题先排除宿主机**：虚拟机内配置正确但 DHCP 无响应时，优先检查宿主机服务
3. **VMware 服务可能被意外停止**：系统更新、安全软件、手动优化都可能导致服务被禁用
4. **netplan 配置权限必须是 600**：否则 `netplan apply` 报权限警告
5. **netplan try 比 apply 更安全**：远程操作时防止配置错误导致断网

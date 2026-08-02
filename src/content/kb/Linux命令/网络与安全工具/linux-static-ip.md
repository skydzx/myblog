---
title: Linux 配置静态 IP 地址
date: 2026-08-02
tags: [linux, 静态IP, netplan, nmcli, 网络配置, ubuntu]
summary: Netplan / ip / nmcli 三种配置静态 IP 的方法，含 VMware NAT 网段确认与常见问题。
---

## 为什么需要静态 IP

| 场景 | 说明 |
|------|------|
| DHCP 服务故障 | VMware DHCP Service 挂掉时的应急方案 |
| 服务器部署 | Web/数据库服务器需要固定 IP 供其他机器访问 |
| 端口映射 | VMware NAT 端口转发需要固定目标 IP |
| 避免 IP 变动 | DHCP 租约到期后 IP 可能变化，影响 SSH 连接 |

---

## VMware NAT 网络结构

```
Windows 宿主机
  VMnet8 (虚拟交换机)  192.168.232.0/24
    ├── VMware NAT Service     网关: .2
    ├── VMware DHCP Service    分配: .128 ~ .254
    └── 宿主机虚拟网卡         192.168.232.1
  Ubuntu 虚拟机
    └── ens33: 192.168.232.100   网关: 192.168.232.2   DNS: 8.8.8.8
```

> ⚠️ **NAT 模式下网关是 `.2`（不是 `.1`）**，`.1` 是宿主机自己的虚拟网卡。

---

## 确认你的网段信息

在 **Windows 宿主机** CMD 中执行：

```cmd
ipconfig | findstr "VMware"
# 以太网适配器 VMware Network Adapter VMnet8:
#   IPv4 地址 : 192.168.232.1
#   子网掩码  : 255.255.255.0
```

或者 `VMware → 编辑 → 虚拟网络编辑器 → VMnet8 → NAT 设置` 查看子网 IP、掩码、网关。

---

## 方法一：Netplan 配置（永久生效，推荐）

```bash
# 备份当前配置
sudo cp /etc/netplan/01-netcfg.yaml /etc/netplan/01-netcfg.yaml.bak

# 编辑（根据实际网段修改）
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    ens33:
      dhcp4: false                    # 关闭 DHCP
      addresses:
        - 192.168.232.100/24          # 静态 IP + 掩码
      routes:
        - to: default
          via: 192.168.232.2          # NAT 模式网关是 .2
      nameservers:
        addresses:
          - 8.8.8.8
          - 114.114.114.114
```

> ⚠️ **YAML 格式要求极严**：只能用空格缩进（不能用 Tab）、每级 2 空格、冒号后必须有一个空格、列表项 `-` 后有一个空格。

```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan try        # 安全模式：120 秒内不确认自动回滚
# 网络正常就按 Enter 确认；或直接 sudo netplan apply

# 验证
ip addr show ens33
ip route show
ping -c 3 8.8.8.8
ping -c 3 www.baidu.com
```

---

## 方法二：ip 命令临时配置（重启失效）

```bash
sudo ip addr add 192.168.232.100/24 dev ens33
sudo ip route add default via 192.168.232.2
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# 验证
ip addr show ens33
ip route show
ping -c 3 8.8.8.8
```

> 重启后全部失效，适合紧急救急。

---

## 方法三：nmcli 配置（永久生效）

```bash
sudo nmcli connection modify "netplan-ens33" \
  ipv4.method manual \
  ipv4.addresses 192.168.232.100/24 \
  ipv4.gateway 192.168.232.2 \
  ipv4.dns "8.8.8.8,114.114.114.114"

sudo nmcli connection up "netplan-ens33"

# 改回 DHCP
sudo nmcli connection modify "netplan-ens33" ipv4.method auto
sudo nmcli connection up "netplan-ens33"
```

---

## 方法对比

| 方法 | 是否永久 | 适用场景 | 配置文件 |
|------|---------|----------|----------|
| netplan | ✅ 永久 | 服务器 / 长期使用 | `/etc/netplan/*.yaml` |
| ip 命令 | ❌ 临时 | 紧急救急 / 测试 | 无（内存中） |
| nmcli | ✅ 永久 | 桌面版 / 快速修改 | NetworkManager 内部 |

---

## 常见问题

**Q：静态 IP 和 DHCP 冲突怎么办？**

确保 `dhcp4: false`，否则可能同时存在两个 IP。

**Q：配了静态 IP 后 DNS 不生效？**

```bash
# 检查是否有 systemd-resolved 覆盖
sudo systemctl status systemd-resolved
resolvectl status ens33
```

**Q：怎么避免和 DHCP 地址池冲突？**

VMware DHCP 默认分配 `.128 ~ .254`，静态 IP 建议选 `.3 ~ .127` 之间。

**Q：桥接模式下怎么配？**

网关改为物理路由器地址（如 `192.168.1.1`），IP 选物理网段中未被占用的：

```yaml
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    ens33:
      dhcp4: false
      addresses:
        - 192.168.1.200/24
      routes:
        - to: default
          via: 192.168.1.1        # 物理路由器网关
      nameservers:
        addresses:
          - 8.8.8.8
          - 114.114.114.114
```

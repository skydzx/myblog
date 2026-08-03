---
title: Web 中间件安全加固
date: 2026-08-04
tags: [安全基线, 系统加固, Nginx, Apache, Tomcat, WebLogic, 中间件, Linux]
summary: Nginx/Apache 隐藏版本、限制HTTP方法、敏感路径拦截、SSL/TLS 加固；Tomcat 默认应用清理、管理接口、AJP 关闭。
---

> 对应「Linux 安全基线加固手册」第 14、17 章。

## 1. Nginx

```bash
nginx -v    # 版本（应用最新稳定版）
grep "^user" /etc/nginx/nginx.conf    # 期望 user nginx; （非root运行）

# 隐藏版本
grep "server_tokens" /etc/nginx/nginx.conf
# 加固: server_tokens off;
```

限制 HTTP 方法 / 目录遍历 / 敏感路径：

```nginx
# 限制方法
if ($request_method !~ ^(GET|POST|HEAD)$) { return 405; }

# 敏感路径拦截
location ~ /\. { deny all; }
location ~* \.(git|svn|env|bak|sql|tar\.gz)$ { deny all; }
location ~* (wp-admin|phpmyadmin|admin\.php) { deny all; }
```

超时与限流（防 Slow HTTP / 刷接口）：

```nginx
client_body_timeout 10s;
client_header_timeout 10s;
send_timeout 10s;
client_max_body_size 10m;
client_body_buffer_size 128k;

limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn:10m;
# server 中:
limit_req zone=one burst=20 nodelay;
limit_conn conn 50;
```

SSL/TLS 与安全响应头：

```nginx
ssl_protocols TLSv1.2 TLSv1.3;       # 禁用 SSLv3/TLS1.0/1.1
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
ssl_session_timeout 5m;

add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

```bash
nginx -t && systemctl reload nginx
```

## 2. Apache (httpd)

```bash
httpd -v          # RHEL
apache2 -v        # Debian/Ubuntu
httpd -M | sort   # 已加载模块
```

隐藏版本 / 运行用户 / 目录遍历：

```text
# 隐藏版本
ServerTokens Prod
ServerSignature Off

# 运行用户（非 root）
User apache
Group apache

# 禁止 Indexes
<Directory "/var/www/html">
    Options -Indexes +FollowSymLinks
</Directory>
```

禁用不安全方法 / 目录控制：

```text
<LimitExcept GET POST OPTIONS>
    Require all denied
</LimitExcept>

<Directory />
    AllowOverride None
    Require all denied
</Directory>
```

```bash
httpd -t && systemctl reload httpd
```

---

## 3. Tomcat

```bash
TOMCAT_HOME="/opt/tomcat"

# 1. 隐藏版本
sed -i 's/\(server="\)[^"]*"/\1 /' $TOMCAT_HOME/conf/server.xml   # 清空 Server 头

# 2. 删除默认应用（重要！）
rm -rf $TOMCAT_HOME/webapps/ROOT
rm -rf $TOMCAT_HOME/webapps/docs
rm -rf $TOMCAT_HOME/webapps/examples
rm -rf $TOMCAT_HOME/webapps/host-manager
rm -rf $TOMCAT_HOME/webapps/manager
```

管理接口加固（若保留 manager）：

```bash
# 强密码 + 随机账号
cat > $TOMCAT_HOME/conf/tomcat-users.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<tomcat-users>
  <role rolename="manager-gui"/>
  <user username="admin_$(openssl rand -hex 4)"
        password="$(openssl rand -base64 24)"
        roles="manager-gui"/>
</tomcat-users>
EOF

# 限制 manager 访问 IP（RemoteAddrValve）
# 编辑 webapps/manager/META-INF/context.xml 添加:
# <Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="192\.168\.1\.\d+|127\.0\.0\.1" />
```

其他加固：

```bash
# 关闭 AJP（无 Apache 反代需求时）
# 注释 server.xml 中的 <Connector port="8009" protocol="AJP/1.3" .../>

# 关闭自动部署
# <Host ... autoDeploy="false" deployOnStartup="false" />

# 非 root 运行
useradd -r -s /sbin/nologin tomcat
chown -R tomcat:tomcat $TOMCAT_HOME
```

## 4. WebLogic / JBoss

```bash
# WebLogic: 改默认端口 7001、限制 T3/IIOP 协议、检查默认账号密码
# JBoss: 管理接口绑定 127.0.0.1、add-user.sh 加管理用户、删 ROOT.war
```

> WebLogic 历史漏洞多（反序列化 RCE），**务必及时打补丁**并用 `OPatch` 检查。

## 5. 通用中间件检查清单

```bash
# 端口暴露
ss -tulnp | grep -E "80|443|8080|8443|8009"

# 进程运行用户（不应是 root）
ps aux | grep -E "nginx|httpd|tomcat|java"

# 版本与已知 CVE
nginx -v; httpd -v; $TOMCAT_HOME/bin/version.sh
```

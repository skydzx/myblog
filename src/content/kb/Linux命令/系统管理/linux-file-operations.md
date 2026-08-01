---
title: Linux 文件与目录操作速查
date: 2026-08-01
tags: [linux, 文件操作, cp, mv, rm, tar, 系统管理]
summary: 文件增删改查、复制移动、链接、打包压缩、权限查看——文件操作完整速查。
---

## 创建文件与目录

```bash
touch file.txt            # 创建空文件（或更新文件时间戳）
mkdir dir                 # 创建目录
mkdir -p a/b/c            # 递归创建多级目录
mkdir -m 755 dir          # 创建目录并指定权限
```

---

## 查看文件内容

```bash
cat file                  # 完整内容
cat -n file               # 带行号
less file                 # 分页查看（q 退出，/ 搜索，G 到底，g 到顶）
head -n 20 file           # 前 20 行
tail -n 20 file           # 后 20 行
tail -f /var/log/xxx.log  # 实时跟踪文件变化（看日志神器）
wc -l file                # 统计行数
file file                 # 识别文件类型
stat file                 # 详细信息（权限/时间戳/大小）
```

---

## 复制

```bash
cp file1 file2            # 复制文件
cp file1 dir/             # 复制到目录
cp -r dir1 dir2           # 递归复制目录
cp -a dir1 dir2           # 完整复制（保留权限、时间戳、链接）
cp -i file1 file2         # 覆盖前询问
cp -v file1 file2         # 显示复制过程
```

---

## 移动与重命名

```bash
mv file1 dir/             # 移动文件
mv file1 file2            # 重命名
mv dir1 dir2              # 移动/重命名目录
mv -i file1 file2         # 覆盖前询问
mv -v file1 file2         # 显示过程
```

---

## 删除

```bash
rm file                   # 删除文件
rm -r dir                 # 递归删除目录
rm -f file                # 强制删除（不询问）
rm -rf dir                # 强制递归删除（⚠️ 危险，用之前想清楚）
rm -i file                # 删除前逐个确认
rmdir dir                 # 删除空目录

# 安全删除（可恢复方案）：先移动到临时区而非直接 rm
mkdir -p ~/.trash && mv file ~/.trash/
```

> ⚠️ `rm -rf` 是破坏性命令。生产环境建议：先 `ls` 确认路径，或用 `mv` 到垃圾目录代替。

---

## 链接

```bash
# 硬链接（同一文件多个名字，指向同一 inode）
ln file1 link1

# 符号链接（软链接，类似 Windows 快捷方式）
ln -s /path/to/target link

# 查看链接指向
ls -l link
readlink link
```

---

## 查找与过滤（配合管道）

```bash
find . -name "*.log"              # 按名查找
find / -size +100M                # 大文件（>100MB）
find / -mtime -7 -type f          # 7 天内修改过的文件
find . -type d                    # 只看目录

grep -r "keyword" /path/          # 递归搜索文本
grep -i "keyword" file            # 忽略大小写
grep -n "keyword" file            # 显示行号
grep -v "exclude" file            # 排除匹配行
```

---

## 打包压缩

```bash
# tar 打包（不解压）
tar -cf archive.tar dir/
tar -tf archive.tar               # 查看内容

# tar.gz（最常用）
tar -czf archive.tar.gz dir/
tar -xzf archive.tar.gz           # 解压到当前目录
tar -xzf archive.tar.gz -C /dest  # 解压到指定目录

# 压缩单个文件
gzip file.txt                     # → file.txt.gz
gunzip file.txt.gz                # 解压
bzip2 file.txt                    # → file.txt.bz2（压缩率更高，慢）

# zip 格式
zip -r archive.zip dir/
unzip archive.zip
```

---

## 文件内容修改

```bash
# 直接修改文件（sed 流编辑）
sed -i 's/old/new/g' file         # 全局替换
sed -i '/pattern/d' file          # 删除匹配行

# 追加 / 覆盖写
echo "text" >> file               # 追加到文件尾
echo "text" > file                # 覆盖整个文件（⚠️ 注意别误用 > 覆盖）
cat >> file <<'EOF'
多行追加内容
EOF

# 在文件头部插入内容
sed -i '1i第一行插入' file
```

---

## 常用场景速查

| 需求 | 命令 |
|------|------|
| 快速清空文件（保留文件） | `> file` 或 `truncate -s 0 file` |
| 统计目录下文件数量 | `find /dir -type f | wc -l` |
| 复制目录并保持结构 | `cp -r /src /dst && mv /dst/src /dst/desired` |
| 移动时排除某文件 | `rsync -av --exclude='*.log' /src/ /dst/` |
| 备份整个目录带时间戳 | `tar -czf backup_$(date +%Y%m%d).tar.gz /dir` |
| 查看磁盘占用 | `du -sh /dir`，`df -h` |
| 超大文件快速看头尾 | `head -n 1 huge.log; tail -n 1 huge.log` |
| 对比两个文件 | `diff file1 file2` |
| 查看目录树 | `tree /dir`（需安装）或 `find /dir -maxdepth 2 | sort` |

---

## 注意事项

- `cp -r` 和 `cp -a` 区别：`-a` 保留权限/时间戳/硬链接，适合完整备份
- 软链接删掉不影响目标文件；硬链接删一个其他名字还在
- `mv` 跨文件系统时是「复制 + 删除」，大文件会慢；同文件系统是纯改 inode，瞬间完成
- `>` 覆盖文件前确认，用 `>>` 追加更安全
- 移动文件到新位置后，原路径的软链接会失效（指向旧 inode 路径）

---
title: Git 日常使用流程
date: 2026-07-26
tags: [git, 版本控制, 工作流]
summary: 博客日常更新、文章发布、回滚操作的 Git 命令速查。
---

## 日常流程

博客的完整更新流程只有四步：

```bash
# 1. 写文章 / 改配置 / 更新知识库……

# 2. 暂存所有改动
git add .

# 3. 提交（引号里写清楚改了什么）
git commit -m "新增一篇关于SQL注入的文章"

# 4. 推到 GitHub（触发 Cloudflare 自动部署）
git push
```

完事。等一两分钟，打开 `https://geeyx.me` 就能看到更新。

---

## 常用命令

### 查看状态

```bash
git status              # 看哪些文件改过
git status --short      # 精简版
git diff                # 看具体改了什么内容
```

### 提交

```bash
git add .               # 暂存所有改动
git add src/content/posts/新文章.md   # 只暂存某个文件
git commit -m "消息"     # 提交
git commit -m "消息" --amend   # 追加到上一次提交（还没 push 之前用）
```

### 推送与拉取

```bash
git push                # 推到远程
git pull                # 拉取远程更新（换电脑写的时候用）
```

### 后悔药

```bash
# 改坏了一个文件，想恢复到上次 commit 的状态
git checkout -- src/config.ts

# add 多了，取消暂存
git reset HEAD 文件名

# commit 写错了消息（还没 push）
git commit --amend -m "新的消息"

# 回退到上一个版本（还没 push，改动保留在本地）
git reset HEAD~1

# 回退到上一个版本（还没 push，改动全部丢弃）
git reset --hard HEAD~1

# push 之后想回滚，用 revert（安全，不破坏历史）
git revert HEAD
git push
```

### 看日志

```bash
git log --oneline       # 看最近提交（精简版）
git log --oneline -10   # 看最近 10 条
git log -p              # 看每次提交的具体改动
```

---

## 实际场景

### 场景一：写了一篇新文章

```bash
vim src/content/posts/sqli-tutorial.md   # 写文章
git add .
git commit -m "新增SQL注入入门教程"
git push
```

### 场景二：改了配置，顺手修了个错别字

```bash
# 改完 config.ts 和某篇文章里的错字
git add .
git commit -m "更新站点配置，修正文章错别字"
git push
```

### 场景三：新加知识库笔记

```bash
vim src/content/kb/网络安全/sqli-filter-bypass.md
git add .
git commit -m "知识库新增：SQL注入过滤绕过技巧"
git push
```

### 场景四：发现 push 之后有 bug，赶紧回滚

```bash
git revert HEAD         # 撤销最后一次提交
git push                # 推到线上，网站恢复
```

---

## `.gitignore` 保平安

以下文件不归 Git 管（已经写在 `.gitignore` 里了），不用担心把敏感信息推上去：

- `node_modules/` —— 依赖包，太大
- `.env` —— 环境变量，可能有密钥
- `dist/` —— 构建产物，Cloudflare 自己会生成

---

## 总结

记住这三条就够了：

```bash
git add . && git commit -m "消息" && git push
```

写 → commit → push → 网站自动更新。循环往复。

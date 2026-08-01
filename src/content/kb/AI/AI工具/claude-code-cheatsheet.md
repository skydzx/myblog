---
title: Claude Code 指令速查
date: 2026-08-01
tags: [claude-code, AI工具, 命令行, 效率]
summary: Claude Code CLI 命令、斜杠命令、启动参数、键盘快捷键、环境变量完整速查。
---

## CLI 命令总览

### 核心命令

| 命令 | 说明 |
|------|------|
| `claude` | 启动交互模式 |
| `claude "任务"` | 带初始提示启动 |
| `claude -p "查询"` | 非交互模式，输出后退出 |
| `claude -c` | 继续最近的对话 |
| `claude -r "会话ID"` | 恢复指定会话 |
| `claude update` | 更新到最新版本 |
| `claude --version` | 显示版本号 |

### 认证命令

```bash
claude auth login        # 登录（支持 --email / --sso / --console）
claude auth logout       # 登出
claude auth status       # 显示认证状态（JSON，加 --text 人类可读）
```

### 管理命令

```bash
claude agents                     # 列出所有配置的子代理
claude mcp                        # 配置 MCP 服务器
claude plugin install <name>      # 安装插件
claude project purge [path]       # 删除项目本地状态（--dry-run 预览）
claude setup-token                # 生成长期 OAuth token（CI/脚本用）
claude ultrareview [target]       # 运行深度代码审查
```

---

## 交互模式斜杠命令

交互模式中输入 `/` 查看全部可用命令。

### 会话管理

| 命令 | 说明 |
|------|------|
| `/clear` | 开始新对话 |
| `/compact` | 压缩上下文释放空间 |
| `/resume` | 恢复对话 |
| `/branch` | 创建对话分支 |
| `/rename` | 重命名当前会话 |
| `/export` | 导出对话为纯文本 |
| `/exit` | 退出 |
| `/rewind` | 回退到检查点 |
| `/recap` | 生成会话摘要 |
| `/teleport` | 将 Web 会话拉到终端 |

### 项目配置

| 命令 | 说明 |
|------|------|
| `/init` | 初始化项目，创建 CLAUDE.md |
| `/memory` | 编辑 CLAUDE.md 记忆文件 |
| `/add-dir <路径>` | 添加工作目录 |

### 模型与配置

| 命令 | 说明 |
|------|------|
| `/model` | 选择 / 切换 AI 模型 |
| `/effort [级别]` | 设置努力级别：low/medium/high/xhigh/max |
| `/config` | 打开设置界面 |
| `/theme` | 更改颜色主题 |
| `/fast` | 切换快速模式 |
| `/sandbox` | 切换沙盒模式 |

### 权限与工具

| 命令 | 说明 |
|------|------|
| `/permissions` | 管理允许 / 询问 / 拒绝规则 |
| `/hooks` | 查看钩子配置 |
| `/mcp` | 管理 MCP 服务器连接 |
| `/agents` | 管理代理配置 |
| `/plugin` | 管理插件 |
| `/skills` | 列出可用技能 |

### 分析与审查

| 命令 | 说明 |
|------|------|
| `/diff` | 交互式差异查看器 |
| `/review` | 审查当前 Pull Request |
| `/security-review` | 分析安全漏洞 |
| `/simplify` | 审查代码质量 / 效率 |
| `/ultrareview` | 云端深度多代理代码审查 |
| `/ultraplan <提示>` | 在 ultraplan 会话中起草计划 |

### 状态与信息

| 命令 | 说明 |
|------|------|
| `/status` | 打开设置界面（状态标签） |
| `/usage` | 显示会话费用、用量统计 |
| `/context` | 可视化上下文使用情况 |
| `/copy [N]` | 复制第 N 条回复到剪贴板 |
| `/help` | 显示帮助 |
| `/insights` | 生成会话分析报告 |

### 协作与远程

| 命令 | 说明 |
|------|------|
| `/remote-control` | 让会话可被远程控制 |
| `/autofix-pr` | 监视 PR，CI 失败时自动修复 |
| `/install-github-app` | 设置 Claude GitHub Actions |
| `/install-slack-app` | 安装 Claude Slack 应用 |

### 批量与调度

| 命令 | 说明 |
|------|------|
| `/batch <指令>` | 并行编排大规模代码库变更 |
| `/loop [间隔] [提示]` | 重复运行提示 |
| `/schedule` | 创建 / 管理定时任务 |
| `/tasks` | 列出和管理后台任务 |

### 特殊命令

| 命令 | 说明 |
|------|------|
| `/btw <问题>` | 快速提问（不加入对话历史） |
| `/plan` | 进入计划模式 |
| `/fewer-permission-prompts` | 扫描并添加允许列表减少提示 |
| `/desktop` | 在桌面应用中继续会话 |

---

## CLI 启动参数

### 会话与恢复

| 参数 | 说明 |
|------|------|
| `--continue, -c` | 加载当前目录最近的对话 |
| `--resume, -r` | 恢复指定会话 |
| `--fork-session` | 恢复时创建新会话 ID |
| `--session-id` | 使用指定会话 ID |
| `--name, -n` | 设置会话显示名称 |
| `--from-pr` | 恢复关联特定 PR 的会话 |
| `--teleport` | 在本地终端恢复 Web 会话 |

### 输出格式

| 参数 | 说明 |
|------|------|
| `--print, -p` | 非交互模式，输出后退出 |
| `--output-format` | text / json / stream-json |
| `--input-format` | text / stream-json |
| `--json-schema` | 获取符合 schema 的 JSON 输出 |
| `--verbose` | 启用详细日志 |

### 模型配置

| 参数 | 说明 |
|------|------|
| `--model` | 设置模型（别名 sonnet/opus 或完整名称） |
| `--effort` | 设置努力级别 |
| `--fallback-model` | 启用备用模型（仅 print 模式） |

### 权限与工具

| 参数 | 说明 |
|------|------|
| `--permission-mode` | default / acceptEdits / plan / auto / dontAsk / bypassPermissions |
| `--dangerously-skip-permissions` | 跳过权限提示（⚠️ 危险） |
| `--allowedTools` | 无需提示即可执行的工具 |
| `--disallowedTools` | 从上下文移除的工具 |
| `--tools` | 限制可用的内置工具 |

### 其他常用参数

| 参数 | 说明 |
|------|------|
| `--add-dir` | 添加额外工作目录 |
| `--worktree, -w` | 在隔离的 git worktree 中启动 |
| `--mcp-config` | 从 JSON 文件加载 MCP 服务器 |
| `--debug` | 启用调试模式 |
| `--max-budget-usd` | 最大花费限额（美元） |
| `--max-turns` | 限制代理轮次 |

---

## 键盘快捷键

### 通用控制

| 快捷键 | 说明 |
|--------|------|
| `Ctrl+C` | 取消当前输入或生成 |
| `Ctrl+D` | 退出会话 |
| `Ctrl+L` | 重绘屏幕 |
| `Ctrl+O` | 切换对话记录查看器 |
| `Ctrl+R` | 反向搜索命令历史 |
| `Ctrl+B` | 后台运行任务 |
| `Ctrl+T` | 切换任务列表 |
| `Shift+Tab` | 循环权限模式 |
| `?` | 显示可用快捷键 |

### 文本编辑

| 快捷键 | 说明 |
|--------|------|
| `Ctrl+A` | 移到行首 |
| `Ctrl+E` | 移到行尾 |
| `Ctrl+K` | 删除到行尾 |
| `Ctrl+U` | 删除到行首 |
| `Ctrl+W` | 删除前一个单词 |
| `Ctrl+Y` | 粘贴已删除文本 |
| `Alt+B` / `Alt+F` | 后退 / 前进一个单词 |

### 多行输入

| 方法 | 快捷键 |
|------|--------|
| 快速转义 | `\` + `Enter` |
| Option 键 | `Option+Enter` |
| Shift | `Shift+Enter` |
| 控制序列 | `Ctrl+J` |

---

## Vim 编辑器模式

### 模式切换

| 命令 | 说明 |
|------|------|
| `Esc` | 进入 NORMAL 模式 |
| `i` / `I` | 光标前 / 行首插入 |
| `a` / `A` | 光标后 / 行尾插入 |
| `o` / `O` | 下方 / 上方打开行 |
| `v` / `V` | 字符 / 行可视选择 |

### 导航（NORMAL 模式）

| 命令 | 说明 |
|------|------|
| `h/j/k/l` | 左 / 下 / 上 / 右 |
| `w/e/b` | 下一词首 / 词尾 / 前一词 |
| `0/$/^` | 行首 / 行尾 / 行首非空 |
| `gg/G` | 文件首 / 文件尾 |
| `f{char}` | 跳到字符 |

### 编辑（NORMAL 模式）

| 命令 | 说明 |
|------|------|
| `x` / `dd` / `D` | 删除字符 / 行 / 到行尾 |
| `cc` / `C` | 修改行 / 到行尾 |
| `yy` | 复制行 |
| `p` / `P` | 粘贴到后 / 前 |
| `u` | 撤销 |
| `.` | 重复上次操作 |

---

## Shell 模式

在输入前加 `!` 直接运行 shell 命令：

```bash
! npm test          # 运行测试
! git status        # 查看 git 状态
! ls -la            # 列出文件
```

特点：
- 命令输出会加入对话上下文
- 支持 `Ctrl+B` 后台运行
- `Tab` 可自动补全之前的 `!` 命令
- 粘贴以 `!` 开头的文本自动进入 shell 模式

---

## 常用环境变量

### 认证与 API

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_BASE_URL` | 覆盖 API 端点 |
| `ANTHROPIC_MODEL` | 模型名称 |
| `API_TIMEOUT_MS` | API 超时（默认 600000） |

### 云服务商

| 变量 | 说明 |
|------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | 使用 Microsoft Foundry |

### 行为控制

| 变量 | 说明 |
|------|------|
| `CLAUDE_CODE_SIMPLE` | 最小模式 |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS` | 跳过所有 CLAUDE.md |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用自动记忆 |
| `CLAUDE_CODE_DISABLE_THINKING` | 禁用扩展思考 |
| `CLAUDE_CODE_EFFORT_LEVEL` | 设置努力级别 |

### 网络与代理

| 变量 | 说明 |
|------|------|
| `HTTP_PROXY` | HTTP 代理 |
| `HTTPS_PROXY` | HTTPS 代理 |
| `NO_PROXY` | 不使用代理的地址 |

---

## 实战命令组合

### 日常开发

```bash
claude -c                              # 继续昨天的工作
claude -p "这段代码有什么问题？"        # 快速提问后退出
cat error.log | claude -p "分析这个错误日志"   # 管道处理
claude --model opus                    # 用指定模型启动
claude -p "重构整个src目录" --max-budget-usd 5  # 后台长任务限额
```

### 高效工作流

```bash
# 1. 开始新功能
claude "实现用户登录功能，使用JWT"

# 2. 遇到问题时
/debug "登录API返回401"

# 3. 完成后审查
/security-review

# 4. 提交前清理上下文
/compact
! git add -A
! git commit -m "feat: user login"
```

### 最常用 TOP 10

| 命令 | 场景 |
|------|------|
| `claude` | 启动交互 |
| `claude -c` | 继续上次对话 |
| `claude -p "问题"` | 快速提问 |
| `/clear` | 开始新对话 |
| `/compact` | 释放上下文 |
| `/model` | 切换模型 |
| `/usage` | 查看费用 |
| `/diff` | 查看改动 |
| `/permissions` | 管理权限 |
| `Ctrl+C` | 取消操作 |

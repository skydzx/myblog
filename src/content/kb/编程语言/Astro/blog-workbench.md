---
title: 博客"工作台化"改造记录
date: 2026-08-03
tags: [astro, fuwari, svelte, 前端, 布局, 踩坑]
summary: 本博客从"静态展示"改造成"工作台"的完整记录——参考图定调（借结构不借皮肤）、文章页三栏右TOC、终端hero统计、左栏模块化、音乐播放器与Web Audio可视化。
---

> 本文记录棋密博客一次整体改版的思路与实现，重点讲**借什么、不借什么**，以及每个模块怎么落到现有设计语言（浅蓝 + 终端 + 圆角白卡）上。

---

## 1. 定调：借"工作台"的结构，不借它的皮肤

改造前看了三张参考图：

- **参考A（Firefly 主题）**：清爽白底、绿色强调、三栏布局，左栏公告/音乐/社交行，右栏统计/TOC——本质是一台**工作台**，信息密度高。
- **参考B（二次元站）**：樱花虚化背景、毛玻璃、紫粉调、像素宠物——本质是一张**海报**，好看但信息稀。
- **本博客现状**：浅蓝 + 终端 + 圆角白卡 + 蓝竖条，已经是一套自洽的皮肤。

**定调结论**：博客人设是"安全/密码学/CTF 硬核技术人 + 终端 hero"，天生适合"工作台"而非"海报"。所以：

> **骨架和模块向参考A 看齐，皮肤一个字都不动；参考B 最多借一两个"会动的小零件"（运行计时/可视化），樱花毛玻璃一律不碰。**

这是改造成功与否的唯一关键——"参考图A"很容易被模型连那身绿衣服一起套上，必须写成硬约束。

---

## 2. 布局策略：主页两栏、文章页三栏

参考A 的三栏截图其实是**文章页**（有正文才有右 TOC）。所以正确拆法：

- **主页**：维持两栏（左个人信息 + 中终端hero/文章/精选），只往左栏补模块、往终端补统计。
- **文章页**：上三栏（左个人信息 + 中正文 + 右 TOC），把右 TOC + 精简统计塞进去。

这样主页已改好的部分一点不浪费。

---

## 3. 文章页三栏 + 右 TOC（复用 Fuwari 自带组件）

### 关键认知

Fuwari **自带** TOC 组件（`src/components/widget/TOC.astro`，IntersectionObserver 滚动跟随高亮、当前项蓝条标识、点击平滑滚动都有）。"文章页没目录"的真相是：它只在 `2xl`（≥1536px）断点显示，且宽度来自页面外边距——普通桌面（1280-1440px）根本看不到。

### 改造

1. **加宽容器**：`constants.ts` 加 `PAGE_WIDTH_WIDE = 86`，Layout 注入 `--page-width-wide`。
2. **TOC 变网格第三列**：`MainGridLayout` 在 `headings.length > 0`（内容页）时切换为 `lg:grid-cols-[17.5rem_auto_14rem]`，容器 `lg:max-w-[var(--page-width-wide)]`，TOC 作为 `lg:col-start-3` 网格项、`sticky top-14` 内部滚动。
3. **断点**：`lg` 起显示，移动端隐藏（不破坏单栏）。

### 坑

- main 元素原本 `col-span-2`，改成三栏后必须显式 `lg:col-span-1 lg:col-start-2`，否则占两列和 TOC 重叠。
- `#toc-inner-wrapper` 由 `fixed` 改成 `sticky` 后，TOC 组件的滚动跟随依然工作（它读 `scrollTop` 自行定位指示条）。

---

## 4. 终端 hero 站点统计（借"运行计时"功能，用终端皮肤表达）

参考B 唯一值得借的是"系统已稳定运行 XX 天"这类计时——但用**终端命令输出**来呈现，而不是照搬白卡。

### 实现

1. **构建期计算**（`content-utils.ts` 的 `getSiteStats()`）：
   - `uptime`：`siteConfig.siteStart` 起算 → `up 7d 19h 10m`
   - `wc -w`：遍历 posts + kb 的 `.body`，剔除代码块/标记符后统计字符数
   - `git log -1 --pretty=%cr`：取所有内容最新日期 → `3 days ago`
2. **动效组件**（`TerminalStats.svelte`，Svelte 5 runes）：逐行打字机显示命令 + 数字滚动（count-up），`prefers-reduced-motion` 时跳过动画直接显示。
3. **排版**：命令用 `--terminal-muted`，提示符 `$` 用 `--terminal-prompt`，结果用 `--terminal-text`，与终端窗口同色系。

### 要点

- 统计是**构建期算好的静态值**，`client:load` 的 Svelte 组件只负责播放动画，不重复计算。
- `getSiteStats` 里 `Date.now()` 是构建时间，重建时自动更新。

---

## 5. 左栏模块化（社交 / 公告 / 音乐 / 浏览量）

左栏从"1 分类 + 3 标签"的空洞，变成完整工作台：**头像 → 社交行 → 公告 → 音乐 → 分类 → 标签**。

### 5.1 社交图标行

`Profile.astro` 把 `profileConfig.links` 渲染成圆角浅蓝底图标行（GitHub/RSS），hover 上浮变色。链接配置驱动，便于增减。

### 5.2 可关闭公告卡

`Announcement.svelte`（client:load）：标题 + 正文 + 链接 + 右上 ×。关闭状态写 `localStorage`，刷新保持；`siteConfig.announcement` 配置开关与文案。

### 5.3 迷你音乐播放器

`MiniPlayer.svelte`（client:load）：
- 音轨列表由 `musicConfig.tracks` 配置驱动（本地 `public/music/` 文件，走本站 CDN）。
- **真实 `<audio>` 播放**：播放/暂停、上下首、拖动进度、音量/静音、时间显示。
- **Web Audio 可视化**：`createMediaElementSource(audio)` + `AnalyserNode`，canvas 画频谱条，播放时"活"起来（Mineradio 式）。注意 `createMediaElementSource` 对同一 audio 元素只能调一次，要在首次播放时懒初始化并 `resume()`。

### 5.4 浏览量占位

`ViewCount.svelte`：localStorage 自增占位，留接口后续接 umami。放在文章页元信息区。

---

## 6. 音乐音源的两个现实问题

### 6.1 FLAC 网页播不了

Safari 不支持 `<audio>` 播 FLAC，且单曲 50MB 加载极慢。**转 mp3**（192kbps，单曲 3-6MB）+ 提取内嵌封面：

```bash
ffmpeg -i "x.flac" -codec:a libmp3lame -b:a 192k "x.mp3"
ffmpeg -i "x.mp3" -an -c:v copy "cover.jpg"   # 提取专辑封面
```

### 6.2 中文文件名 URL 编码

含中文/空格/括号的文件名**不要手动转 src 编码**，浏览器会自动对 `<audio src>` URL 编码，直接用原始文件名即可。

---

## 7. Svelte 5 组件模式小结

本项目 Svelte 组件统一用 **runes 模式**（`$state`/`$props`/`$effect`）：

```svelte
<script lang="ts">
	interface Props { tracks: Track[] }
	let { tracks }: Props = $props();   // 声明 props
	let playing = $state(false);          // 响应式状态
	$effect(() => { /* 响应 state 变化 */ });
</script>
```

在 Astro 里用 `client:load` 挂载（SSR 出初始 HTML + 客户端水合），`client:only` 仅在前几个需要避免 SSR 的组件（Search/ArchivePanel）使用。注意 `client:load` 组件会被 SSR，`onMount`/`$effect` 只在客户端跑，别把浏览器 API 放在顶层。

---

## 8. 改造自查清单

1. **皮肤没变**：全站强调色仍是浅蓝 `--hue`，无绿色、无樱花毛玻璃、无紫粉。
2. **布局正确**：主页两栏、文章页三栏（lg+ 右 TOC），移动端单栏无溢出。
3. **动效克制**：打字机/数字滚动/可视化都 respect `prefers-reduced-motion`。
4. **Token 先行**：新增组件全部用 `var(--xxx)`，无硬编码颜色。
5. **构建稳定**：冷缓存 `rm -rf .astro dist && npx astro build` 连续多次全过。

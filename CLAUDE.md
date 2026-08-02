# 棋密 (Polybius Blog) — 项目开发规范

基于 Astro 5 + Fuwari 主题的个人技术博客，部署于 Cloudflare Pages。

## 引用关系（开发前必读）

| 优先级 | 文档 | 路径 | 何时读 |
|--------|------|------|--------|
| 1 | **设计规范** | `src/pages/docs/design-spec.astro` | 任何 UI 改动前 |
| 2 | **架构文档** | `src/pages/docs/architecture.astro` | 新增页面/路由/集合前 |
| 3 | **开发规范** | `src/pages/docs/dev-conventions.astro` | 写任何代码前 |

在线版本：
- https://geeyx.me/docs/design-spec/
- https://geeyx.me/docs/architecture/
- https://geeyx.me/docs/dev-conventions/

## 核心原则（写进每次 commit 的隐含约束）

1. **Token 先行，禁止硬编码** — 颜色、字号、间距、圆角必须来自设计 Token 表（`variables.styl` + Tailwind 类），不准在页面里写 `style="color: #xxx"`
2. **上帝函数禁止** — 单函数不超过 30 行 TS / 50 行 Astro 模板，禁止一个函数同时做读取+校验+计算+持久化
3. **目录边界不可越** — `src/pages/` 只管路由编排，`src/components/` 只管 UI 渲染，`src/utils/` 只放纯函数，互不越界
4. **复用优先** — 同一视觉模式出现 ≥2 次必须提取为组件或 token
5. **暗色默认** — 所有颜色定义双模式（light / dark），不做单模式组件
6. **文档随代码更新** — 新增/修改组件、配置、常量、路由、token，或踩到新坑，必须同步更新 `docs/architecture`、`docs/design-spec`、`docs/dev-conventions` 及 `src/content/kb/` 踩坑记录

## 技术栈锁定

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | Astro | 5.x |
| CSS | Tailwind CSS + Stylus | 3.x |
| 排版 | @tailwindcss/typography | 0.5.x |
| 代码高亮 | astro-expressive-code | 0.41.x |
| 图标 | astro-icon (Iconify) | 1.x |
| 交互 | Svelte | 5.x |
| 过渡 | @swup/astro | 1.x |

**不引入任何第三方 UI 组件库。** Tailwind 原子类 + Fuwari 内置 CSS 变量 = 全局风格开关。

## 全局风格开关

修改主色只需改一处：

```
src/styles/variables.styl → --hue: 160  (当前值)
src/config.ts → themeColor.hue: 160
```

色彩空间：`oklch(L C H)`，亮/暗双模式由 Stylus `define()` 宏统一生成。

## 开发流程

```
设计规范 → 开发规范 → 架构文档 → 写代码 → 自查 → 测试
```

每完成一个功能，AI 必须报告：
1. 对照设计规范自查：有没有硬编码数值？有没有绕开组件库主题？
2. 对照开发规范自查：有没有乱放目录？有没有上帝函数？

## 截图参考原则

参考截图时，学布局结构、信息层级、设计思路，但颜色/字号/间距/圆角落到本项目的设计 Token。禁止一比一照抄。

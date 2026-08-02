---
title: Astro 开发踩坑记录
date: 2026-08-03
tags: [astro, 前端, 踩坑, 路由, 调试]
summary: 本博客（Astro 5 + Fuwari）开发过程中遇到的真实报错与解决方案——getStaticPaths、花括号转义、getEntry 中文路径、Mermaid 集成、Svelte client 指令类型、CRLF/CI、设计 Token 缺失、Tailwind @apply 跨文件等。
---

> 本文记录棋密博客开发中真实踩过的坑。每个坑包含：**现象 → 原因 → 解决**。遇到类似报错可直接搜关键词。

---

## 1. getStaticPaths 的 params 只能传 string

### 现象

`[...slug].astro` 动态路由报错：

```
GetStaticPathsInvalidRouteParam
Invalid getStaticPaths route parameter for `slug`.
Expected undefined, a string or a number, received `object`
```

### 原因

`[...slug]` 是多段路由，但 `getStaticPaths` 返回的 `params.slug` 我传了数组：

```js
// ❌ 错误：slug 传了数组
paths.push({ params: { slug: ["网络安全", "nmap-cheatsheet"] } });
```

### 解决

`params` 的值必须是 **string**，多段路径用 `/` 拼成一个字符串：

```js
// ✅ 正确
paths.push({ params: { slug: "网络安全/nmap-cheatsheet" } });
// 路由里再 split("/") 还原
const [cat, ...rest] = slug.split("/");
```

> 所有 `[param]` 或 `[...param]` 的 params 值都是 string，数组会直接报错。

---

## 2. frontmatter 里不要写多个 return (JSX)

### 现象

在 `.astro` 文件的 `---` frontmatter 里写多个 `return (<JSX>)` 分支：

```js
// ❌ 报错：Unexpected "export" / Expected > but found title
if (entry) {
  return (<MainGridLayout>...文章...</MainGridLayout>);
} else {
  return (<MainGridLayout>...列表...</MainGridLayout>);
}
```

### 原因

Astro 组件编译器对 frontmatter 里的**多个 JSX return** 支持不稳定，会生成语法错误的代码。

### 解决

在 frontmatter 里**只算数据**，模板里用**一个三元表达式**做条件渲染：

```astro
---
// frontmatter 算好数据
let Content = null;
let articleData = null;
if (entry) {
  Content = (await render(entry)).Content;
  articleData = { ... };
} else {
  // 分类页数据
}
---
{articleData ? (
  <MainGridLayout>...文章...</MainGridLayout>
) : (
  <MainGridLayout>...列表...</MainGridLayout>
)}
```

---

## 3. `<code>` 标签里的花括号会被当表达式

### 现象

在文档页 `.astro` 的模板里写：

```html
<code>src/content/kb/{category}/*.md</code>
```

报错一堆：

```
Expected ">" but found "title"
category is not defined
Unterminated comment
Expected "}" but found "'}'"
```

### 原因

Astro 模板把 `{...}` 一律当作 JS 表达式解析。文档里想展示 `{category}` 这种字面量花括号，直接写会被当成变量引用。

### 解决（三种，按推荐顺序）

**方案 A：内容放 JS 字符串变量 + set:html 注入（推荐）**

```astro
---
const routeTableBody = `
<tr><td>/kb/{category}/</td><td>pages/kb/[...slug].astro</td></tr>
`;
---
<table set:html={routeTableBody}></table>
```

**方案 B：用 `<pre>{变量}</pre>` 展示代码块**

```astro
---
const example = "src/content/kb/{category}/*.md";
---
<pre>{example}</pre>
```

**方案 C：避免在 `<code>` 里写花括号**，改用纯文字描述：

```html
<!-- 不写 {category}，直接描述 -->
<code>src/content/kb/</code> 下建「大类/子分类」两级目录
```

> **血泪教训**：反复转义（`{'category'}`、`&#123;`、`{'{'}category{'}'}`）只会越搞越乱，直接绕过——用变量。

---

## 4. getEntry 对混合中英文路径失效

### 现象

分类页能正常列出文章，但点进文章页显示 `KB entry not found`：

```
Entry kb → Linux命令/git-workflow was not found.
```

规律：**`密码学`、`网络安全` 等纯中文分类正常，`Linux命令`（中英混合）全挂**。

### 原因

`getEntry("kb", "Linux命令/git-workflow")` 这种**按 id 重新解析**的方式，对路径中混有 ASCII + 中文的分类匹配失败，返回 null。而 `getCollection()` 能正常返回这些文章。

### 解决

**绕开 getEntry，用 props 直接传 entry 对象**：

```astro
---
export async function getStaticPaths() {
  const entries = await getCollection("kb");
  return entries.map((e) => ({
    params: { slug: e.id.replace(/\.md$/, "") },
    props: { entry: e },   // 直接传对象
  }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);   // 不再 getEntry
---
```

`getCollection` 可靠，`getEntry` 按 id 解析有坑 → **统一用 getCollection + props**。

---

## 5. Mermaid 图表集成方案

### 需求

Markdown 里写 ` ```mermaid ` 代码块，渲染成流程图。

### 实现

**第一步：remark 插件**（`src/plugins/remark-mermaid.mjs`），在 Expressive Code 之前把代码块换成 HTML 节点：

```js
import { visit } from "unist-util-visit";

export function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid") return;
      parent.children.splice(index, 1, {
        type: "html",
        value: `<div class="mermaid">\n${node.value}\n</div>`,
      });
    });
  };
}
```

**第二步**：`astro.config.mjs` 里把插件放在 `remarkPlugins` 数组**最前面**（必须在其他插件前拦截）：

```js
remarkPlugins: [remarkMermaid, remarkMath, ...]
```

**第三步**（⚠️ 2026-08 更新）：~~页面用 CDN 引入 mermaid + `startOnLoad`~~ 这个方案在 CDN 加载失败/慢时会**把原始源码裸露在页面上**（图表完全不渲染），且 Swup 页面切换不会重新执行。已改为：

- `pnpm add mermaid` 安装为正式依赖（随构建打包，不再依赖外网 CDN）
- 在 `Layout.astro` 加**全局懒加载渲染脚本**：仅当页面存在 `.mermaid` 元素时才动态 `import("mermaid")` 并 `mermaid.run({ nodes })`，挂 `DOMContentLoaded` + `astro:page-load`（覆盖 Swup 页面切换重渲染），渲染失败用 try/catch 兜底提示而不是吐源码

```js
// Layout.astro 里的全局 mermaid 渲染器（节选）
async function renderMermaid() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mermaid"))
    .filter((n) => !n.querySelector("svg"));   // 已渲染的跳过（防 Swup 缓存重跑）
  if (!nodes.length) return;
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" });
  await mermaid.run({ nodes });
}
document.addEventListener("DOMContentLoaded", renderMermaid);
document.addEventListener("astro:page-load", renderMermaid);
```

> 关键：**remark 插件必须跑在语法高亮之前**，否则 mermaid 代码块已经被 Expressive Code 处理掉了。

---

## 6. 构建偶发失败：markdown.css 的 @apply link（真凶）

### 现象

构建**间歇性**失败，有时重跑就好：

```
[vite] ✗ Build failed ...
[vite:css] [postcss] src/styles/markdown.css:23:9:
The `link` class does not exist. If `link` is a custom class,
make sure it is defined within a `@layer` directive.
```

### 原因（血泪教训）

`markdown.css` 里用了 `@apply link`，依赖 `main.css` 的 `.link` 自定义类。但构建时两个 CSS 文件的**处理顺序不定**——`markdown.css` 先被处理时，`link` 类还没注册，就报错。

**之前我误判为"环境抖动，重跑就好"，实际上真凶是这个**——只是偶尔顺序对了才构建成功。

### 解决

让 `markdown.css` **不依赖外部自定义类**。把 `@apply link` 删掉：

```css
/* ❌ 之前：依赖 main.css 的 .link 类，顺序不定会报错 */
a:not(.no-styling) {
  @apply relative bg-none link font-medium ...;
}

/* ✅ 修复：去掉 link，hover 背景样式本来就在后面自己写了 */
a:not(.no-styling) {
  @apply relative bg-none font-medium ...;
}
```

> 教训：**跨文件 `@apply` 自定义类会因 CSS 打包顺序间歇性失败**。让 CSS 文件自包含，或用 Tailwind 内置类。

### 同源：`@apply btn-regular-dark`（line 64）

修复了 `@apply link` 后，构建仍然偶发失败，报错变成：

```
src/styles/markdown.css:64:9: The `btn-regular-dark` class does not exist.
```

**同一个坑换了个类名**——`.copy-btn` 里 `@apply btn-regular-dark` 依然跨文件引用 `main.css` 的类。排查方法：`grep -n "@apply" src/styles/markdown.css`，逐个确认有没有引用外部自定义类。修复同样是内联：

```css
/* ❌ @apply btn-regular-dark（依赖 main.css，顺序不定会失败） */
@apply btn-regular-dark opacity-0 shadow-lg ...;

/* ✅ 内联为 Tailwind 内置工具类，文件自包含 */
@apply flex items-center justify-center
  bg-[oklch(0.45_0.01_var(--hue))] hover:bg-[oklch(0.50_0.01_var(--hue))] ...
  dark:bg-[oklch(0.30_0.02_var(--hue))] ...
  opacity-0 shadow-lg ...;
```

**验证冷缓存构建**（CI 每次都是冷缓存）：`rm -rf .astro dist && npx astro build` 连续跑 5 次，全过才算真修好。

### 真正的环境抖动

如果报 `transport invoke timed out` 这类 vite 内部错误，才是环境抖动，重跑即可。但**如果报明确的 `xxx class does not exist` / `xxx is not defined`，一定是代码问题**，别靠重跑碰运气。

---

## 7. 其他零碎经验

### `.astro.tmp` 临时文件

编辑器保存时可能产生 `xxx.astro.tmp.12345` 文件，Astro 会警告：

```
Unsupported file type ... Prefix filename with an underscore
```

删除即可，不是错误：

```bash
rm -f src/pages/**/*.tmp.*
```

### CRLF 换行符导致 Edit 匹配失败

从 Windows 上传的文件可能带 `\r\n`，导致精确匹配文本失败（报 `String to replace not found`）。转成 LF：

```bash
sed -i 's/\r$//' 文件名
```

### git push 前记得先 commit

`git push` 显示 `Everything up-to-date` 是因为还没 `git add && git commit`。三步走：

```bash
git add .
git commit -m "描述"
git push
```

### 迁移文件用 git mv

移动文章到新分类用 `git mv`，git 能识别为「重命名」而非「删除+新增」，历史记录更干净：

```bash
git mv 旧路径 新路径
```

---

## 8. 排查思路总结

遇到 Astro 报错，按这个顺序查：

1. **看完整报错**：`pnpm astro build 2>&1 | grep -B5 -A15 'error'`，别只看第一行
2. **看是不是花括号**：模板里 `{xxx}` 是否该转义/放变量
3. **看是不是 params**：getStaticPaths 返回值是否符合 string
4. **看是不是 getEntry**：中文路径解析失败 → 改 getCollection + props
5. **重跑一次**：排除环境抖动

---

## 9. 工作台改造阶段补充踩坑

### 9.1 `client:only` + Svelte 5 类型报错 → 升级 @astrojs/svelte

#### 现象

`.astro` 里用 `<Comp client:only="svelte">` 报类型错误：

```
src/components/Navbar.astro:55:14 - error ts(2322):
Type '{ "client:only": string; }' is not assignable to
type 'IntrinsicAttributes & Record<string, never>'
```

有的 `client:only` 组件报、有的不报——取决于组件是 **Svelte 5 runes 模式**（`$state`/`$props()`）还是 legacy 模式（`export let`）、有没有显式 props。

#### 原因

`@astrojs/svelte` 7.2.3 对 Svelte 组件 `client:*` 指令的类型生成有 bug：runes 组件 / 带 props 组件的类型是"闭合"的，`client:only` 被当成不存在的 prop。

#### 解决

**升级 `@astrojs/svelte` 到 7.2.4**（2025-12 官方修复："Fixes an issue where Svelte components used in Astro files would incorrectly report type errors when using client:* directives"）：

```bash
pnpm add @astrojs/svelte@7.2.4
```

另外 ArchivePanel 这类组件报 `Type '{ sortedPosts; "client:only" }' is not assignable`，是**必填 prop 没传**（tags/categories 声明了 `export let` 但从不从 Astro 传，组件内用 URL 参数覆盖）——改成带默认值的可选 prop 即可：

```svelte
// ❌ export let tags: string[];   → 必填
// ✅ export let tags: string[] = [];  → 可选，组件内再覆盖
```

### 9.2 全仓库 CRLF → biome CI 全红 → .gitattributes

#### 现象

`biome ci ./src` 报几十个 `format` 错误（本项目当时 64 个），错误内容是"Formatter would have printed..."，且 git diff 全是整行变化。

#### 原因

仓库多数文件是 **Windows CRLF（`\r\n`）**，而 biome 的 formatter 默认 **LF**。biome 一检查就认为格式不对，于是 CI 的 `biome ci` 工作流一直红。混合行尾还会让 diff 噪音巨大、工具反复"修正"文件。

#### 解决

加 `.gitattributes` 统一行尾为 LF，并一次性转换：

```text
# .gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
```

```bash
# 一次性把所有 CRLF 文本文件转 LF
grep -rlP "\r$" --include="*.astro" --include="*.ts" --include="*.svelte" --include="*.css" --include="*.md" . \
  | grep -vE "node_modules|/dist/|/\.astro/" | xargs sed -i 's/\r$//'
```

`.gitattributes` 让 Git 统一以 LF 入库，之后在 Windows 上编辑重新引入 CRLF 也会被 Git 自动转回。转换后 `git add -A` 会是一次性的整文件 diff，属正常。

> 教训：**永久红的 CI 形同虚设**——红到麻木后，哪天真引入错误也发现不了。要么全绿，要么别配 CI。

### 9.3 设计 Token 用了但没定义（--text-muted / --text）

#### 现象

页面上"次要文字"（日期、计数、摘要）颜色异常——有时回退纯黑（亮色下全黑），CSS 变量看起来"没生效"。

#### 原因

代码里大量使用 `text-[var(--text-muted)]`、`text-[var(--text)]`，但这两个变量**从未在 `variables.styl` 定义**。CSS 里 `color: var(--text-muted)` 遇到未定义变量 → 该声明无效 → 回退继承色。

#### 排查

```js
// 浏览器里查变量是否存在
getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
// 返回空字符串 = 未定义
```

#### 解决

在 `variables.styl` 的 `define()` 里补上双模式 token（亮/暗两值）：

```styl
--text: oklch(0.25 0.02 var(--hue)) oklch(0.87 0.02 var(--hue))
--text-muted: oklch(0.45 0.02 var(--hue)) oklch(0.60 0.02 var(--hue))
```

> 教训：**用到的变量必须可查**。全局搜 `var(--xxx)` 后，逐一确认定义存在，别假设框架/主题提供了。

### 9.4 `card-base` 组件类覆盖 hover:bg 工具类

#### 现象

在元素上同时挂 `card-base` 和 `hover:bg-[var(--btn-card-bg-hover)]`，hover 时背景不变化。

#### 原因

`card-base` 在 `main.css` 里用 `@apply bg-[var(--card-bg)]`。本项目构建的 CSS 没有 `@layer`（Tailwind 工具类和组件类源码顺序排列），`card-base` 排在工具类**之后**，同特异性下后定义的覆盖前面的 → `hover:bg-...` 失效。

#### 排查

```js
// 检查生成规则顺序
[...document.styleSheets].flatMap(s => [...s.cssRules].map(r => r.selectorText))
// .card-base 在 .hover\:bg-... 之后 → 覆盖
```

#### 解决

**不要用裸工具类覆盖 `card-base` 的背景**。仿照现有 `btn-regular` 的写法，把 hover/active 状态**内聚进一个组件类**（PostCard 不再挂 `card-base`）：

```css
.post-card {
  @apply rounded-[var(--radius-large)] overflow-hidden bg-[var(--card-bg)] transition
         hover:bg-[var(--btn-card-bg-hover)] active:bg-[var(--btn-card-bg-active)];
}
```

> 注：`hover:border-...`、`hover:shadow-...` 这类**不改 background-color 的属性**不受影响，所以别的页面用 `hover:border` 一直正常。

### 9.5 知识库子分类误判：文章文件名被当子分类

#### 现象

分类页多出"假子分类"——例如 `密码学/对称加密/` 页面出现子分类 `aes-modes` 计数 0，而 `aes-modes.md` 其实是一篇直接文章。

#### 原因

`kb/[...slug].astro` 里判断子分类的条件是 `parts.length > prefixLen`，对 3 级路径的文章（`大类/子分类/文章.md`），`parts[prefixLen]` 取到的是**文章文件名**（去掉 .md 的 slug），被误当成子分类目录。

#### 解决

改成 `parts.length > prefixLen + 1`——只有当路径比「当前节点 + 1」**更深**时（说明后面还有内容，确实是目录）才算子分类：

```js
// ❌ if (parts.length > prefixLen) subcategories.add(parts[prefixLen]);
// ✅ 仅当更深一层才算真正的子分类目录
if (parts.length > prefixLen + 1) subcategories.add(parts[prefixLen]);
```

### 9.6 网页播放 FLAC：转 mp3 + 提封面

#### 现象

本地歌单放进去 FLAC 文件，Safari 播放器直接没声音（`audio.error`），且单曲 50MB 加载极慢。

#### 原因

**Safari 不支持 `<audio>` 播放 FLAC**（Chrome/Firefox 支持），而且 FLAC 是无损大文件，网页场景带宽浪费严重。

#### 解决

用 ffmpeg 转成网页友好的 mp3（192kbps，单曲 3-6MB），顺便提取内嵌封面：

```bash
# 转 mp3（Safari/所有浏览器可播）
ffmpeg -i "input.flac" -codec:a libmp3lame -b:a 192k "output.mp3"

# 提取内嵌专辑封面（mjpeg 流 → jpg）
ffmpeg -i "output.mp3" -an -c:v copy "cover.jpg"
# 检查是否有封面
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "output.mp3"
# → mjpeg 表示有内嵌封面
```

另注意：含中文/空格/括号的文件名**不要手动改 src 编码**——浏览器会自动对 `<audio src>` 做 URL 编码，直接用原始文件名即可。

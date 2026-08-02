---
title: Astro 开发踩坑记录
date: 2026-08-03
tags: [astro, 前端, 踩坑, 路由, 调试]
summary: 本博客（Astro 5 + Fuwari）开发过程中遇到的真实报错与解决方案——getStaticPaths、花括号转义、getEntry 中文路径、Mermaid 集成等。
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

**第三步**：页面加载 mermaid（CDN），`startOnLoad` 自动渲染：

```js
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true, theme: "dark" });
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

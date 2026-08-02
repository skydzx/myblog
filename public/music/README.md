# 音乐播放器音轨

当前内置 5 首（音源来自本地上传，已转 mp3 保证浏览器兼容，封面图在同目录 `covers/`）：

| 文件名 | 歌名 | 作者 |
|--------|------|------|
| `傅梦彤 - 潮汐 (Natural).mp3` | 潮汐 (Natural) | 傅梦彤 |
| `三角洲行动、Lithium Done - Dawn (黎明将至).mp3` | Dawn (黎明将至) | 三角洲行动、Lithium Done |
| `Eminem、ST.one - Ass Like That (0.9X版)(DJ ST.one版).mp3` | Ass Like That (0.9X版) | Eminem、ST.one |
| `Henry Young、Ashley Alisha - One More Last Time.mp3` | One More Last Time | Henry Young、Ashley Alisha |
| `Manafest - Edge of My Life.mp3` | Edge of My Life | Manafest |

封面图用 `ffmpeg -i input.mp3 -an -c:v copy cover.jpg` 从音频内嵌封面提取。

## 添加 / 删除音轨

1. **放文件**：把 mp3 / ogg 放进本目录。
2. **登记**：在 `src/config.ts` 的 `musicConfig.tracks` 里加一行（`src` 写文件名即可，浏览器会自动 URL 编码中文/空格/括号）：
   ```ts
   { title: "歌名", artist: "作者", src: "/music/我的歌.mp3", cover: "/music/covers/我的歌.jpg" },
   ```
3. **可选**：音频有内嵌封面就提取到 `covers/`；没有就删掉 `cover` 字段（播放器会用渐变占位）。
4. **提交推送** → Cloudflare 自动重新部署。

## 提示

- **建议用 mp3**：Safari 不支持 `<audio>` 播放 FLAC，且 FLAC 体积大（网页场景浪费带宽）。本地源文件是 FLAC 的话，先转一下：
  ```bash
  ffmpeg -i "x.flac" -codec:a libmp3lame -b:a 192k "x.mp3"
  ```
- 音源文件走本站 CDN（Cloudflare Pages），无第三方依赖。

# 音乐播放器音轨

把 mp3 / ogg 音频文件放进本目录，然后在 `src/config.ts` 的 `musicConfig.tracks` 里登记即可。

```ts
export const musicConfig = {
	enable: true,
	tracks: [
		{ title: "歌名", artist: "作者", src: "/music/01-track.mp3" },
		{ title: "第二首", artist: "作者", src: "/music/02-track.mp3" },
	],
};
```

说明：
- `src` 路径以 `/music/` 开头，指向本目录下的文件。
- 文件走本站 CDN（Cloudflare Pages），稳定、无第三方依赖。
- 更新 `musicConfig.tracks` 后重新部署即可生效。

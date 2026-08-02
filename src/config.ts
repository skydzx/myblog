import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "棋密",
	subtitle: "Network Security · Cryptography · AI Security",
	siteStart: "2026-07-26",
	lang: "zh_CN",
	themeColor: {
		hue: 160,
		fixed: false,
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png",
		position: "center",
		credit: {
			enable: false,
			text: "",
			url: "",
		},
	},
	toc: {
		enable: true,
		depth: 2,
	},
	announcement: {
		enable: true,
		title: "公告",
		content: "欢迎来到棋密，记录网络安全 / 密码学 / CTF 的学习与实践。",
		link: "/kb/",
		linkText: "进入知识库 →",
	},
	favicon: [],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "知识库",
			url: "/kb/",
			external: false,
		},
		{
			name: "文档",
			url: "/docs/",
			external: false,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png",
	name: "极弈侠",
	bio: "常州信息职业技术大学 · 网络安全专业 | CTF / 渗透测试 / 密码学",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/skydzx",
		},
		{
			name: "RSS",
			icon: "fa6-solid:rss",
			url: "/rss.xml",
		},
	],
};

// 音乐播放器音轨列表：把 mp3 文件放入 public/music/，然后在此按格式填写。
// 例：{ title: "歌名", artist: "作者", src: "/music/01-track.mp3" }
export const musicConfig = {
	enable: true,
	tracks: [
		{ title: "潮汐 (Natural)", artist: "傅梦彤", src: "/music/傅梦彤 - 潮汐 (Natural).mp3", cover: "/music/covers/傅梦彤 - 潮汐 (Natural).jpg" },
		{ title: "Dawn (黎明将至)", artist: "三角洲行动、Lithium Done", src: "/music/三角洲行动、Lithium Done - Dawn (黎明将至).mp3", cover: "/music/covers/三角洲行动、Lithium Done - Dawn (黎明将至).jpg" },
		{ title: "Ass Like That (0.9X版)", artist: "Eminem、ST.one", src: "/music/Eminem、ST.one - Ass Like That (0.9X版)(DJ ST.one版).mp3", cover: "/music/covers/Eminem、ST.one - Ass Like That (0.9X版)(DJ ST.one版).jpg" },
		{ title: "One More Last Time", artist: "Henry Young、Ashley Alisha", src: "/music/Henry Young、Ashley Alisha - One More Last Time.mp3", cover: "/music/covers/Henry Young、Ashley Alisha - One More Last Time.jpg" },
		{ title: "Edge of My Life", artist: "Manafest", src: "/music/Manafest - Edge of My Life.mp3", cover: "/music/covers/Manafest - Edge of My Life.jpg" },
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};

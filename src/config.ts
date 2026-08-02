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

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};

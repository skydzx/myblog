import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import { siteConfig } from "@/config";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}

export type SiteStats = {
	uptimeText: string;
	totalWords: number;
	lastUpdatedText: string;
};

/** 粗略统计正文"字数"：剔除代码块/行内代码/标记符/空白后统计字符数 */
const countContentChars = (text: string): number =>
	text
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`]*`/g, "")
		.replace(/[#>*_~|]/g, "")
		.replace(/\s/g, "").length;

const formatRelativeTime = (date: Date): string => {
	const diff = Date.now() - date.getTime();
	const day = 86400000;
	if (diff < day) return "today";
	const days = Math.floor(diff / day);
	if (days < 30) return `${days} days ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months} months ago`;
	return `${Math.floor(months / 12)} years ago`;
};

/** 终端 hero 站点统计：运行时长 / 全站字数 / 最后更新 */
export async function getSiteStats(): Promise<SiteStats> {
	const [posts, kbEntries] = await Promise.all([
		getSortedPosts(),
		getCollection("kb"),
	]);

	let totalWords = 0;
	let lastDate: Date | null = null;
	const consider = (d?: Date | null) => {
		if (d && (!lastDate || d > lastDate)) lastDate = d;
	};

	for (const p of posts) {
		totalWords += countContentChars(p.body ?? "");
		consider(p.data.published);
		if (p.data.updated) consider(p.data.updated);
	}
	for (const k of kbEntries) {
		totalWords += countContentChars(k.body ?? "");
		consider(k.data.date);
	}

	const start = new Date(siteConfig.siteStart);
	const elapsed = Math.max(0, Date.now() - start.getTime());
	const days = Math.floor(elapsed / 86400000);
	const hours = Math.floor((elapsed % 86400000) / 3600000);
	const mins = Math.floor((elapsed % 3600000) / 60000);
	const uptimeText = `up ${days}d ${hours}h ${mins}m`;

	return {
		uptimeText,
		totalWords,
		lastUpdatedText: lastDate ? formatRelativeTime(lastDate) : "N/A",
	};
}

<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

// 占位浏览量：本地自增，后续可接入 umami / 自建计数服务
let count = $state(0);

onMount(() => {
	const key = "qimi-post-views";
	const views = Number(localStorage.getItem(key) || "0") + 1;
	localStorage.setItem(key, String(views));
	count = views;
});
</script>

<div class="flex flex-row items-center">
	<div class="transition h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 flex items-center justify-center mr-2">
		<Icon icon="material-symbols:visibility-outline-rounded" class="text-sm" />
	</div>
	<span class="text-sm text-50">{count}</span>
</div>

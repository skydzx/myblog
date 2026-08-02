<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

interface Props {
	title: string;
	content: string;
	link?: string;
	linkText?: string;
}
let { title, content, link, linkText }: Props = $props();

const STORAGE_KEY = "qimi-announcement-closed";

let visible = $state(false);

onMount(() => {
	if (localStorage.getItem(STORAGE_KEY) !== "1") {
		visible = true;
	}
});

const close = () => {
	visible = false;
	localStorage.setItem(STORAGE_KEY, "1");
};
</script>

{#if visible}
	<div class="card-base relative p-4 pr-9 transition">
		<button
			on:click={close}
			aria-label="关闭公告"
			class="btn-plain absolute top-2 right-2 rounded-lg w-7 h-7 active:scale-90"
		>
			<Icon icon="material-symbols:close-rounded" class="text-[var(--btn-content)] text-xl" />
		</button>
		<h3 class="font-bold text-sm text-neutral-900 dark:text-neutral-100 relative ml-4 mb-2
			before:w-1 before:h-3.5 before:rounded-md before:bg-[var(--primary)]
			before:absolute before:left-[-12px] before:top-[2px]">{title}</h3>
		<p class="text-sm text-[var(--text-muted)] leading-relaxed mb-2">{content}</p>
		{#if link}
			<a href={link} class="link text-sm text-[var(--primary)] font-medium">
				{linkText || "了解更多 →"}
			</a>
		{/if}
	</div>
{/if}

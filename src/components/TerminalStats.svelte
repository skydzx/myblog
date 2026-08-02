<script lang="ts">
import { onMount } from "svelte";

interface Props {
	uptimeText: string;
	totalWords: number;
	lastUpdatedText: string;
}
let { uptimeText, totalWords, lastUpdatedText }: Props = $props();

type Line = {
	command: string;
	result: string;
	countUp?: number;
	unit?: string;
};

const lines: Line[] = [
	{ command: "uptime", result: uptimeText },
	{ command: "wc -w", countUp: totalWords, unit: " 字", result: "" },
	{ command: "git log -1 --pretty=%cr", result: lastUpdatedText },
];

const prefersReduced =
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let currentLine = $state(0);
let typedChars = $state(0);
let resultVisible = $state(false);
let countValue = $state(0);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

const countUp = async (target: number) => {
	const duration = 900;
	const start = performance.now();
	while (performance.now() - start < duration) {
		const t = (performance.now() - start) / duration;
		countValue = Math.round(target * easeOut(t));
		await new Promise((r) => requestAnimationFrame(r));
	}
	countValue = target;
};

const displayResult = (line: Line) =>
	line.countUp !== undefined
		? `${countValue.toLocaleString("en-US")}${line.unit}`
		: line.result;

onMount(async () => {
	if (prefersReduced) {
		currentLine = lines.length;
		countValue = totalWords;
		return;
	}
	for (let i = 0; i < lines.length; i++) {
		currentLine = i;
		typedChars = 0;
		resultVisible = false;
		for (let c = 0; c <= lines[i].command.length; c++) {
			typedChars = c;
			await sleep(35);
		}
		resultVisible = true;
		if (lines[i].countUp !== undefined) await countUp(lines[i].countUp);
		await sleep(240);
	}
	currentLine = lines.length;
});
</script>

<div class="font-code">
	{#each lines as line, i}
		{#if i < currentLine}
			<div class="mb-1.5">
				<p class="text-[var(--terminal-muted)]">
					<span class="font-bold text-[var(--terminal-prompt)]">$</span> {line.command}
				</p>
				<p class="pl-4 text-[var(--terminal-text)]">{displayResult(line)}</p>
			</div>
		{:else if i === currentLine}
			<div class="mb-1.5">
				<p class="text-[var(--terminal-muted)]">
					<span class="font-bold text-[var(--terminal-prompt)]">$</span>
					{line.command.slice(0, typedChars)}
					{#if typedChars < line.command.length}
						<span class="inline-block w-2 h-[0.95em] align-middle bg-[var(--terminal-prompt)] animate-pulse"></span>
					{/if}
				</p>
				{#if resultVisible}
					<p class="pl-4 text-[var(--terminal-text)]">{displayResult(line)}</p>
				{/if}
			</div>
		{/if}
	{/each}
</div>

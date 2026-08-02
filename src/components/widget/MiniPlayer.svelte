<script lang="ts">
import Icon from "@iconify/svelte";
import { onDestroy, onMount } from "svelte";

type Track = { title: string; artist: string; src: string };

// 占位音源：先交付交互壳，接入真实音频时替换 src 即可
const tracks: Track[] = [
	{ title: "Placeholder Loop", artist: "本地示例 · 待接入", src: "" },
	{ title: "棋密 · Terminal", artist: "环境音示例", src: "" },
];

let current = $state(0);
let playing = $state(false);
let progress = $state(0); // 0 - 100
let volume = $state(70);
let muted = $state(false);

let timer: ReturnType<typeof setInterval> | undefined;

const prefersReduced =
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

onMount(() => {
	// 播放开始后模拟进度推进；接入真实 <audio> 后替换为 timeupdate 事件
});

onDestroy(() => {
	if (timer) clearInterval(timer);
});

const startProgress = () => {
	if (timer) clearInterval(timer);
	timer = setInterval(() => {
		progress = (progress + 0.6) % 100;
	}, 400);
};

const toggle = () => {
	playing = !playing;
	if (playing) startProgress();
	else if (timer) clearInterval(timer);
};

const next = () => {
	current = (current + 1) % tracks.length;
	progress = 0;
	if (playing) startProgress();
};

const prev = () => {
	current = (current - 1 + tracks.length) % tracks.length;
	progress = 0;
	if (playing) startProgress();
};

const setVolume = (v: number) => {
	volume = v;
	muted = v === 0;
};
</script>

<div class="card-base p-4 transition">
	<h3 class="font-bold text-sm text-neutral-900 dark:text-neutral-100 relative ml-4 mb-3
		before:w-1 before:h-3.5 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:left-[-12px] before:top-[2px]">音乐</h3>

	<div class="flex items-center gap-3">
		<!-- 封面占位 -->
		<div class="w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-[var(--primary)] to-[var(--btn-regular-bg)] flex items-center justify-center"
			class:animate-spin={playing && !prefersReduced}>
			<Icon icon="material-symbols:music-note-rounded" class="text-2xl text-white/90" />
		</div>

		<!-- 歌名 / 作者 -->
		<div class="min-w-0 flex-1">
			<div class="font-medium text-sm text-[var(--text)] truncate">{tracks[current].title}</div>
			<div class="text-xs text-[var(--text-muted)] truncate mt-0.5">{tracks[current].artist}</div>
		</div>
	</div>

	<!-- 进度条 -->
	<div class="mt-3 h-1.5 rounded-full bg-[var(--btn-regular-bg)] overflow-hidden">
		<div class="h-full bg-[var(--primary)] transition-all duration-300 rounded-full" style={`width: ${progress}%`}></div>
	</div>

	<!-- 控制 -->
	<div class="mt-3 flex items-center justify-center gap-3">
		<button on:click={prev} aria-label="上一首" class="btn-regular rounded-lg w-9 h-9 active:scale-90">
			<Icon icon="material-symbols:skip-previous-rounded" class="text-xl text-[var(--btn-content)]" />
		</button>
		<button on:click={toggle} aria-label={playing ? "暂停" : "播放"} class="btn-regular rounded-full w-11 h-11 active:scale-90">
			<Icon icon={playing ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} class="text-2xl text-[var(--btn-content)]" />
		</button>
		<button on:click={next} aria-label="下一首" class="btn-regular rounded-lg w-9 h-9 active:scale-90">
			<Icon icon="material-symbols:skip-next-rounded" class="text-xl text-[var(--btn-content)]" />
		</button>
	</div>

	<!-- 音量 -->
	<div class="mt-3 flex items-center gap-2">
		<button on:click={() => setVolume(muted ? 70 : 0)} aria-label="静音" class="btn-plain rounded-lg w-7 h-7 shrink-0">
			<Icon icon={muted ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} class="text-lg text-[var(--btn-content)]" />
		</button>
		<input
			type="range" min="0" max="100" bind:value={volume}
			on:input={(e) => { const v = Number((e.currentTarget as HTMLInputElement).value); setVolume(v); }}
			class="w-full h-1.5 accent-[var(--primary)]"
			aria-label="音量"
		/>
	</div>
</div>

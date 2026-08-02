<script lang="ts">
	import Icon from "@iconify/svelte";

	type Track = { title: string; artist: string; src: string };

	interface Props {
		tracks: Track[];
	}
	let { tracks }: Props = $props();

	let audio: HTMLAudioElement | undefined;
	let current = $state(0);
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(70);
	let muted = $state(false);

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const formatTime = (s: number): string => {
		if (!isFinite(s) || s < 0) s = 0;
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, "0")}`;
	};

	let previousCurrent = $state(-1);
	$effect(() => {
		const idx = current;
		if (audio && idx !== previousCurrent) {
			previousCurrent = idx;
			audio.src = tracks[idx]?.src ?? "";
			audio.load();
			if (playing) audio.play().catch(() => {});
		}
	});

	$effect(() => {
		if (!audio) return;
		audio.volume = volume / 100;
		audio.muted = muted;
	});

	const toggle = () => {
		if (!audio) return;
		if (audio.paused) audio.play().catch(() => {});
		else audio.pause();
	};

	const next = () => {
		if (tracks.length > 0) {
			current = (current + 1) % tracks.length;
			currentTime = 0;
			duration = 0;
		}
	};

	const prev = () => {
		if (tracks.length > 0) {
			current = (current - 1 + tracks.length) % tracks.length;
			currentTime = 0;
			duration = 0;
		}
	};

	const seekTo = (v: number) => {
		if (audio) audio.currentTime = v;
	};

	const setVolume = (v: number) => {
		volume = v;
		muted = v === 0;
	};

	const toggleMute = () => {
		muted = !muted;
	};
</script>

<audio
	bind:this={audio}
	preload="metadata"
	on:timeupdate={() => (currentTime = audio?.currentTime ?? 0)}
	on:loadedmetadata={() => (duration = audio?.duration ?? 0)}
	on:ended={next}
	on:play={() => (playing = true)}
	on:pause={() => (playing = false)}
	on:error={() => (playing = false)}
></audio>

<div class="card-base p-4 transition">
	<h3 class="font-bold text-sm text-neutral-900 dark:text-neutral-100 relative ml-4 mb-3
		before:w-1 before:h-3.5 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:left-[-12px] before:top-[2px]">音乐</h3>

	{#if tracks.length === 0}
		<p class="text-sm text-[var(--text-muted)] leading-relaxed">暂无音乐。将 mp3 放入 <code class="font-code text-xs bg-[var(--btn-regular-bg)] px-1 py-0.5 rounded">public/music/</code> 后更新配置即可。</p>
	{:else}
	<div class="flex items-center gap-3">
		<!-- 封面占位 -->
		<div class="w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-[var(--primary)] to-[var(--btn-regular-bg)] flex items-center justify-center"
			class:animate-spin={playing && !prefersReduced}>
			<Icon icon="material-symbols:music-note-rounded" class="text-2xl text-white/90" />
		</div>

		<!-- 歌名 / 作者 -->
		<div class="min-w-0 flex-1">
			<div class="font-medium text-sm text-[var(--text)] truncate">{tracks[current]?.title ?? "—"}</div>
			<div class="text-xs text-[var(--text-muted)] truncate mt-0.5">{tracks[current]?.artist ?? ""}</div>
		</div>
	</div>

	<!-- 进度条 + 时间 -->
	<input
		type="range" min="0" max={duration || 0} step="1"
		value={currentTime}
		on:input={(e) => seekTo(Number((e.currentTarget as HTMLInputElement).value))}
		class="mt-3 w-full h-1.5 accent-[var(--primary)]"
		aria-label="播放进度"
		disabled={!tracks[current]?.src}
	/>
	<div class="flex justify-between text-xs text-[var(--text-muted)] mt-1">
		<span>{formatTime(currentTime)}</span>
		<span>{formatTime(duration)}</span>
	</div>

	<!-- 控制 -->
	<div class="mt-3 flex items-center justify-center gap-3">
		<button on:click={prev} aria-label="上一首" class="btn-regular rounded-lg w-9 h-9 active:scale-90">
			<Icon icon="material-symbols:skip-previous-rounded" class="text-xl text-[var(--btn-content)]" />
		</button>
		<button on:click={toggle} aria-label={playing ? "暂停" : "播放"} disabled={!tracks[current]?.src}
			class="btn-regular rounded-full w-11 h-11 active:scale-90 disabled:opacity-40">
			<Icon icon={playing ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} class="text-2xl text-[var(--btn-content)]" />
		</button>
		<button on:click={next} aria-label="下一首" class="btn-regular rounded-lg w-9 h-9 active:scale-90">
			<Icon icon="material-symbols:skip-next-rounded" class="text-xl text-[var(--btn-content)]" />
		</button>
	</div>

	<!-- 音量 -->
	<div class="mt-3 flex items-center gap-2">
		<button on:click={toggleMute} aria-label="静音" class="btn-plain rounded-lg w-7 h-7 shrink-0">
			<Icon icon={muted || volume === 0 ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} class="text-lg text-[var(--btn-content)]" />
		</button>
		<input
			type="range" min="0" max="100" value={volume}
			on:input={(e) => setVolume(Number((e.currentTarget as HTMLInputElement).value))}
			class="w-full h-1.5 accent-[var(--primary)]"
			aria-label="音量"
		/>
	</div>
	{/if}
</div>

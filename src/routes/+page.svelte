<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isRefreshing = $state(false);

	async function refreshMenu() {
		isRefreshing = true;
		try {
			await invalidateAll();
		} finally {
			isRefreshing = false;
		}
	}

	function formatTime(value: string) {
		return new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Stockholm',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

<svelte:head>
	<title>Dagens lunch · Nära Lunch</title>
	<meta
		name="description"
		content="Se dagens lunch hos Björkmans Skafferi i Gullbergsvass, Göteborg."
	/>
</svelte:head>

<div class="page">
	<header class="topbar">
		<a class="brand" href="/" aria-label="Nära Lunch, startsida">
			<span class="brand-mark" aria-hidden="true">
				<svg viewBox="0 0 36 36" fill="none">
					<path d="M7 18.5h22M10 18.5c0 6 3.2 9.5 8 9.5s8-3.5 8-9.5M13 11.5c0-2 2-2 2-4m5 4c0-2 2-2 2-4" />
				</svg>
			</span>
			<span>Nära<span class="brand-light">Lunch</span></span>
		</a>
		<div class="location-pill">
			<span class="location-dot"></span>
			<span>GULLBERGSVASS, GÖTEBORG</span>
		</div>
	</header>

	<main>
		<section class="hero">
			<div class="hero-copy">
				<p class="eyebrow"><span class="eyebrow-line"></span> LUNCH, UTAN OMVÄGAR</p>
				<h1>Vad blir det<br />till <span>lunch?</span></h1>
				<p class="intro">
					Dagens meny från ett utvalt ställe nära dig. Rakt på sak, så du hinner njuta av rasten.
				</p>
				<div class="today-chip">
					<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<rect x="3" y="4.5" width="14" height="12" rx="2" />
						<path d="M6.5 2.5v4M13.5 2.5v4M3 8h14" />
					</svg>
					<span>I dag, {data.menu.dateLabel}</span>
				</div>
			</div>

			<div class="hero-art" aria-hidden="true">
				<div class="sun-disc"></div>
				<div class="plate plate-outer">
					<div class="plate plate-inner">
						<div class="food food-one"></div>
						<div class="food food-two"></div>
						<div class="food food-three"></div>
						<div class="food food-four"></div>
						<div class="food food-five"></div>
						<div class="food food-six"></div>
					</div>
				</div>
				<div class="art-caption"><span>GOTT</span><span> & </span><span>NÄRA</span></div>
				<div class="sparkle sparkle-one">✳</div>
				<div class="sparkle sparkle-two">✳</div>
			</div>
		</section>

		<section class="lunch-section" aria-labelledby="results-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow section-eyebrow">DAGENS UTVALDA</p>
					<h2 id="results-heading">Lunch i närheten<span class="count">01</span></h2>
				</div>
				<button class="refresh-button" onclick={refreshMenu} disabled={isRefreshing}>
					<svg class:spinning={isRefreshing} viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<path d="M16.2 8A6.4 6.4 0 0 0 5.3 5.6L3.5 7.4M3.5 7.4V3.9M3.5 7.4H7M3.8 12a6.4 6.4 0 0 0 10.9 2.4l1.8-1.8m0 0v3.5m0-3.5H13" />
					</svg>
					{isRefreshing ? 'Uppdaterar…' : 'Uppdatera meny'}
				</button>
			</div>

			<article class="restaurant-card">
				<div class="restaurant-top">
					<div class="restaurant-identity">
						<div class="restaurant-monogram" aria-hidden="true">B<span>.</span></div>
						<div>
							<p class="restaurant-type">LUNCHRESTAURANG <span>·</span> GULLBERGSVASS</p>
							<h3>Björkmans Skafferi</h3>
							<p class="restaurant-address">
								<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path d="M13 6.7c0 3.5-5 7.3-5 7.3S3 10.2 3 6.7a5 5 0 1 1 10 0Z" />
									<circle cx="8" cy="6.5" r="1.6" />
								</svg>
								Kilsgatan 4, Göteborg
							</p>
						</div>
					</div>
					<div class="restaurant-meta">
						<div class="price">135 <span>kr</span></div>
						<p>lunch inkl. sallad, bröd & kaffe</p>
					</div>
				</div>

				<div class="menu-bar">
					<div class="menu-title">
						<span class="menu-indicator"></span>
						<strong>Dagens lunch</strong>
						<span class="menu-day">{data.menu.weekday}</span>
					</div>
					<span class="serving-hours">
						<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<circle cx="8" cy="8" r="6" />
							<path d="M8 4.5V8l2.2 1.4" />
						</svg>
						11.00–13.30
					</span>
				</div>

				{#if data.menu.status === 'available'}
					<div class="menu-list">
						{#each data.menu.items as item, index}
							<div class="dish">
								<span class="dish-number">{String(index + 1).padStart(2, '0')}</span>
								<div class="dish-copy">
									<h4>{item.title}</h4>
								</div>
								<span class="dish-arrow" aria-hidden="true">↗</span>
							</div>
						{/each}
					</div>
				{:else if data.menu.status === 'closed'}
					<div class="menu-message">
						<span class="message-icon">☼</span>
						<div>
							<h4>Ingen lunchservering idag</h4>
							<p>Björkmans Skafferi serverar lunch måndag till fredag.</p>
						</div>
					</div>
				{:else}
					<div class="menu-message">
						<span class="message-icon">!</span>
						<div>
							<h4>Menyn är inte tillgänglig</h4>
							<p>{data.menu.message}</p>
						</div>
					</div>
				{/if}

				<footer class="card-footer">
					<a href="https://www.bjorkmansskafferi.se/" target="_blank" rel="noreferrer">
						Se originalmenyn
						<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path d="M5 11 11 5M5.5 5H11v5.5" />
						</svg>
					</a>
					<span class="updated">
						<span class="status-dot"></span>
						{#if data.menu.status === 'available'}
							Hämtad {formatTime(data.menu.fetchedAt)}
						{:else}
							Officiell källa
						{/if}
					</span>
				</footer>
			</article>
		</section>

		<p class="source-note">
			Dagens rätter hämtas från
			<a href="https://www.bjorkmansskafferi.se/" target="_blank" rel="noreferrer">
				Björkmans Skafferi
			</a>.
			Läs fulla beskrivningar där. Priser och rätter kan ändras.
		</p>
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		background: #f7f6f1;
		color: #202820;
		font-family:
			'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	:global(button),
	:global(a) {
		font: inherit;
	}

	.page {
		max-width: 1440px;
		margin: 0 auto;
		padding: 0 7.2%;
	}

	.topbar {
		height: 92px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #e8e7df;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 11px;
		color: #27392e;
		font-size: 19px;
		font-weight: 750;
		letter-spacing: -0.8px;
		text-decoration: none;
	}

	.brand-light {
		font-weight: 400;
	}

	.brand-mark {
		width: 37px;
		height: 37px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #365744;
	}

	.brand-mark svg {
		width: 25px;
		stroke: #f7f6f1;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.location-pill {
		display: flex;
		align-items: center;
		gap: 9px;
		color: #667068;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1.1px;
	}

	.location-dot,
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #c17e47;
	}

	main {
		max-width: 1010px;
		margin: 0 auto;
	}

	.hero {
		position: relative;
		overflow: hidden;
		min-height: 365px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 42px 2px 32px;
	}

	.hero-copy {
		position: relative;
		z-index: 1;
		max-width: 490px;
	}

	.eyebrow {
		display: flex;
		align-items: center;
		gap: 9px;
		margin: 0;
		color: #a5683d;
		font-size: 10px;
		font-weight: 750;
		letter-spacing: 1.75px;
	}

	.eyebrow-line {
		width: 23px;
		height: 1px;
		background: #b97849;
	}

	h1 {
		margin: 20px 0 13px;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(55px, 6.1vw, 78px);
		font-weight: 400;
		letter-spacing: -4px;
		line-height: 0.97;
	}

	h1 span {
		color: #45684f;
		font-style: italic;
	}

	.intro {
		max-width: 375px;
		margin: 19px 0 21px;
		color: #747a72;
		font-size: 14px;
		line-height: 1.75;
	}

	.today-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 13px;
		border: 1px solid #e4e3d9;
		border-radius: 30px;
		background: #fbfaf6;
		color: #516251;
		font-size: 11px;
		font-weight: 650;
	}

	.today-chip svg {
		width: 15px;
		stroke: #66836a;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.3;
	}

	.hero-art {
		position: relative;
		width: 330px;
		height: 300px;
		margin: 0 43px 0 15px;
		flex: 0 0 330px;
	}

	.sun-disc {
		position: absolute;
		top: 22px;
		left: 70px;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: #e9dac4;
	}

	.plate {
		position: absolute;
		display: grid;
		place-items: center;
		border-radius: 50%;
	}

	.plate-outer {
		top: 36px;
		left: 42px;
		width: 233px;
		height: 233px;
		background: #fffefa;
		box-shadow:
			0 19px 31px #7261431a,
			inset 0 0 0 1px #e6e2d7;
		transform: rotate(-12deg);
	}

	.plate-inner {
		position: relative;
		width: 184px;
		height: 184px;
		overflow: hidden;
		background: #e6c982;
		box-shadow: inset 0 0 0 11px #f4e3b4;
	}

	.food {
		position: absolute;
		border-radius: 50%;
		box-shadow: inset -4px -5px 0 #00000012;
	}

	.food-one {
		top: 32px;
		left: 36px;
		width: 48px;
		height: 34px;
		border-radius: 60% 40% 55% 45%;
		background: #6a8a50;
		transform: rotate(-24deg);
	}

	.food-two {
		top: 26px;
		right: 27px;
		width: 34px;
		height: 33px;
		background: #cc6650;
	}

	.food-three {
		top: 75px;
		left: 59px;
		width: 55px;
		height: 43px;
		border-radius: 45%;
		background: #d3a250;
		transform: rotate(20deg);
	}

	.food-four {
		right: 28px;
		bottom: 36px;
		width: 44px;
		height: 33px;
		background: #7f9b5b;
		transform: rotate(-26deg);
	}

	.food-five {
		bottom: 26px;
		left: 32px;
		width: 34px;
		height: 31px;
		background: #d87951;
	}

	.food-six {
		top: 60px;
		right: 42px;
		width: 12px;
		height: 12px;
		background: #f7f0dc;
		box-shadow:
			-90px 70px 0 #f7f0dc,
			-69px -18px 0 #f7f0dc,
			-29px 99px 0 #f7f0dc;
	}

	.art-caption {
		position: absolute;
		right: 4px;
		bottom: 14px;
		color: #667e60;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 14px;
		font-style: italic;
		letter-spacing: 1px;
		transform: rotate(-6deg);
	}

	.art-caption span:nth-child(2) {
		color: #b17a50;
	}

	.sparkle {
		position: absolute;
		color: #b77c50;
		font-size: 22px;
	}

	.sparkle-one {
		top: 28px;
		right: 23px;
	}

	.sparkle-two {
		bottom: 66px;
		left: 0;
		color: #678068;
		font-size: 15px;
	}

	.lunch-section {
		padding-top: 21px;
		border-top: 1px solid #e8e7df;
	}

	.section-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin: 0 0 17px;
	}

	.section-eyebrow {
		margin-bottom: 8px;
		color: #9a6b46;
		font-size: 9px;
	}

	.section-heading h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 29px;
		font-weight: 400;
		letter-spacing: -0.9px;
	}

	.count {
		display: inline-block;
		margin-left: 9px;
		color: #a0a297;
		font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		font-size: 10px;
		letter-spacing: 0;
		vertical-align: top;
	}

	.refresh-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 12px;
		border: 1px solid #deded5;
		border-radius: 4px;
		background: transparent;
		color: #526553;
		cursor: pointer;
		font-size: 11px;
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}

	.refresh-button:hover:not(:disabled) {
		border-color: #b8c2b5;
		background: #f0f1e9;
	}

	.refresh-button:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.refresh-button svg {
		width: 15px;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.4;
	}

	.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.restaurant-card {
		overflow: hidden;
		border: 1px solid #e7e5dc;
		border-radius: 7px;
		background: #fffefa;
		box-shadow: 0 4px 17px #343d2d08;
	}

	.restaurant-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 19px 24px 18px;
	}

	.restaurant-identity {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.restaurant-monogram {
		width: 46px;
		height: 46px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #e9eee5;
		color: #3c6348;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 25px;
		font-style: italic;
	}

	.restaurant-monogram span {
		color: #ba7b4e;
	}

	.restaurant-type {
		margin: 0 0 4px;
		color: #8d958d;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 1px;
	}

	.restaurant-type span {
		margin: 0 4px;
		color: #c38a60;
	}

	.restaurant-identity h3 {
		margin: 0;
		color: #2b382e;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 21px;
		font-weight: 400;
		letter-spacing: -0.3px;
	}

	.restaurant-address {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 5px 0 0;
		color: #858b83;
		font-size: 10px;
	}

	.restaurant-address svg {
		width: 13px;
		stroke: #8a9b88;
		stroke-width: 1.2;
	}

	.restaurant-meta {
		padding-left: 18px;
		border-left: 1px solid #eeece4;
		text-align: right;
	}

	.price {
		color: #394f3f;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 22px;
		line-height: 1;
	}

	.price span {
		font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		font-size: 12px;
	}

	.restaurant-meta p {
		margin: 6px 0 0;
		color: #92958d;
		font-size: 9px;
	}

	.menu-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 47px;
		padding: 0 24px;
		border-top: 1px solid #efeee8;
		border-bottom: 1px solid #efeee8;
		background: #fbfaf6;
	}

	.menu-title,
	.serving-hours {
		display: flex;
		align-items: center;
	}

	.menu-title {
		gap: 9px;
		font-size: 11px;
	}

	.menu-title strong {
		color: #354b3c;
		font-size: 12px;
		font-weight: 650;
	}

	.menu-indicator {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #c8814e;
	}

	.menu-day {
		padding: 4px 7px;
		border-radius: 2px;
		background: #ebeee6;
		color: #647462;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.serving-hours {
		gap: 6px;
		color: #7d857b;
		font-size: 10px;
	}

	.serving-hours svg {
		width: 14px;
		stroke: #829282;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.2;
	}

	.menu-list {
		padding: 0 24px;
	}

	.dish {
		display: grid;
		grid-template-columns: 31px 1fr 16px;
		gap: 10px;
		align-items: start;
		padding: 15px 0 14px;
		border-bottom: 1px solid #f0efe9;
	}

	.dish:last-child {
		border-bottom: 0;
	}

	.dish-number {
		padding-top: 2px;
		color: #b18a69;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 12px;
		font-style: italic;
	}

	.dish-copy h4 {
		margin: 0 0 5px;
		color: #34463a;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.35px;
	}

	.dish-arrow {
		padding-top: 1px;
		color: #b2b5aa;
		font-size: 14px;
	}

	.menu-message {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 25px 24px;
	}

	.message-icon {
		width: 29px;
		height: 29px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #f4ede3;
		color: #a66d43;
		font-size: 16px;
	}

	.menu-message h4 {
		margin: 0 0 4px;
		color: #3d4c3f;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 16px;
		font-weight: 400;
	}

	.menu-message p {
		margin: 0;
		color: #7c8279;
		font-size: 11px;
		line-height: 1.5;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		padding: 12px 24px;
		border-top: 1px solid #efeee8;
		background: #fbfaf6;
	}

	.card-footer a {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #4a694f;
		font-size: 10px;
		font-weight: 650;
		text-decoration: none;
	}

	.card-footer a:hover {
		text-decoration: underline;
	}

	.card-footer a svg {
		width: 13px;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.4;
	}

	.updated {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #92958d;
		font-size: 9px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		background: #75916c;
	}

	.source-note {
		margin: 14px 0 38px;
		color: #96988f;
		font-size: 9px;
		text-align: right;
	}

	.source-note a {
		color: #71806e;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (max-width: 720px) {
		.page {
			padding: 0 6%;
		}

		.topbar {
			height: 72px;
		}

		.location-pill {
			font-size: 8px;
			letter-spacing: 0.7px;
		}

		.hero {
			min-height: 315px;
			padding-top: 30px;
		}

		.hero-art {
			width: 230px;
			height: 245px;
			margin: 0 -18px 0 -52px;
			flex-basis: 230px;
			transform: scale(0.82);
		}

		.hero-copy {
			max-width: 360px;
		}

		h1 {
			font-size: clamp(48px, 9.5vw, 66px);
			letter-spacing: -3px;
		}

		.intro {
			max-width: 310px;
			font-size: 12px;
		}

		.restaurant-top,
		.menu-bar {
			padding-right: 17px;
			padding-left: 17px;
		}

		.menu-list {
			padding: 0 17px;
		}

		.card-footer {
			padding-right: 17px;
			padding-left: 17px;
		}
	}

	@media (max-width: 520px) {
		.location-pill {
			max-width: 150px;
			font-size: 7px;
		}

		.hero {
			min-height: unset;
			padding: 38px 0 32px;
		}

		.hero-copy {
			max-width: 100%;
		}

		h1 {
			font-size: 59px;
		}

		.intro {
			max-width: 295px;
		}

		.hero-art {
			position: absolute;
			right: -59px;
			width: 195px;
			height: 220px;
			margin: 10px 0 0;
			flex-basis: 195px;
			opacity: 0.27;
			transform: scale(0.69);
			transform-origin: center right;
		}

		.section-heading {
			align-items: flex-end;
		}

		.section-heading h2 {
			font-size: 23px;
		}

		.refresh-button {
			gap: 5px;
			padding: 8px;
			font-size: 9px;
		}

		.refresh-button svg {
			width: 13px;
		}

		.restaurant-top {
			align-items: flex-start;
			padding: 16px 14px;
		}

		.restaurant-identity {
			gap: 10px;
		}

		.restaurant-monogram {
			width: 38px;
			height: 38px;
			font-size: 21px;
		}

		.restaurant-identity h3 {
			font-size: 17px;
		}

		.restaurant-type {
			font-size: 7px;
			letter-spacing: 0.5px;
		}

		.restaurant-address {
			font-size: 9px;
		}

		.restaurant-meta {
			padding-left: 9px;
		}

		.price {
			font-size: 19px;
		}

		.restaurant-meta p {
			max-width: 100px;
			font-size: 8px;
			line-height: 1.4;
		}

		.menu-bar {
			padding: 0 14px;
		}

		.menu-title {
			gap: 6px;
		}

		.menu-title strong {
			font-size: 10px;
		}

		.menu-day {
			padding: 4px 5px;
			font-size: 7px;
		}

		.serving-hours {
			gap: 4px;
			font-size: 9px;
		}

		.menu-list {
			padding: 0 14px;
		}

		.dish {
			grid-template-columns: 23px 1fr 12px;
			gap: 7px;
			padding: 13px 0;
		}

		.dish-copy h4 {
			font-size: 10px;
		}

		.card-footer {
			padding-right: 14px;
			padding-left: 14px;
		}
	}
</style>

<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<main class="app-shell">
	<header class="site-header">
		<a class="logo" href={`${base}/`} aria-label="NorthWind accounts">
			<img src={logo} alt="NorthWind" />
		</a>
		<nav aria-label="Main navigation">
			<a href={`${base}/`} aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				Accounts
			</a>
			<a
				href={`${base}/balance-transfer`}
				aria-current={$page.url.pathname === '/balance-transfer' ? 'page' : undefined}
			>
				Transfers
			</a>
		</nav>
	</header>
	<slot />
</main>

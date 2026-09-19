<script lang="ts">
	import { onMount } from 'svelte';
	import { accountStore } from '$lib/accountStore';
	import AccountList from '$lib/components/AccountList.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import { getAccounts } from '$lib/api';
	import { formatCurrency } from '$lib/format';
	import { recentActivity } from '$lib/recentActivity';
	let loading = true;
	let error = '';

	$: totalBalance = $accountStore.reduce((total, account) => total + account.balance, 0);
	$: currency = $accountStore[0]?.currency ?? 'USD';

	async function loadAccounts() {
		loading = true;
		error = '';
		try {
			accountStore.set(await getAccounts());
		} catch (loadError) {
			error = loadError instanceof Error ? loadError.message : 'Unable to load accounts.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if ($accountStore.length > 0) {
			loading = false;
			return;
		}
		void loadAccounts();
	});
</script>

<svelte:head><title>Accounts | NorthWind</title></svelte:head>

<AppShell>
	{#if loading}
		<section class="status-panel" aria-live="polite" aria-busy="true">Loading accounts…</section>
	{:else if error}
		<section class="status-panel error-message" role="alert">
			<p>{error}</p>
			<button class="secondary-button" type="button" on:click={loadAccounts}>Try again</button>
		</section>
	{:else}
		<div class="dashboard-grid">
			<div class="accounts-column">
				<section class="balance-card" aria-labelledby="balance-heading">
					<h1 id="balance-heading">Total balance</h1>
					<strong>{formatCurrency(totalBalance, currency)}</strong>
					<span>
						Across {$accountStore.length}
						{$accountStore.length === 1 ? 'account' : 'accounts'}
					</span>
				</section>
				<AccountList accounts={$accountStore} />
			</div>
			<ActivityList
				title="Recent Activity"
				description="Latest movements across all accounts"
				items={recentActivity}
			/>
		</div>
	{/if}
</AppShell>

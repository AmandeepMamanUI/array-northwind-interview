<script lang="ts">
	import { formatCurrency, maskAccountNumber } from '$lib/format';
	import type { Account } from '$lib/types';
	import { isActive } from '$lib/validation';

	export let accounts: Account[];

	function statusLabel(account: Account): string {
		return isActive(account)
			? 'Available'
			: `${account.status.charAt(0).toUpperCase()}${account.status.slice(1)}`;
	}
</script>

<section aria-labelledby="accounts-heading">
	<h2 id="accounts-heading" class="section-heading">Your accounts</h2>
	{#if accounts.length === 0}
		<p class="empty-state">No accounts are available.</p>
	{:else}
		<ul class="account-list">
			{#each accounts as account (account.id)}
				<li class:inactive={!isActive(account)} class="account-row">
					<div class="account-main">
						<span>{account.name}</span>
						<strong class:negative={account.balance < 0}>
							{formatCurrency(account.balance, account.currency)}
						</strong>
					</div>
					<div class="account-meta">
						<span>{maskAccountNumber(account.number)}</span>
						<strong class="badge">{account.type}</strong>
						<span class:status-inactive={!isActive(account)} class="account-status">
							{statusLabel(account)}
						</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<script lang="ts">
	import { formatSignedCurrency } from '$lib/format';
	import type { ActivityItem } from '$lib/types';

	export let title: string;
	export let description: string;
	export let items: ActivityItem[];
</script>

<section class="panel activity-panel" aria-labelledby="activity-heading">
	<div>
		<h2 id="activity-heading" class="panel-title">{title}</h2>
		<p class="panel-description">{description}</p>
	</div>

	{#if items.length === 0}
		<p class="empty-state">No recent activity.</p>
	{:else}
		<ul class="activity-list">
			{#each items as item (item.id)}
				<li class="activity-row">
					<div class="activity-icon" style={`background-image: url('${item.icon}')`}></div>
					<div class="activity-copy">
						<strong>{item.title}</strong>
						<span>{item.subtitle}</span>
					</div>
					<strong class:negative={item.amount < 0} class="activity-amount">
						{formatSignedCurrency(item.amount, item.currency)}
					</strong>
				</li>
			{/each}
		</ul>
	{/if}
</section>

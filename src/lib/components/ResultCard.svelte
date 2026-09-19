<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import type { TransferReceipt } from '$lib/types';
	import checkSuccessIcon from '$lib/assets/check-success.svg';
	import failureIcon from '$lib/assets/check-failure.svg';

	export let kind: 'success' | 'error';
	export let receipt: TransferReceipt | null = null;
	export let message = '';
	export let onDone: () => void;

	$: displayDate = receipt
		? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(
				new Date(receipt.date)
			)
		: '';
</script>

<main class="result-page">
	<section class="result-card" aria-live="polite">
		<div class="result-card-content">
			<div
				class:success={kind === 'success'}
				class:error={kind === 'error'}
				class="result-icon"
				aria-hidden="true"
			>
				{#if kind === 'success'}
					<img src={checkSuccessIcon} alt="Success" />
				{:else}
					<img src={failureIcon} alt="Failure" />
				{/if}
			</div>
			<h1>{kind === 'success' ? 'Transfer Successful' : 'Transfer Failed'}</h1>
			<p>
				{kind === 'success'
					? 'Your transfer has successfully been completed'
					: message || 'Your transfer could not be completed. Please try again.'}
			</p>
		</div>

		{#if kind === 'success' && receipt}
			<dl class="receipt">
				<div>
					<dt>Amount</dt>
					<dd>{formatCurrency(receipt.amount, receipt.currency)}</dd>
				</div>
				<div>
					<dt>Transfer from</dt>
					<dd>{receipt.fromAccount}</dd>
				</div>
				<div>
					<dt>Transfer to</dt>
					<dd>{receipt.toAccount}</dd>
				</div>
				<div>
					<dt>Transfer date</dt>
					<dd>{displayDate}</dd>
				</div>
				<div>
					<dt>Confirmation</dt>
					<dd>{receipt.confirmation}</dd>
				</div>
			</dl>
		{/if}

		<button class="secondary-button result-button" type="button" on:click={onDone}>
			{kind === 'success' ? 'Done' : 'Back to transfers'}
		</button>
	</section>
</main>

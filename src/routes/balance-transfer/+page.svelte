<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { accountStore } from '$lib/accountStore';
	import bank from '$lib/assets/bank.svg';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
	import { getAccounts, getTransfers, submitTransfer } from '$lib/api';
	import { formatCompactCurrency, formatCurrency, formatDate, shortAccountName } from '$lib/format';
	import type {
		ActivityItem,
		TransferField,
		TransferInput,
		TransferReceipt,
		TransferSummary
	} from '$lib/types';
	import { isActive, validateTransfer } from '$lib/validation';

	type Stage = 'form' | 'success' | 'error';

	let transfers: TransferSummary[] = [];
	let loadingAccounts = true;
	let loadingTransfers = true;
	let loadError = '';
	let transfersError = '';
	let fromAccountNumber = '';
	let toAccountNumber = '';
	let amount: number | undefined;
	let touched: Partial<Record<TransferField, boolean>> = {};
	let stage: Stage = 'form';
	let submitting = false;
	let submitError = '';
	let receipt: TransferReceipt | null = null;

	$: numericAmount = amount ?? Number.NaN;
	$: input = { fromAccountNumber, toAccountNumber, amount: numericAmount } satisfies TransferInput;
	$: errors = validateTransfer(input, $accountStore);
	$: submitEnabled =
		!loadingAccounts && amount !== undefined && Object.keys(errors).length === 0 && !submitting;
	$: fromAccount = $accountStore.find((account) => account.number === fromAccountNumber);
	$: toAccount = $accountStore.find((account) => account.number === toAccountNumber);
	$: showProjectedBalances =
		Boolean(fromAccount) &&
		Boolean(toAccount) &&
		Number.isFinite(numericAmount) &&
		numericAmount > 0 &&
		Object.keys(errors).length === 0;
	$: fromSummaryBalance = fromAccount
		? fromAccount.balance - (showProjectedBalances ? numericAmount : 0)
		: null;
	$: toSummaryBalance = toAccount
		? toAccount.balance + (showProjectedBalances ? numericAmount : 0)
		: null;
	$: summaryAmount = showProjectedBalances
		? formatCompactCurrency(numericAmount, fromAccount?.currency)
		: '';
	$: recentTransfers = transfers.map(toActivityItem);

	function toActivityItem(transfer: TransferSummary): ActivityItem {
		const isOutbound = transfer.direction.toUpperCase() === 'OUTBOUND';
		return {
			id: transfer.id,
			title: `To ${transfer.toName}`,
			subtitle: `${formatDate(transfer.date)} · From ${transfer.fromName}`,
			amount: isOutbound ? -Math.abs(transfer.amount) : Math.abs(transfer.amount),
			currency: transfer.currency,
			icon: bank
		};
	}

	function markTouched(field: TransferField) {
		touched = { ...touched, [field]: true };
	}

	async function loadPage() {
		loadingAccounts = true;
		loadingTransfers = true;
		loadError = '';
		transfersError = '';

		const accountsRequest =
			$accountStore.length > 0 ? Promise.resolve($accountStore) : getAccounts();
		const [accountsResult, transfersResult] = await Promise.allSettled([
			accountsRequest,
			getTransfers()
		]);

		if (accountsResult.status === 'fulfilled') {
			accountStore.set(accountsResult.value);
		} else {
			loadError =
				accountsResult.reason instanceof Error
					? accountsResult.reason.message
					: 'Unable to load accounts.';
		}

		if (transfersResult.status === 'fulfilled') {
			transfers = transfersResult.value;
		} else {
			transfersError =
				transfersResult.reason instanceof Error
					? transfersResult.reason.message
					: 'Unable to load recent transfers.';
		}

		loadingAccounts = false;
		loadingTransfers = false;
	}

	async function completeTransfer() {
		touched = { fromAccountNumber: true, toAccountNumber: true, amount: true };
		if (!submitEnabled) return;
		submitting = true;
		submitError = '';

		try {
			const result = await submitTransfer(input);
			// Initiated transfers can remain pending while the accounts endpoint still returns old balances.
			// Apply the confirmed submission locally so both routes show the updated amounts immediately.
			accountStore.applyTransfer(input);
			receipt = result.receipt;
			fromAccountNumber = '';
			toAccountNumber = '';
			amount = undefined;
			touched = {};
			stage = 'success';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'The transfer could not be completed.';
			stage = 'error';
		} finally {
			submitting = false;
		}
	}

	function backToForm() {
		stage = 'form';
		submitError = '';
	}

	onMount(loadPage);
</script>

<svelte:head><title>Balance Transfer | NorthWind</title></svelte:head>

{#if stage === 'success'}
	<ResultCard kind="success" {receipt} onDone={() => goto(`${base}/`)} />
{:else if stage === 'error'}
	<ResultCard kind="error" message={submitError} onDone={backToForm} />
{:else}
	<AppShell>
		{#if loadingAccounts}
			<section class="status-panel" aria-live="polite" aria-busy="true">Loading accounts…</section>
		{:else if loadError}
			<section class="status-panel error-message" role="alert">
				<p>{loadError}</p>
				<button class="secondary-button" type="button" on:click={loadPage}>Try again</button>
			</section>
		{:else}
			<div class="transfer-grid">
				<section class="transfer-column" aria-labelledby="transfer-heading">
					<div class="section-intro">
						<h1 id="transfer-heading">Transfer between accounts</h1>
						<p>Move money instantly between your accounts.</p>
					</div>

					<form class="transfer-card" on:submit|preventDefault={completeTransfer} novalidate>
						<div class="field">
							<label for="from-account">Transfer from</label>
							<div class:has-selection={Boolean(fromAccount)} class="account-select">
								<div class="account-select-display" aria-hidden="true">
									{#if fromAccount}
										<span>{shortAccountName(fromAccount.name, fromAccount.number)}</span>
										<small class:negative={fromAccount.balance < 0}>
											{formatCurrency(fromAccount.balance, fromAccount.currency)} available
										</small>
									{:else}
										<span class="account-select-placeholder">Choose account</span>
									{/if}
								</div>
								<select
									id="from-account"
									bind:value={fromAccountNumber}
									on:change={() => markTouched('fromAccountNumber')}
									aria-invalid={touched.fromAccountNumber && Boolean(errors.fromAccountNumber)}
									aria-describedby={touched.fromAccountNumber && errors.fromAccountNumber
										? 'from-error'
										: undefined}
								>
									<option value="">Choose account</option>
									{#each $accountStore as account (account.id)}
										<option
											value={account.number}
											disabled={!isActive(account) || account.number === toAccountNumber}
										>
											{shortAccountName(account.name, account.number)}
											{account.type ? ` — ${account.type}` : ''}
											{isActive(account)
												? ` · ${formatCurrency(account.balance, account.currency)} available`
												: ` — ${account.status}`}
										</option>
									{/each}
								</select>
								<span class="account-select-chevron" aria-hidden="true">›</span>
							</div>
							{#if touched.fromAccountNumber && errors.fromAccountNumber}
								<span id="from-error" class="field-error">{errors.fromAccountNumber}</span>
							{/if}
						</div>

						<div class="field">
							<label for="to-account">Transfer to</label>
							<div class:has-selection={Boolean(toAccount)} class="account-select">
								<div class="account-select-display" aria-hidden="true">
									{#if toAccount}
										<span>{shortAccountName(toAccount.name, toAccount.number)}</span>
										<small class:negative={toAccount.balance < 0}>
											{formatCurrency(toAccount.balance, toAccount.currency)} available
										</small>
									{:else}
										<span class="account-select-placeholder">Choose account</span>
									{/if}
								</div>
								<select
									id="to-account"
									bind:value={toAccountNumber}
									on:change={() => markTouched('toAccountNumber')}
									aria-invalid={touched.toAccountNumber && Boolean(errors.toAccountNumber)}
									aria-describedby={touched.toAccountNumber && errors.toAccountNumber
										? 'to-error'
										: undefined}
								>
									<option value="">Choose account</option>
									{#each $accountStore as account (account.id)}
										<option
											value={account.number}
											disabled={!isActive(account) || account.number === fromAccountNumber}
										>
											{shortAccountName(account.name, account.number)}
											{account.type ? ` — ${account.type}` : ''}
											{isActive(account)
												? ` · ${formatCurrency(account.balance, account.currency)} available`
												: ` — ${account.status}`}
										</option>
									{/each}
								</select>
								<span class="account-select-chevron" aria-hidden="true">›</span>
							</div>
							{#if touched.toAccountNumber && errors.toAccountNumber}
								<span id="to-error" class="field-error">{errors.toAccountNumber}</span>
							{/if}
						</div>

						<div class="field">
							<label for="amount">Transfer amount</label>
							<div class="amount-input">
								<span aria-hidden="true">$</span>
								<input
									id="amount"
									type="number"
									min="0.01"
									step="0.01"
									inputmode="decimal"
									placeholder="0.00"
									on:keydown={(event) => {
										if (['+', '-', 'e', 'E'].includes(event.key)) {
											event.preventDefault();
										}
									}}
									pattern="[0-9]*"
									bind:value={amount}
									on:blur={() => markTouched('amount')}
									aria-invalid={touched.amount && Boolean(errors.amount)}
									aria-describedby={touched.amount && errors.amount ? 'amount-error' : undefined}
								/>
							</div>
							{#if touched.amount && errors.amount}
								<span id="amount-error" class="field-error">{errors.amount}</span>
							{/if}
						</div>

						<p class="authorization">
							By continuing, I authorize NorthWind Bank to transfer money as indicated
						</p>
						<button class="primary-button" type="submit" disabled={!submitEnabled}>
							{submitting ? 'Completing transfer…' : 'Complete transfer'}
						</button>
					</form>
				</section>

				<div class="transfer-side">
					<section class="panel summary-panel" aria-labelledby="summary-heading">
						<h2 id="summary-heading" class="panel-title">Transfer summary</h2>
						<p class="panel-description">
							A quick view of how this transfer affects your balances.
						</p>
						<div class="summary-columns">
							<div>
								<span>{summaryAmount ? `${summaryAmount} From` : 'From'}</span>
								<strong>{fromAccount?.name ?? '-'}</strong>
								{#if fromAccount && fromSummaryBalance !== null}
									<span class:negative={fromAccount.balance < 0}>
										{showProjectedBalances ? 'New balance' : 'Current'} · {formatCurrency(
											fromSummaryBalance,
											fromAccount.currency
										)}
									</span>
								{/if}
							</div>
							<div>
								<span>{summaryAmount ? `${summaryAmount} To` : 'To'}</span>
								<strong>{toAccount?.name ?? '-'}</strong>
								{#if toAccount && toSummaryBalance !== null}
									<span class:negative={toAccount.balance < 0}>
										{showProjectedBalances ? 'New balance' : 'Current'} · {formatCurrency(
											toSummaryBalance,
											toAccount.currency
										)}
									</span>
								{/if}
							</div>
						</div>
					</section>

					{#if loadingTransfers}
						<section class="panel" aria-live="polite" aria-busy="true">
							Loading recent transfers…
						</section>
					{:else if transfersError}
						<section class="panel compact-error" role="status">{transfersError}</section>
					{:else}
						<ActivityList
							title="Recent transfers"
							description="Quick reference of your latest internal transfers."
							items={recentTransfers}
						/>
					{/if}
				</div>
			</div>
		{/if}
	</AppShell>
{/if}

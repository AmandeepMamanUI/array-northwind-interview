import type { Account, TransferInput, TransferResult, TransferSummary } from '$lib/types';
import { base } from '$app/paths';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readMessage(value: unknown): string {
	if (isRecord(value) && typeof value.message === 'string') return value.message;
	return 'The request could not be completed. Please try again.';
}

async function requestJson(url: string, options?: RequestInit): Promise<unknown> {
	const response = await fetch(url, options);
	let body: unknown;

	try {
		body = await response.json();
	} catch {
		throw new Error('The server returned an unreadable response.');
	}

	if (!response.ok) throw new Error(readMessage(body));
	return body;
}

function isAccount(value: unknown): value is Account {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.name === 'string' &&
		typeof value.number === 'string' &&
		typeof value.type === 'string' &&
		typeof value.status === 'string' &&
		typeof value.balance === 'number' &&
		typeof value.currency === 'string' &&
		typeof value.routingNumber === 'string'
	);
}

function parseAccounts(value: unknown): Account[] {
	if (!isRecord(value) || !Array.isArray(value.accounts) || !value.accounts.every(isAccount)) {
		throw new Error('The accounts response did not match the expected format.');
	}
	return value.accounts;
}

function isTransferSummary(value: unknown): value is TransferSummary {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.fromName === 'string' &&
		typeof value.toName === 'string' &&
		typeof value.amount === 'number' &&
		typeof value.currency === 'string' &&
		typeof value.direction === 'string' &&
		typeof value.date === 'string' &&
		typeof value.status === 'string'
	);
}

export async function getAccounts(): Promise<Account[]> {
	return parseAccounts(await requestJson(`${base}/api/accounts`));
}

export async function getTransfers(): Promise<TransferSummary[]> {
	const value = await requestJson(`${base}/api/transfers`);
	if (
		!isRecord(value) ||
		!Array.isArray(value.transfers) ||
		!value.transfers.every(isTransferSummary)
	) {
		throw new Error('The transfers response did not match the expected format.');
	}
	return value.transfers;
}

export async function submitTransfer(input: TransferInput): Promise<TransferResult> {
	const value = await requestJson(`${base}/api/transfers`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});

	console.log('submitTransfer response:', value);

	if (!isRecord(value) || !isRecord(value.receipt)) {
		throw new Error('The transfer response did not match the expected format.');
	}

	const receipt = value.receipt;
	if (
		typeof receipt.amount !== 'number' ||
		typeof receipt.currency !== 'string' ||
		typeof receipt.fromAccount !== 'string' ||
		typeof receipt.toAccount !== 'string' ||
		typeof receipt.date !== 'string' ||
		typeof receipt.confirmation !== 'string'
	) {
		throw new Error('The transfer receipt did not match the expected format.');
	}

	const accounts = value.accounts === null ? null : parseAccounts({ accounts: value.accounts });
	return {
		receipt: {
			amount: receipt.amount,
			currency: receipt.currency,
			fromAccount: receipt.fromAccount,
			toAccount: receipt.toAccount,
			date: receipt.date,
			confirmation: receipt.confirmation
		},
		accounts
	};
}

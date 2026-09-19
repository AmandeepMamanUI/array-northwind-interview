import { env } from '$env/dynamic/private';
import { shortAccountName } from '$lib/format';

import type {
	Account,
	AccountStatus,
	TransferInput,
	TransferReceipt,
	TransferSummary
} from '$lib/types';
import { validateTransfer } from '$lib/validation';

const API_BASE_URL = 'https://northwind.dev.array.io';

type Fetch = typeof fetch;

export class NorthwindError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'NorthwindError';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function requiredString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	if (typeof value !== 'string' || value.trim() === '') {
		throw new NorthwindError(502, `NorthWind returned an invalid ${key} value.`);
	}
	return value;
}

function optionalString(record: Record<string, unknown>, key: string): string {
	return typeof record[key] === 'string' ? record[key] : '';
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
	const value = record[key];
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new NorthwindError(502, `NorthWind returned an invalid ${key} value.`);
	}
	return value;
}

function normalizeStatus(status: string): AccountStatus {
	const value = status.toLowerCase();
	return ['active', 'frozen', 'closed', 'inactive'].includes(value)
		? (value as AccountStatus)
		: 'unknown';
}

function titleCase(value: string): string {
	return value
		.toLowerCase()
		.split(/[_\s-]+/)
		.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
		.join(' ');
}

function extractErrorMessage(body: unknown, fallback: string): string {
	if (!isRecord(body)) return fallback;

	if (isRecord(body.error) && typeof body.error.message === 'string') {
		return body.error.message;
	}

	if (isRecord(body.validation) && Array.isArray(body.validation.issues)) {
		const firstIssue = body.validation.issues.find(
			(issue): issue is Record<string, unknown> =>
				isRecord(issue) && typeof issue.message === 'string'
		);
		if (firstIssue && typeof firstIssue.message === 'string') return firstIssue.message;
	}

	return typeof body.message === 'string' ? body.message : fallback;
}

async function northwindRequest(
	fetcher: Fetch,
	path: string,
	init?: RequestInit
): Promise<unknown> {
	const apiKey = env.NORTHWIND_API_KEY;
	if (!apiKey || apiKey === '[API_Key]') {
		throw new NorthwindError(
			503,
			'NorthWind API key is not configured. Add it to the local .env file and restart the server.'
		);
	}

	let response: Response;
	try {
		response = await fetcher(`${API_BASE_URL}${path}`, {
			...init,
			headers: {
				accept: 'application/json',
				authorization: `Bearer ${apiKey}`,
				...init?.headers
			}
		});
	} catch {
		throw new NorthwindError(502, 'Unable to reach the NorthWind service. Please try again.');
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new NorthwindError(502, 'NorthWind returned an unreadable response.');
	}

	if (!response.ok) {
		const status = response.status >= 500 ? 502 : response.status;
		throw new NorthwindError(
			status,
			extractErrorMessage(body, 'NorthWind could not complete the request.')
		);
	}

	return body;
}

function parseAccount(value: unknown): Account {
	if (!isRecord(value)) throw new NorthwindError(502, 'NorthWind returned an invalid account.');

	const type = requiredString(value, 'account_type');
	return {
		id: requiredString(value, 'account_id'),
		name: requiredString(value, 'account_holder_name'),
		number: requiredString(value, 'account_number'),
		type: titleCase(type),
		status: normalizeStatus(requiredString(value, 'account_status')),
		balance: requiredNumber(value, 'balance'),
		currency: requiredString(value, 'currency'),
		routingNumber: optionalString(value, 'routing_number')
	};
}

function accountName(value: unknown, fallback: string): string {
	return isRecord(value) && typeof value.account_holder_name === 'string'
		? value.account_holder_name
		: fallback;
}

export async function listAccounts(fetcher: Fetch): Promise<Account[]> {
	const body = await northwindRequest(fetcher, '/external/accounts?limit=100&offset=0');
	if (!isRecord(body) || !Array.isArray(body.accounts)) {
		throw new NorthwindError(502, 'NorthWind returned an invalid accounts response.');
	}
	return body.accounts.map(parseAccount);
}

export async function listTransfers(fetcher: Fetch): Promise<TransferSummary[]> {
	const body = await northwindRequest(fetcher, '/external/transfers?page=1&per_page=3');
	if (!isRecord(body) || !Array.isArray(body.transfers)) {
		throw new NorthwindError(502, 'NorthWind returned an invalid transfers response.');
	}

	return body.transfers.map((value, index) => {
		if (!isRecord(value)) {
			throw new NorthwindError(502, 'NorthWind returned an invalid transfer.');
		}
		return {
			id: optionalString(value, 'transfer_id') || `transfer-${index}`,
			fromName: accountName(value.source_account, 'Source account'),
			toName: accountName(value.destination_account, 'Destination account'),
			amount: requiredNumber(value, 'amount'),
			currency: optionalString(value, 'currency') || 'USD',
			direction: optionalString(value, 'direction') || 'OUTBOUND',
			date:
				optionalString(value, 'completed_date') ||
				optionalString(value, 'initiated_date') ||
				new Date().toISOString(),
			status: optionalString(value, 'status') || 'UNKNOWN'
		};
	});
}

function createReference(): string {
	const cleanUUID = crypto.randomUUID().replace(/-/g, '');
	return `${cleanUUID.slice(0, 12).toUpperCase()}`;
}

function externalAccount(account: Account): Record<string, string> {
	return {
		account_number: account.number,
		account_holder_name: account.name,
		institution_name: 'NorthWind Bank',
		...(account.routingNumber ? { routing_number: account.routingNumber } : {})
	};
}

export async function initiateTransfer(
	fetcher: Fetch,
	input: TransferInput
): Promise<{ receipt: TransferReceipt; accounts: Account[] | null }> {
	const accounts = await listAccounts(fetcher);
	const errors = validateTransfer(input, accounts);
	const firstError = Object.values(errors)[0];
	if (firstError) throw new NorthwindError(400, firstError);

	const from = accounts.find((account) => account.number === input.fromAccountNumber);
	const to = accounts.find((account) => account.number === input.toAccountNumber);
	if (!from || !to) throw new NorthwindError(400, 'Choose two valid accounts.');

	const body = await northwindRequest(fetcher, '/external/transfers/initiate', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			amount: input.amount,
			currency: from.currency,
			description: 'Internal account transfer',
			direction: 'OUTBOUND',
			reference_number: createReference(),
			transfer_type: 'ACH',
			source_account: externalAccount(from),
			destination_account: externalAccount(to)
		})
	});

	if (!isRecord(body))
		throw new NorthwindError(502, 'NorthWind returned an invalid transfer response.');

	let refreshedAccounts: Account[] | null = null;
	try {
		refreshedAccounts = await listAccounts(fetcher);
	} catch {
		// The transfer succeeded. The client can still update its balances optimistically.
	}

	return {
		receipt: {
			amount: typeof body.amount === 'number' ? body.amount : input.amount,
			currency: optionalString(body, 'currency') || from.currency,
			fromAccount: `${shortAccountName(from.name, from.number)}`,
			toAccount: `${shortAccountName(to.name, to.number)}`,
			date:
				optionalString(body, 'completed_date') ||
				optionalString(body, 'initiated_date') ||
				new Date().toISOString(),
			confirmation:
				optionalString(body, 'reference_number') ||
				optionalString(body, 'transfer_id') ||
				'Confirmed'
		},
		accounts: refreshedAccounts
	};
}

export function apiError(error: unknown): { status: number; message: string } {
	return error instanceof NorthwindError
		? { status: error.status, message: error.message }
		: { status: 500, message: 'An unexpected server error occurred.' };
}

import { apiError, initiateTransfer, listTransfers } from '$lib/server/northwind';
import type { TransferInput } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function parseTransferInput(value: unknown): TransferInput | null {
	if (typeof value !== 'object' || value === null) return null;
	const input = value as Record<string, unknown>;
	return typeof input.fromAccountNumber === 'string' &&
		typeof input.toAccountNumber === 'string' &&
		typeof input.amount === 'number'
		? {
				fromAccountNumber: input.fromAccountNumber,
				toAccountNumber: input.toAccountNumber,
				amount: input.amount
			}
		: null;
}

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		return json({ transfers: await listTransfers(fetch) });
	} catch (error) {
		const result = apiError(error);
		return json({ message: result.message }, { status: result.status });
	}
};

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Enter a valid transfer request.' }, { status: 400 });
	}

	const input = parseTransferInput(body);
	if (!input) return json({ message: 'Enter a valid transfer request.' }, { status: 400 });

	try {
		return json(await initiateTransfer(fetch, input), { status: 201 });
	} catch (error) {
		const result = apiError(error);
		return json({ message: result.message }, { status: result.status });
	}
};

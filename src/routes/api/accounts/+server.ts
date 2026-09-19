import { apiError, listAccounts } from '$lib/server/northwind';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		return json({ accounts: await listAccounts(fetch) });
	} catch (error) {
		const result = apiError(error);
		return json({ message: result.message }, { status: result.status });
	}
};

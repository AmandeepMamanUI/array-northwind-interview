import { describe, expect, it, vi } from 'vitest';
import { initiateTransfer, listAccounts, NorthwindError } from './northwind';

vi.mock('$env/dynamic/private', () => ({
	env: {
		NORTHWIND_API_KEY: 'test-api-key'
	}
}));

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json'
		}
	});
}

describe('listAccounts', () => {
	it('returns normalized accounts for a successful response', async () => {
		const fetcher = vi.fn<typeof fetch>();

		fetcher.mockResolvedValue(
			jsonResponse({
				accounts: [
					{
						account_id: 'account-1',
						account_holder_name: 'Everyday Checking',
						account_number: '1234567890',
						account_type: 'CHECKING',
						account_status: 'ACTIVE',
						balance: 500,
						currency: 'USD',
						routing_number: '123456789'
					}
				]
			})
		);

		const accounts = await listAccounts(fetcher);

		expect(accounts).toEqual([
			{
				id: 'account-1',
				name: 'Everyday Checking',
				number: '1234567890',
				type: 'Checking',
				status: 'active',
				balance: 500,
				currency: 'USD',
				routingNumber: '123456789'
			}
		]);

		expect(fetcher).toHaveBeenCalledWith(
			'https://northwind.dev.array.io/external/accounts?limit=100&offset=0',
			expect.objectContaining({
				headers: expect.objectContaining({
					authorization: 'Bearer test-api-key'
				})
			})
		);
	});

	it('returns the API error message when the request fails', async () => {
		const fetcher = vi.fn<typeof fetch>();

		fetcher.mockResolvedValue(
			jsonResponse(
				{
					error: {
						message: 'The request could not be completed.'
					}
				},
				400
			)
		);

		await expect(listAccounts(fetcher)).rejects.toMatchObject({
			status: 400,
			message: 'The request could not be completed.'
		});
	});

	it('rejects a malformed successful response', async () => {
		const fetcher = vi.fn<typeof fetch>();
		fetcher.mockResolvedValue(jsonResponse({ accounts: [{}] }));
		const request = listAccounts(fetcher);

		await expect(request).rejects.toBeInstanceOf(NorthwindError);
		await expect(request).rejects.toHaveProperty('status', 502);
		await expect(request).rejects.toThrow('NorthWind returned an invalid account_type value.');
	});
});

describe('initiateTransfer', () => {
	const accountsResponse = {
		accounts: [
			{
				account_id: 'account-1',
				account_holder_name: 'Everyday Checking',
				account_number: '11112222',
				account_type: 'CHECKING',
				account_status: 'ACTIVE',
				balance: 500,
				currency: 'USD',
				routing_number: '123456789'
			},
			{
				account_id: 'account-2',
				account_holder_name: 'High-Yield Savings',
				account_number: '33334444',
				account_type: 'SAVINGS',
				account_status: 'ACTIVE',
				balance: 1000,
				currency: 'USD',
				routing_number: '123456789'
			}
		]
	};

	const input = {
		fromAccountNumber: '11112222',
		toAccountNumber: '33334444',
		amount: 100
	};

	it('returns a receipt after a successful transfer', async () => {
		const fetcher = vi.fn<typeof fetch>();

		fetcher
			.mockResolvedValueOnce(jsonResponse(accountsResponse))
			.mockResolvedValueOnce(
				jsonResponse(
					{
						amount: 100,
						currency: 'USD',
						initiated_date: '2026-09-18T15:00:00.000Z',
						reference_number: 'TRANSFER-123'
					},
					201
				)
			)
			.mockResolvedValueOnce(
				jsonResponse({
					accounts: [
						{ ...accountsResponse.accounts[0], balance: 400 },
						{ ...accountsResponse.accounts[1], balance: 1100 }
					]
				})
			);

		const result = await initiateTransfer(fetcher, input);

		expect(result.receipt).toEqual({
			amount: 100,
			currency: 'USD',
			fromAccount: 'Everyday Checking...2222',
			toAccount: 'High-Yield Savings...4444',
			date: '2026-09-18T15:00:00.000Z',
			confirmation: 'TRANSFER-123'
		});
		expect(result.accounts?.[0].balance).toBe(400);
		expect(result.accounts?.[1].balance).toBe(1100);
		expect(fetcher).toHaveBeenNthCalledWith(
			2,
			'https://northwind.dev.array.io/external/transfers/initiate',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('returns the API error when the transfer fails', async () => {
		const fetcher = vi.fn<typeof fetch>();

		fetcher.mockResolvedValueOnce(jsonResponse(accountsResponse)).mockResolvedValueOnce(
			jsonResponse(
				{
					error: {
						message: 'Daily transfer limit exceeded.'
					}
				},
				422
			)
		);

		const request = initiateTransfer(fetcher, input);

		await expect(request).rejects.toBeInstanceOf(NorthwindError);
		await expect(request).rejects.toHaveProperty('status', 422);
		await expect(request).rejects.toThrow('Daily transfer limit exceeded.');
	});
});

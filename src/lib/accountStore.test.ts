import { afterEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { accountStore } from './accountStore';
import type { Account } from './types';

const accounts: Account[] = [
	{
		id: 'account-1',
		name: 'Everyday Checking',
		number: '1001',
		type: 'Checking',
		status: 'active',
		balance: 500,
		currency: 'USD',
		routingNumber: '123456789'
	},
	{
		id: 'account-2',
		name: 'High-Yield Savings',
		number: '2001',
		type: 'Savings',
		status: 'active',
		balance: 1000,
		currency: 'USD',
		routingNumber: '123456789'
	}
];

afterEach(() => accountStore.set([]));

describe('accountStore', () => {
	it('updates both balances after a successful transfer', () => {
		accountStore.set(accounts);

		accountStore.applyTransfer({
			fromAccountNumber: '1001',
			toAccountNumber: '2001',
			amount: 100
		});

		const updatedAccounts = get(accountStore);

		expect(updatedAccounts[0].balance).toBe(400);
		expect(updatedAccounts[1].balance).toBe(1100);
	});
});

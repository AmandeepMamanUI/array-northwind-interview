import { describe, expect, it } from 'vitest';
import type { Account, TransferInput } from './types';
import { validateTransfer } from './validation';

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
	},
	{
		id: 'account-3',
		name: 'Frozen Checking',
		number: '3001',
		type: 'Checking',
		status: 'frozen',
		balance: 250,
		currency: 'USD',
		routingNumber: '123456789'
	}
];

function createInput(overrides: Partial<TransferInput> = {}): TransferInput {
	return {
		fromAccountNumber: '1001',
		toAccountNumber: '2001',
		amount: 100,
		...overrides
	};
}

describe('validateTransfer', () => {
	it('returns no errors for a valid transfer', () => {
		const errors = validateTransfer(createInput(), accounts);

		expect(errors).toEqual({});
	});

	it('rejects using the same account for both sides', () => {
		const errors = validateTransfer(createInput({ toAccountNumber: '1001' }), accounts);

		expect(errors.toAccountNumber).toBe('Choose two different accounts.');
	});

	it('rejects an inactive source account', () => {
		const errors = validateTransfer(createInput({ fromAccountNumber: '3001' }), accounts);

		expect(errors.fromAccountNumber).toBe('The source account must be active.');
	});

	it('rejects an inactive destination account', () => {
		const errors = validateTransfer(createInput({ toAccountNumber: '3001' }), accounts);

		expect(errors.toAccountNumber).toBe('The destination account must be active.');
	});

	it.each([0, -10, Number.NaN])('rejects an invalid amount: %s', (amount) => {
		const errors = validateTransfer(createInput({ amount }), accounts);

		expect(errors.amount).toBe('Enter an amount greater than zero.');
	});

	it('rejects an amount greater than the available balance', () => {
		const errors = validateTransfer(createInput({ amount: 501 }), accounts);

		expect(errors.amount).toBe('The amount exceeds the available balance.');
	});
});

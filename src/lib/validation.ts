import type { Account, TransferErrors, TransferInput } from '$lib/types';

export function isActive(account: Account): boolean {
	return account.status === 'active';
}

export function validateTransfer(input: TransferInput, accounts: Account[]): TransferErrors {
	const errors: TransferErrors = {};
	const from = accounts.find((account) => account.number === input.fromAccountNumber);
	const to = accounts.find((account) => account.number === input.toAccountNumber);

	if (!from) {
		errors.fromAccountNumber = 'Choose an account to transfer from.';
	} else if (!isActive(from)) {
		errors.fromAccountNumber = 'The source account must be active.';
	}

	if (!to) {
		errors.toAccountNumber = 'Choose an account to transfer to.';
	} else if (!isActive(to)) {
		errors.toAccountNumber = 'The destination account must be active.';
	}

	if (from && to && from.number === to.number) {
		errors.toAccountNumber = 'Choose two different accounts.';
	}

	if (!Number.isFinite(input.amount) || input.amount <= 0) {
		errors.amount = 'Enter an amount greater than zero.';
	} else if (from && input.amount > from.balance) {
		errors.amount = 'The amount exceeds the available balance.';
	}

	return errors;
}

import { writable } from 'svelte/store';
import type { Account, TransferInput } from '$lib/types';

function createAccountStore() {
	const { subscribe, set, update } = writable<Account[]>([]);

	return {
		subscribe,
		set,
		applyTransfer(transfer: TransferInput) {
			update((accounts) =>
				accounts.map((account) => {
					if (account.number === transfer.fromAccountNumber) {
						return { ...account, balance: account.balance - transfer.amount };
					}
					if (account.number === transfer.toAccountNumber) {
						return { ...account, balance: account.balance + transfer.amount };
					}
					return account;
				})
			);
		}
	};
}

export const accountStore = createAccountStore();

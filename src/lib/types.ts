export type AccountStatus = 'active' | 'frozen' | 'closed' | 'inactive' | 'unknown';

export interface Account {
	id: string;
	name: string;
	number: string;
	type: string;
	status: AccountStatus;
	balance: number;
	currency: string;
	routingNumber: string;
}

export interface ActivityItem {
	id: string;
	title: string;
	subtitle: string;
	amount: number;
	currency: string;
	icon: string;
}

export interface TransferSummary {
	id: string;
	fromName: string;
	toName: string;
	amount: number;
	currency: string;
	direction: string;
	date: string;
	status: string;
}

export interface TransferInput {
	fromAccountNumber: string;
	toAccountNumber: string;
	amount: number;
}

export interface TransferReceipt {
	amount: number;
	currency: string;
	fromAccount: string;
	toAccount: string;
	date: string;
	confirmation: string;
}

export interface TransferResult {
	receipt: TransferReceipt;
	accounts: Account[] | null;
}

export type TransferField = 'fromAccountNumber' | 'toAccountNumber' | 'amount';
export type TransferErrors = Partial<Record<TransferField, string>>;

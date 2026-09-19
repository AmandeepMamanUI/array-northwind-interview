export function formatCurrency(amount: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2
	}).format(amount);
}

export function formatSignedCurrency(amount: number, currency = 'USD'): string {
	const formatted = formatCurrency(Math.abs(amount), currency);
	return amount < 0 ? `-${formatted}` : `+${formatted}`;
}

export function formatCompactCurrency(amount: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2
	}).format(amount);
}

export function maskAccountNumber(number: string): string {
	const digits = number.replace(/\D/g, '');
	return `**** ${digits.slice(-4)}`;
}

export function shortAccountName(name: string, number: string): string {
	const digits = number.replace(/\D/g, '');
	return `${name}...${digits.slice(-4)}`;
}

export function formatDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

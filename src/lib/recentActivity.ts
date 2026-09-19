import bank from '$lib/assets/bank.svg';
import briefcase from '$lib/assets/briefcase.svg';
import coffee from '$lib/assets/hot-beverage.svg';
import money from '$lib/assets/money-bag.svg';
import cart from '$lib/assets/shopping-cart.svg';
import type { ActivityItem } from '$lib/types';

// The API does not expose purchase/deposit activity. These entries reproduce the Figma-only panel.
export const recentActivity: ActivityItem[] = [
	{
		id: 'grocery',
		title: 'Grocery Store',
		subtitle: 'Dec 14 · Everyday Checking',
		amount: -82.45,
		currency: 'USD',
		icon: cart
	},
	{
		id: 'salary',
		title: 'Salary Deposit',
		subtitle: 'Dec 13 · Everyday Checking',
		amount: 2800,
		currency: 'USD',
		icon: briefcase
	},
	{
		id: 'coffee',
		title: 'Coffee Shop',
		subtitle: 'Dec 12 · Rewards Credit',
		amount: -5.75,
		currency: 'USD',
		icon: coffee
	},
	{
		id: 'interest',
		title: 'Interest Payment',
		subtitle: 'Dec 1 · High-Yield Savings',
		amount: 5.24,
		currency: 'USD',
		icon: money
	},
	{
		id: 'transfer',
		title: 'Transfer to Savings',
		subtitle: 'Dec 10 · Internal transfer',
		amount: -250,
		currency: 'USD',
		icon: bank
	}
];

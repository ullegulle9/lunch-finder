import { chromium } from 'playwright';

const sourceUrl = 'https://www.bjorkmansskafferi.se/';
const timeZone = 'Europe/Stockholm';
const weekdays = ['MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG'] as const;

export interface LunchItem {
	title: string;
}

interface MenuBase {
	weekday: string;
	dateLabel: string;
	fetchedAt: string;
}

export type LunchMenu =
	| (MenuBase & { status: 'available'; items: LunchItem[] })
	| (MenuBase & { status: 'closed' })
	| (MenuBase & { status: 'unavailable'; message: string });

function getMenuBase(date: Date): MenuBase & { weekday: string } {
	const weekday = new Intl.DateTimeFormat('sv-SE', {
		timeZone,
		weekday: 'long'
	})
		.format(date)
		.toLocaleUpperCase('sv-SE');

	return {
		weekday,
		dateLabel: new Intl.DateTimeFormat('sv-SE', {
			timeZone,
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(date),
		fetchedAt: date.toISOString()
	};
}

export function unavailableMenu(date: Date, message: string): LunchMenu {
	return { ...getMenuBase(date), status: 'unavailable', message };
}

export async function fetchLunchMenu(date = new Date()): Promise<LunchMenu> {
	const base = getMenuBase(date);

	if (!weekdays.some((weekday) => weekday === base.weekday)) {
		return { ...base, status: 'closed' };
	}

	const browser = await chromium.launch({ headless: true });

	try {
		const page = await browser.newPage({ locale: 'sv-SE', timezoneId: timeZone });
		await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

		const items = await page.evaluate((weekday) => {
			const isVisible = (element: Element) => element.getClientRects().length > 0;
			const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().toLocaleUpperCase('sv-SE');
			const heading = Array.from(document.querySelectorAll('h2')).find(
				(element) => isVisible(element) && normalize(element.innerText) === weekday
			);
			const section = heading?.parentElement?.parentElement;

			if (!heading || !section?.parentElement) return null;

			return Array.from(section.children)
				.slice(Array.from(section.children).indexOf(heading.parentElement!) + 1)
				.filter(
					(element): element is HTMLElement =>
						element instanceof HTMLElement &&
						isVisible(element) &&
						element.classList.contains('wixui-box')
				)
				.map((element) =>
					element.innerText
						.split(/\n\s*\n/)
						.map((line) => line.replace(/\s+/g, ' ').trim())
						.filter(Boolean)
				)
				.filter((parts) => parts.length >= 2)
				.map(([title]) => ({ title }));
		}, base.weekday);

		if (!items?.length) {
			return unavailableMenu(date, `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase('sv-SE')}.`);
		}

		return { ...base, status: 'available', items };
	} finally {
		await browser.close();
	}
}

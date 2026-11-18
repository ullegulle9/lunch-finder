import { fetchLunchMenu, unavailableMenu } from '../lib/server/lunch';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();

	try {
		return { menu: await fetchLunchMenu(now) };
	} catch (cause) {
		console.error('Unable to fetch Björkmans Skafferi lunch menu.', cause);
		return {
			menu: unavailableMenu(now, 'Menyn kunde inte hämtas just nu. Försök igen om en stund.')
		};
	}
};

import { fetchRestaurantLunchMenus, unavailableMenu } from '../lib/server/lunch';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();

	try {
		const restaurants = await fetchRestaurantLunchMenus(now);
		return { restaurants, menu: restaurants[0]?.menu };
	} catch (cause) {
		console.error('Unable to fetch Björkmans Skafferi lunch menu.', cause);
		return {
			menu: unavailableMenu(now, 'Menyn kunde inte hämtas just nu. Försök igen om en stund.'),
			restaurants: []
		};
	}
};

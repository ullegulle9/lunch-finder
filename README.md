# Nära Lunch

A small SvelteKit prototype that shows today's lunch menu at Björkmans Skafferi in Gullbergsvass, Göteborg. The menu is fetched from the restaurant's public website with Playwright whenever the page is loaded or refreshed; no menu cache is used.

The page displays dish names and links to the official site for full descriptions.

## Run locally

```sh
npm install
npx playwright install chromium
npm run dev
```

The server needs network access to the restaurant's website and a Playwright Chromium installation. In deployment, install Chromium as part of the build/runtime setup as well.

The scraper selects the current weekday in the `Europe/Stockholm` time zone. If the restaurant is closed, the menu is missing, or the source cannot be reached, the page shows that state instead of inventing menu data.
# lunch-finder

import { chromium } from "playwright";

const bjorkmansUrl = "https://www.bjorkmansskafferi.se/";
const monopoletUrl = "https://monopolet.nu/";
const pagodenUrl = "https://pagoden.se/";
const magasinFemUrl = "https://magasinfem.nu/";
const indyaUrl = "https://www.indya.se/indya-kilsgatan/lunch-meny";
const carotteUrl = "https://carotte.se/restauranger/lappstiftet/dagens-lunch/";
const poppelsUrl = "https://www.poppels.se/citybryggeriet/lunch/";
const timeZone = "Europe/Stockholm";
const weekdays = ["MÅNDAG", "TISDAG", "ONSDAG", "TORSDAG", "FREDAG"] as const;

export interface LunchItem {
  title: string;
}

function lowercaseMenuText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLocaleLowerCase("sv-SE");
}

interface MenuBase {
  weekday: string;
  dateLabel: string;
  fetchedAt: string;
}

export type LunchMenu =
  | (MenuBase & { status: "available"; items: LunchItem[] })
  | (MenuBase & { status: "closed" })
  | (MenuBase & { status: "unavailable"; message: string });

function getMenuBase(date: Date): MenuBase & { weekday: string } {
  const weekday = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    weekday: "long",
  })
    .format(date)
    .toLocaleUpperCase("sv-SE");

  return {
    weekday,
    dateLabel: new Intl.DateTimeFormat("sv-SE", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
    fetchedAt: date.toISOString(),
  };
}

export function unavailableMenu(date: Date, message: string): LunchMenu {
  return { ...getMenuBase(date), status: "unavailable", message };
}

export async function fetchBjorkmansMenu(
  date = new Date(),
): Promise<LunchMenu> {
  const base = getMenuBase(date);

  if (!weekdays.some((weekday) => weekday === base.weekday)) {
    return { ...base, status: "closed" };
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      locale: "sv-SE",
      timezoneId: timeZone,
    });
    await page.goto(bjorkmansUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const items = await page.evaluate((weekday) => {
      const isVisible = (element: Element) =>
        element.getClientRects().length > 0;
      const normalize = (text: string) =>
        text.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (element) =>
          isVisible(element) && normalize(element.innerText) === weekday,
      );
      const section = heading?.parentElement?.parentElement;

      if (!heading || !section?.parentElement) return null;

      return Array.from(section.children)
        .slice(Array.from(section.children).indexOf(heading.parentElement!) + 1)
        .filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement &&
            isVisible(element) &&
            element.classList.contains("wixui-box"),
        )
        .map((element) =>
          Array.from(element.querySelectorAll("p"))
            .map((paragraph) => paragraph.innerText.replace(/\s+/g, " ").trim())
            .filter(Boolean),
        )
        .filter((parts) => parts.length >= 2)
        .map((parts) => ({ title: parts.join(" – ") }));
    }, base.weekday);

    if (!items?.length) {
      return unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
    }

    return {
      ...base,
      status: "available",
      items: items.map((item) => ({
        title: lowercaseMenuText(item.title),
      })),
    };
  } finally {
    await browser.close();
  }
}

export interface RestaurantLunch {
  id: string;
  name: string;
  area: string;
  address: string;
  monogram: string;
  url: string;
  price?: string;
  description: string;
  hours: string;
  menu: LunchMenu;
}

async function fetchMonopoletMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const items = await page.evaluate((currentWeekday) => {
    const normalize = (text: string) =>
      text
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleUpperCase("sv-SE");
    const weekdays = ["MÅNDAG", "TISDAG", "ONSDAG", "TORSDAG", "FREDAG"];
    const lines = (document.body.innerText || "")
      .split("\n")
      .map((line) =>
        line
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean);
    const start = lines.findIndex((line) => normalize(line) === currentWeekday);
    if (start < 0) return [];
    const end = lines.findIndex(
      (line, index) => index > start && weekdays.includes(normalize(line)),
    );
    const section = lines.slice(start + 1, end < 0 ? undefined : end);
    return section
      .filter((line) => /^DAGENS\b/i.test(line))
      .map((title) => ({ title }));
  }, weekday);

  const normalizedItems = items.map((item) => ({
    title: lowercaseMenuText(item.title),
  }));
  return normalizedItems.length
    ? { ...base, status: "available", items: normalizedItems }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

async function fetchPagodenMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const items = await page.evaluate((currentWeekday) => {
    const normalize = (text: string) =>
      text
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleUpperCase("sv-SE");
    const heading = Array.from(document.querySelectorAll("h2")).find(
      (element) =>
        normalize(element.textContent || "").includes(
          normalize(currentWeekday),
        ) && normalize(element.textContent || "").startsWith("LUNCH"),
    );
    const column = heading?.closest(".flex_column");
    const columns = column?.parentElement
      ? Array.from(column.parentElement.children).filter((element) =>
          element.classList.contains("flex_column"),
        )
      : [];
    if (!columns.length) return [];

    return columns
      .flatMap((menuColumn) =>
        Array.from(menuColumn.querySelectorAll(".avia_textblock p")).map(
          (paragraph) =>
            (paragraph.textContent || "")
              .replace(/\u00a0/g, " ")
              .replace(/\s+/g, " ")
              .trim(),
        ),
      )
      .filter(
        (title) =>
          title.length > 0 &&
          !/^[“”"'‘’]*SERVERAS IDAG\b/i.test(title) &&
          !/^(?:INKL\.|OBS!)/i.test(title),
      )
      .map((title) => ({ title }));
  }, weekday);

  const normalizedItems = items.map((item) => ({
    title: lowercaseMenuText(item.title),
  }));
  return normalizedItems.length
    ? { ...base, status: "available", items: normalizedItems }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

async function fetchMagasinFemMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const items = await page.evaluate((currentWeekday) => {
    const normalize = (text: string) =>
      text.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
    const headings = Array.from(document.querySelectorAll("h2"));
    const heading = headings.find(
      (element) =>
        normalize(element.textContent || "") === normalize(currentWeekday),
    );
    const container = heading?.parentElement?.parentElement;
    if (!container) return [];

    const lines = (container.innerText || "")
      .split("\n")
      .map((line) =>
        line
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean);
    const weekdays = ["MÅNDAG", "TISDAG", "ONSDAG", "TORSDAG", "FREDAG"];
    const start = lines.findIndex(
      (line) => normalize(line) === normalize(currentWeekday),
    );
    const end = lines.findIndex(
      (line, index) => index > start && weekdays.includes(normalize(line)),
    );
    const section = lines.slice(start + 1, end < 0 ? undefined : end);
    const dishLabels = [
      "DAGENS VEGETARISKA",
      "STREET FOOD VEGETARISK",
      "DAGENS FISK",
      "DAGENS GRILL",
      "DAGENS STREET FOOD",
      "DAGENS KÖTT",
      "DAGENS SALLAD",
      "SALLAD",
      "SCHNITZEL FREDAG!!!!!",
    ];
    const dishDescriptions: { title: string }[] = [];
    for (let index = 0; index < section.length; index++) {
      const line = section[index];
      if (dishLabels.includes(normalize(line))) {
        const description = section[index + 2] || section[index + 1];
        if (
          description &&
          !dishLabels.includes(normalize(description)) &&
          !/^135:?/.test(description)
        ) {
          dishDescriptions.push({
            title: `${line.replace(/!+$/, "")} – ${description}`,
          });
        }
      }
    }
    return dishDescriptions;
  }, weekday);

  const normalizedItems = items.map((item) => ({
    title: lowercaseMenuText(item.title),
  }));
  return normalizedItems.length
    ? { ...base, status: "available", items: normalizedItems }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

async function fetchIndyaMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const text = await page.evaluate((currentWeekday) => {
    const normalize = (value: string) =>
      value.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
    const heading = Array.from(
      document.querySelectorAll(".Preview_component__SbiKo"),
    ).find((element) => normalize(element.textContent || "") === currentWeekday);
    if (!heading) return "";

    const headingRect = heading.getBoundingClientRect();
    const center = headingRect.left + headingRect.width / 2;
    const menu = Array.from(
      document.querySelectorAll(".Preview_component__SbiKo"),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= headingRect.bottom &&
          Math.abs(rect.left + rect.width / 2 - center) < 100 &&
          (element.textContent || "").trim().length > 80
        );
      })
      .sort(
        (left, right) =>
          left.getBoundingClientRect().top -
          right.getBoundingClientRect().top,
      )[0];

    return menu instanceof HTMLElement ? menu.innerText : "";
  }, weekday);

  const lines = text
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line && line !== ".");
  const items: LunchItem[] = [];
  for (let index = 0; index < lines.length; index++) {
    const title = lines[index];
    if (/^STÅENDE RÄTTER\b/i.test(title)) continue;

    const description = lines[index + 1];
    if (
      description &&
      !/^STÅENDE RÄTTER\b/i.test(description) &&
      !/^DAGENS\s+(?:SOPPA|SALLAD)\b/i.test(description)
    ) {
      items.push({
        title: lowercaseMenuText(`${title} – ${description}`),
      });
      index++;
    }
  }

  return items.length
    ? { ...base, status: "available", items }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

async function fetchCarotteMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const lines = await page.evaluate(() => {
    const content = document.querySelector(".o-wysiwyg-content");
    return (content?.textContent || "")
      .split("\n")
      .map((line) => line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  });
  const normalize = (line: string) =>
    line.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
  const dayIndex = lines.findIndex((line) => normalize(line) === weekday);
  if (dayIndex < 0) {
    return unavailableMenu(
      date,
      `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
    );
  }

  const isWeekday = (line: string) =>
    weekdays.some((day) => normalize(line) === day);
  const endIndex = lines.findIndex(
    (line, index) => index > dayIndex && isWeekday(line),
  );
  const dayLines = lines.slice(dayIndex + 1, endIndex < 0 ? undefined : endIndex);
  const soupIndex = lines.findIndex(
    (line, index) => index < dayIndex && normalize(line) === "DAGENS SOPPA",
  );
  const saladIndex = lines.findIndex(
    (line, index) => index < dayIndex && normalize(line) === "VECKANS SALLAD",
  );
  const items: LunchItem[] = [];

  if (soupIndex >= 0 && lines[soupIndex + 1]) {
    items.push({
      title: lowercaseMenuText(`Dagens soppa – ${lines[soupIndex + 1]}`),
    });
  }
  if (saladIndex >= 0 && lines[saladIndex + 1]) {
    const saladDescription = [lines[saladIndex + 1], lines[saladIndex + 2]]
      .filter((line) => line && !isWeekday(line))
      .join(" – ");
    items.push({
      title: lowercaseMenuText(`Veckans sallad – ${saladDescription}`),
    });
  }
  for (const line of dayLines) {
    if (/^(?:KÖTT|FISK|VEG):/i.test(line)) {
      items.push({ title: lowercaseMenuText(line) });
    }
  }

  return items.length
    ? { ...base, status: "available", items }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

async function fetchPoppelsMenu(
  page: import("playwright").Page,
  weekday: string,
  date: Date,
): Promise<LunchMenu> {
  const base = getMenuBase(date);
  const menuFrame = page.locator('iframe[data-src*="canva.com/design/"]');
  if (!(await menuFrame.count())) {
    return unavailableMenu(date, "Poppels lunchmeny kunde inte hittas.");
  }

  await menuFrame.scrollIntoViewIfNeeded();
  const iframeHandle = await menuFrame.elementHandle();
  if (!iframeHandle) {
    return unavailableMenu(date, "Poppels lunchmeny kunde inte läsas.");
  }
  await iframeHandle.evaluate((element) => {
    const iframe = element as HTMLIFrameElement;
    if (iframe.dataset.src && iframe.src.startsWith("data:")) {
      iframe.src = iframe.dataset.src;
    }
  });

  const frame = await iframeHandle.contentFrame();
  if (!frame) {
    return unavailableMenu(date, "Poppels lunchmeny kunde inte läsas.");
  }

  const text = await frame.locator("body").innerText({ timeout: 10_000 });
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const normalize = (line: string) =>
    line.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
  const dayIndex = lines.findIndex((line) => normalize(line) === weekday);
  if (dayIndex < 0) {
    return unavailableMenu(
      date,
      `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
    );
  }

  const endIndex = lines.findIndex(
    (line, index) =>
      index > dayIndex && weekdays.some((day) => day === normalize(line)),
  );
  const menuLines = lines
    .slice(dayIndex + 1, endIndex < 0 ? undefined : endIndex)
    .filter((line) => !/^(?:LUNCH|VECKANS LUNCH|DAGENS LUNCH)$/i.test(line));
  const items = menuLines.map((title) => ({
    title: lowercaseMenuText(title),
  }));

  return items.length
    ? { ...base, status: "available", items }
    : unavailableMenu(
        date,
        `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
      );
}

export async function fetchRestaurantLunchMenus(
  date = new Date(),
): Promise<RestaurantLunch[]> {
  const base = getMenuBase(date);
  if (!weekdays.some((weekday) => weekday === base.weekday)) {
    return [
      ...restaurantDefinitions(date).map((restaurant) => ({
        ...restaurant,
        menu: { ...base, status: "closed" } as LunchMenu,
      })),
    ];
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const bjorkmansPage = await browser.newPage({
      locale: "sv-SE",
      timezoneId: timeZone,
    });
    let bjorkmansMenu: LunchMenu;
    try {
      await bjorkmansPage.goto(bjorkmansUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      const items = await bjorkmansPage.evaluate((weekday) => {
        const isVisible = (element: Element) =>
          element.getClientRects().length > 0;
        const normalize = (text: string) =>
          text.replace(/\s+/g, " ").trim().toLocaleUpperCase("sv-SE");
        const heading = Array.from(document.querySelectorAll("h2")).find(
          (element) =>
            isVisible(element) && normalize(element.innerText) === weekday,
        );
        const section = heading?.parentElement?.parentElement;
        if (!heading || !section?.parentElement) return null;
        return Array.from(section.children)
          .slice(
            Array.from(section.children).indexOf(heading.parentElement!) + 1,
          )
          .filter(
            (element): element is HTMLElement =>
              element instanceof HTMLElement &&
              isVisible(element) &&
              element.classList.contains("wixui-box"),
          )
          .map((element) =>
            Array.from(element.querySelectorAll("p"))
              .map((paragraph) =>
                paragraph.innerText.replace(/\s+/g, " ").trim(),
              )
              .filter(Boolean),
          )
          .filter((parts) => parts.length >= 2)
          .map((parts) => ({
            title: parts.join(" – "),
          }));
      }, base.weekday);
      bjorkmansMenu = items?.length
        ? {
            ...base,
            status: "available",
            items: items.map((item) => ({
              title: lowercaseMenuText(item.title),
            })),
          }
        : unavailableMenu(
            date,
            `Ingen lunchmeny hittades för ${base.weekday.toLocaleLowerCase("sv-SE")}.`,
          );
    } catch (cause) {
      console.error("Unable to fetch Björkmans Skafferi lunch menu.", cause);
      bjorkmansMenu = unavailableMenu(
        date,
        "Menyn kunde inte hämtas just nu. Försök igen om en stund.",
      );
    }

    const menus: LunchMenu[] = [bjorkmansMenu];
    for (const source of [
      { url: monopoletUrl, fetch: fetchMonopoletMenu, name: "Monopolet" },
      { url: pagodenUrl, fetch: fetchPagodenMenu, name: "Pagoden" },
      { url: magasinFemUrl, fetch: fetchMagasinFemMenu, name: "Magasin 5" },
      { url: indyaUrl, fetch: fetchIndyaMenu, name: "Indya Kilsgatan" },
      { url: carotteUrl, fetch: fetchCarotteMenu, name: "Carotte Läppstiftet" },
      { url: poppelsUrl, fetch: fetchPoppelsMenu, name: "Poppels Citybryggeri" },
    ]) {
      const page = await browser.newPage({
        locale: "sv-SE",
        timezoneId: timeZone,
      });
      try {
        await page.goto(source.url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        menus.push(await source.fetch(page, base.weekday, date));
      } catch (cause) {
        console.error(`Unable to fetch ${source.name} lunch menu.`, cause);
        menus.push(
          unavailableMenu(
            date,
            "Menyn kunde inte hämtas just nu. Försök igen om en stund.",
          ),
        );
      } finally {
        await page.close();
      }
    }
    await bjorkmansPage.close();

    return restaurantDefinitions(date).map((restaurant, index) => ({
      ...restaurant,
      menu: menus[index],
    }));
  } finally {
    await browser.close();
  }
}

function restaurantDefinitions(_date: Date): Omit<RestaurantLunch, "menu">[] {
  return [
    {
      id: "bjorkmans",
      name: "Björkmans Skafferi",
      area: "GULLBERGSVASS",
      address: "Kilsgatan 4, Göteborg",
      monogram: "B.",
      url: bjorkmansUrl,
      price: "135 kr",
      description: "lunch inkl. sallad, bröd & kaffe",
      hours: "11.00–13.30",
    },
    {
      id: "monopolet",
      name: "Monopolet",
      area: "GÖTEBORG",
      address: "Kämpegatan 4, 411 04 Göteborg",
      monogram: "M.",
      url: monopoletUrl,
      price: "139 kr",
      description: "lunch",
      hours: "11.00–13.30",
    },
    {
      id: "pagoden",
      name: "Restaurang Pagoden",
      area: "GULLBERGS STRANDGATA",
      address: "Gullbergs Strandgata 15, 411 04 Göteborg",
      monogram: "P.",
      url: pagodenUrl,
      description: "salladsbuffé, nybakat bröd, kaffe & kaka",
      hours: "11.00–13.30",
    },
    {
      id: "magasin-fem",
      name: "Magasin 5",
      area: "LILLA BOMMEN",
      address: "Lilla Bommen 5, 411 04 Göteborg",
      monogram: "M5",
      url: magasinFemUrl,
      price: "135 kr",
      description: "lunch",
      hours: "11.00–13.30",
    },
    {
      id: "indya-kilsgatan",
      name: "Indya Kilsgatan",
      area: "GULLBERGSVASS",
      address: "Kilsgatan, Göteborg",
      monogram: "I.",
      url: indyaUrl,
      price: "129 kr",
      description: "inkl. naanbröd, sallad, kaffe och kaka",
      hours: "11.00–13.30",
    },
    {
      id: "carotte-lappstiftet",
      name: "Carotte Läppstiftet",
      area: "LILLA BOMMEN",
      address: "Läppstiftet, Göteborg",
      monogram: "C.",
      url: carotteUrl,
      price: "149 kr",
      description: "inkl. salladsbuffé & kaffe/te",
      hours: "11.15–13.15",
    },
    {
      id: "poppels-citybryggeri",
      name: "Poppels Citybryggeri",
      area: "GÖTEBORG",
      address: "Vikingsgatan 1, Göteborg",
      monogram: "P.",
      url: poppelsUrl,
      description: "lunch",
      hours: "mån 11.30–14.00, tis–fre 11.30–23.00",
    },
  ];
}

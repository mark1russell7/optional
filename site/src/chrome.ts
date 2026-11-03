// The parts of the page that all sections use: the element helper, the element lookup and the theme button.

type Child = Node | string | null | undefined | false;

/** This function makes an element with attributes and children. An attribute with the value `false` or `null` is not set. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Readonly<Record<string, string | number | boolean | null | undefined>> = {},
  ...children: readonly (Child | readonly Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (name === "class") el.className = String(value);
    else el.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

/** The element with the ID. The page has each ID that the code asks for, so a missing ID is an error of the page. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`The page has no element "${id}".`);
  return el as T;
}

const THEMES = ["auto", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];
const THEME_KEY = "optional-theme";

/** The theme button: auto (the setting of the system), light and dark, in turn. The choice stays in this browser. */
export function setupTheme(button: HTMLButtonElement): void {
  const read = (): Theme => {
    const t = document.documentElement.dataset["theme"];
    return t === "light" || t === "dark" ? t : "auto";
  };
  const show = (theme: Theme): void => {
    button.textContent = `Theme: ${theme}`;
    button.setAttribute("aria-label", `Color theme: ${theme}. Select to change.`);
  };
  show(read());
  button.addEventListener("click", () => {
    const next = THEMES[(THEMES.indexOf(read()) + 1) % THEMES.length]!;
    if (next === "auto") delete document.documentElement.dataset["theme"];
    else document.documentElement.dataset["theme"] = next;
    try {
      if (next === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // A browser with no storage keeps the theme until the page closes.
    }
    show(next);
  });
}

/** This function copies text, and the button tells the result for a short time. */
export async function copyText(button: HTMLButtonElement, text: string): Promise<void> {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  }
  window.setTimeout(() => {
    button.textContent = label;
  }, 1600);
}

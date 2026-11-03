// The probe of the playground and of the law panel. The site check of the Pages workflow runs it in a browser, at
// each width, before the deploy (site-check-probe in .github/workflows/pages.yml). A failed check stops the deploy.
// The helpers check, wait, until, $, $$, type and click come from the site check (the README of site-pages).

const result = () => $("#result-value")?.textContent ?? "";
const states = () => $$("#track .station[data-index]").map((li) => li.dataset.state);

check("the first example gives 8", await until(() => result() === "8"), result());
check("the track shows some at each step of the first example", states().join() === "some,some,some,value", states().join());

click('#quick [data-input="null"]');
check("the input null gives none after fromNullable", await until(() => states()[0] === "none"), states().join());
check("after none, the steps are skipped", states().slice(1, -1).every((s) => s === "skipped"), states().join());
check("the input null gives the default 0", result() === "0", result());

type("#value", "25");
check("the typed value 25 gives 10", await until(() => result() === "10"), result());

click('#quick [data-input="throw"]');
check("a read that throws stops the pipeline", await until(() => $("#result")?.dataset.state === "error"), result());
click('#starts [data-id="try"]');
check("the start try changes the exception into none", await until(() => states()[0] === "none" && result() === "0"), `${states().join()} ${result()}`);

const before = states().length;
click('#palette [data-add="inc"]');
check("a new step adds a station", await until(() => states().length === before + 1), `${before} -> ${states().length}`);

click('#presets [data-preset="why"]');
check("some(null) is present, so map gives some(0)", await until(() => result() === "some(0)"), result());

const laws = () => $$("#law-list .law");
check("the panel shows the five laws", await until(() => laws().length === 5), `${laws().length} laws`);
check(
  "each law passes on each case",
  laws().every((law) => law.dataset.ok === "true" && /200 \/ 200/.test(law.querySelector(".count")?.textContent ?? "")),
  laws().map((law) => `${law.dataset.law}: ${law.querySelector(".count")?.textContent}`).join(", "),
);

click("#broken");
const failing = () => laws().filter((law) => law.dataset.ok === "false").map((law) => law.dataset.law);
check("the broken implementation fails the identity laws on o", await until(() => failing().join() === "functor-identity,right-identity"), failing().join());
click("#broken");
check("the package passes again", await until(() => failing().length === 0), failing().join());

check("the API table shows a live result for each row", $$("#api-rows tr").length === 7 && $$("#api-rows output").every((o) => (o.textContent ?? "") !== ""), `${$$("#api-rows tr").length} rows`);

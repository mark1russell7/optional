import { describe, expect, it } from "vitest";
import { none, some } from "@mark1russell7/optional";
import { checkLaws, FILTER_FNS, FLAT_FNS, inputs, MAP_FNS, same, type Settings } from "./laws.ts";

const base: Settings = { seed: "optional", count: 200, mapF: "double", mapG: "inc", flatF: "sqrt", flatG: "divide" };

describe("the laws", () => {
  it("each law passes for the package, with each pair of functions", () => {
    for (const f of MAP_FNS) for (const g of MAP_FNS) for (const kf of FLAT_FNS) for (const kg of FLAT_FNS) {
      const results = checkLaws({ ...base, count: 60, mapF: f.id, mapG: g.id, flatF: kf.id, flatG: kg.id });
      for (const law of results) expect(law.passed, `${law.id} ${f.id} ${g.id} ${kf.id} ${kg.id}`).toBe(law.cases.length);
    }
  });

  it("the filter laws pass for the package, with each pair of predicates", () => {
    for (const p of FILTER_FNS) for (const q of FILTER_FNS) {
      const results = checkLaws({ ...base, count: 60, filterP: p.id, filterQ: q.id }).filter((law) => law.family === "filter");
      expect(results.map((law) => law.id)).toEqual(["filter-identity", "filter-composition"]);
      for (const law of results) expect(law.passed, `${law.id} ${p.id} ${q.id}`).toBe(law.cases.length);
    }
  });

  it("the broken implementation fails the identity laws on o, and only them", () => {
    const results = checkLaws({ ...base, broken: true });
    const failing = results.filter((law) => law.passed < law.cases.length).map((law) => law.id);
    expect(failing).toEqual(["functor-identity", "right-identity"]);
  });

  it("a seed always gives the same cases, and about one in four is absent", () => {
    const a = inputs("optional", 400);
    expect(inputs("optional", 400)).toEqual(a);
    expect(inputs("other", 400)).not.toEqual(a);
    const absent = a.filter((c) => c.o.tag === "none").length;
    expect(absent).toBeGreaterThan(60);
    expect(absent).toBeLessThan(140);
  });

  it("a typed value is the first case", () => {
    const [first] = checkLaws({ ...base, typed: 7 })[0]!.cases;
    expect(first).toMatchObject({ typed: true, input: "o = some(7)" });
  });

  it("same compares the tag and the value", () => {
    expect(same(some(1), some(1))).toBe(true);
    expect(same(some(Number.NaN), some(Number.NaN))).toBe(true);
    expect(same(some(1), some(2))).toBe(false);
    expect(same(none, none)).toBe(true);
    expect(same(some(0), none)).toBe(false);
  });
});

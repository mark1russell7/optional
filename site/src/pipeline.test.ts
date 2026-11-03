import { describe, expect, it } from "vitest";
import { code, ENDS, parseInput, PRESETS, run, STARTS, STEPS, THROWS, showValue, type Pipeline } from "./pipeline.ts";

const pipe = (input: Pipeline["input"], steps: string[], end = "getOr", start = "fromNullable"): Pipeline => ({ input, start, steps, end });
const states = (p: Pipeline): string[] => run(p).stations.map((s) => s.state);

describe("parseInput", () => {
  it("reads numbers, null, undefined and throw", () => {
    expect(parseInput(" 16 ")).toEqual({ ok: true, input: 16 });
    expect(parseInput("-2.5")).toEqual({ ok: true, input: -2.5 });
    expect(parseInput("null")).toEqual({ ok: true, input: null });
    expect(parseInput("undefined")).toEqual({ ok: true, input: undefined });
    expect(parseInput("throw")).toEqual({ ok: true, input: THROWS });
    expect(parseInput("abc").ok).toBe(false);
    expect(parseInput("").ok).toBe(false);
  });
});

describe("run", () => {
  it("a present value goes through each step", () => {
    const trace = run(pipe(16, ["sqrt", "double"]));
    expect(trace.stations.map((s) => s.shown)).toEqual(["some(16)", "some(4)", "some(8)", "8"]);
    expect(trace.result).toBe("8");
    expect(trace.state).toBe("value");
  });

  it("after a none, the functions do not run", () => {
    expect(states(pipe(-9, ["sqrt", "double", "inc"]))).toEqual(["some", "none", "skipped", "skipped", "value"]);
    expect(run(pipe(-9, ["sqrt", "double"])).result).toBe("0");
    expect(states(pipe(null, ["double"]))).toEqual(["none", "skipped", "value"]);
  });

  it("some(null) is present, so map runs", () => {
    const trace = run(pipe(null, ["double"], "keep", "some"));
    expect(trace.result).toBe("some(0)");
    expect(trace.state).toBe("some");
  });

  it("a read that throws stops the pipeline, unless the start catches it", () => {
    const stopped = run(pipe(THROWS, ["double"]));
    expect(stopped.state).toBe("error");
    expect(stopped.stations.map((s) => s.state)).toEqual(["error", "not-run", "not-run"]);
    const caught = run(pipe(THROWS, ["double"], "getOr", "try"));
    expect(caught.stations.map((s) => s.state)).toEqual(["none", "skipped", "value"]);
    expect(caught.result).toBe("0");
  });

  it("the sentinel steps change -1 into none and back", () => {
    expect(run(pipe(-1, ["inc"], "toSentinel", "fromSentinel")).result).toBe("-1");
    expect(run(pipe(4, ["inc"], "toSentinel", "fromSentinel")).result).toBe("5");
  });

  it("each start, step and end runs", () => {
    for (const start of STARTS) for (const end of ENDS) for (const input of [3, 0, -4, null, undefined]) {
      expect(() => run({ input, start: start.id, steps: STEPS.map((s) => s.id), end: end.id })).not.toThrow();
    }
  });

  it("each preset runs", () => {
    for (const preset of PRESETS) expect(run(preset.pipeline).stations.length).toBeGreaterThan(1);
  });
});

describe("code", () => {
  it("names the functions that the pipeline uses", () => {
    const text = code(pipe(16, ["sqrt", "double"]));
    expect(text).toContain('import { flatMap, fromNullable, getOr, map, none, some } from "@mark1russell7/optional";');
    expect(text).toContain("const o0 = fromNullable(16);");
    expect(text).toContain("const o2 = map(o1, (x) => x * 2);");
    expect(text).toContain("const result = getOr(o2, 0);");
  });
});

describe("showValue", () => {
  it("shows numbers with at most 4 decimals", () => {
    expect(showValue(Math.sqrt(2))).toBe("1.4142");
    expect(showValue(-0)).toBe("0");
    expect(showValue(Number.NaN)).toBe("NaN");
    expect(showValue(true)).toBe("true");
  });
});

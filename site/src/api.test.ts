import { describe, expect, it } from "vitest";
import { API, result } from "./api.ts";

describe("the API table", () => {
  it("names each export of the package", async () => {
    const pkg = await import("@mark1russell7/optional");
    const named = API.flatMap((row) => row.names.map((name) => name.replace(/[(<].*$/, "")));
    for (const name of Object.keys(pkg)) expect(named).toContain(name);
  });

  it("gives the results of the README", () => {
    const all = Object.fromEntries(API.flatMap((row) => row.examples.map((e) => [e.code, result(e)])));
    expect(all["map(some(4), (w) => w * 2)"]).toBe("some(8)");
    expect(all["getOr(none, 9)"]).toBe("9");
    expect(all["fromNullable(undefined)"]).toBe("none");
    expect(all["unwrap(none)"]).toBe("undefined");
    expect(all["JSON.stringify(some(4))"]).toBe('{"tag":"some","value":4}');
  });
});

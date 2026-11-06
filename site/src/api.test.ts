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
    expect(all['JSON.stringify(err("no key"))']).toBe('{"tag":"err","error":"no key"}');
    expect(all["ok(4)"]).toBe("ok(4)");
    expect(all["isErr(err(1))"]).toBe("true");
    expect(all["isOk(err(1))"]).toBe("false");
    expect(all["mapResult(ok(4), (w) => w * 2)"]).toBe("ok(8)");
    expect(all['flatMapResult(ok(3), (x) => (x > 5 ? ok(x) : err("small")))']).toBe('err("small")');
    expect(all["mapErr(err(404), (code) => `HTTP ${code}`)"]).toBe('err("HTTP 404")');
    expect(all['getOkOr(err("no key"), 0)']).toBe("0");
    expect(all['tryCatch(() => JSON.parse("{"), (e) => e.name)']).toBe('err("SyntaxError")');
    expect(all['tryCatch(() => JSON.parse("2"))']).toBe("ok(2)");
    expect(all["typeof tryCatchAsync(async () => 1).then"]).toBe("function");
    expect(all['fromOptional(none, "absent")']).toBe('err("absent")');
    expect(all["toOptional(err(1))"]).toBe("none");
  });
});

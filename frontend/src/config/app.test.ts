import { describe, expect, it } from "vitest";
import { APP_NAME } from "./app";

describe("application identity", () => {
  it("uses the canonical application name", () => {
    expect(APP_NAME).toBe("deplens");
  });
});

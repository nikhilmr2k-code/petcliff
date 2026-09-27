import { describe, it, expect } from "vitest";
import { computeKitSavings, KIT_DISCOUNT } from "./CartContext";

const item = (kit_id, price, quantity = 1) => ({ id: Math.random(), kit_id, price, quantity });

describe("computeKitSavings (Style Your Kit 3+ rule)", () => {
  it("applies 20% off when a kit has 3+ items", () => {
    const items = [item("k1", 50), item("k1", 30), item("k1", 20)]; // $100 in kit k1
    expect(computeKitSavings(items)).toBe(100 * KIT_DISCOUNT); // $20
  });

  it("gives no discount for fewer than 3 items in a kit", () => {
    const items = [item("k1", 50), item("k1", 30)]; // only 2
    expect(computeKitSavings(items)).toBe(0);
  });

  it("ignores loose items without a kit_id", () => {
    const items = [item(null, 50), item(null, 40), item(null, 30)];
    expect(computeKitSavings(items)).toBe(0);
  });

  it("respects item quantity within a kit", () => {
    const items = [item("k1", 10, 2), item("k1", 10), item("k1", 10)]; // qty 2+1+1 = $40
    expect(computeKitSavings(items)).toBe(40 * KIT_DISCOUNT); // $8
  });
});

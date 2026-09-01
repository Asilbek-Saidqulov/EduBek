import { splitMarketplaceGross, MIN_LIST_PRICE_UZS } from "../policy";

describe("marketplace split invariants", () => {
  it("never pays creator more than gross minus fees", () => {
    const s = splitMarketplaceGross(50_000n);
    expect(s.creatorShare + s.platformTake + s.providerFee + s.refundReserve).toBe(50_000n);
    expect(s.creatorShare).toBeGreaterThan(0n);
    expect(s.platformTake).toBeGreaterThanOrEqual(1000n);
  });

  it("rejects prices below floor", () => {
    expect(() => splitMarketplaceGross(MIN_LIST_PRICE_UZS - 1n)).toThrow("PRICE_BELOW_FLOOR");
  });

  it("rejects negative prices", () => {
    expect(() => splitMarketplaceGross(-1n)).toThrow("NEGATIVE_PRICE");
  });
});

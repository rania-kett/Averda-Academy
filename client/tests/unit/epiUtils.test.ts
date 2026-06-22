import { describe, it, expect } from "vitest";
import {
  getDaysUntilExpiry,
  getExpiryDate,
  getExpiryLabel,
  computeDisplayStatus,
} from "@/utils/epiExpiry";

describe("epiExpiry utils", () => {
  const itemName = "حذاء السلامة";

  it("item with expiry in the past → needs_renewal display status", () => {
    const received = new Date();
    received.setDate(received.getDate() - 400);
    const status = computeDisplayStatus("received", itemName, received);
    expect(status).toBe("needs_renewal");
  });

  it("item expiring in 30 days → orange label", () => {
    const received = new Date();
    received.setDate(received.getDate() - (365 - 30));
    const expiry = getExpiryDate(itemName, received)!;
    const days = getDaysUntilExpiry(expiry);
    expect(days).toBeLessThanOrEqual(30);
    const label = getExpiryLabel(itemName, received);
    expect(label.color).toBe("orange");
  });

  it("item expiring in 90 days → green label (not urgent)", () => {
    const received = new Date();
    received.setDate(received.getDate() - (365 - 90));
    const expiry = getExpiryDate(itemName, received)!;
    const days = getDaysUntilExpiry(expiry);
    expect(days).toBeGreaterThan(30);
    const label = getExpiryLabel(itemName, received);
    expect(label.color).toBe("green");
  });
});

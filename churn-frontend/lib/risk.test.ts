import { describe, expect, it } from "vitest";
import { getRiskLevel } from "./risk";

describe("getRiskLevel", () => {
  it("classifies probabilities >= 0.7 as High Risk", () => {
    expect(getRiskLevel(0.7).label).toBe("High Risk");
    expect(getRiskLevel(0.95).label).toBe("High Risk");
  });

  it("classifies probabilities between 0.4 and 0.7 as Medium Risk", () => {
    expect(getRiskLevel(0.4).label).toBe("Medium Risk");
    expect(getRiskLevel(0.699).label).toBe("Medium Risk");
  });

  it("classifies probabilities below 0.4 as Low Risk", () => {
    expect(getRiskLevel(0.399).label).toBe("Low Risk");
    expect(getRiskLevel(0).label).toBe("Low Risk");
  });

  it("returns the expected styling tokens for each level", () => {
    expect(getRiskLevel(0.8)).toEqual({
      label: "High Risk",
      text: "text-red-600",
      bar: "bg-red-500",
      badge: "bg-red-100 text-red-700",
    });

    expect(getRiskLevel(0.5).label).toBe("Medium Risk");
    expect(getRiskLevel(0.1).label).toBe("Low Risk");
  });
});

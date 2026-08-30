import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("foundation page", () => {
  it("identifies ATLAS and keeps final design explicitly pending", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "ATLAS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Foundation status" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Design handoff status" })).toHaveTextContent(
      "Design handoff pending",
    );
  });
});

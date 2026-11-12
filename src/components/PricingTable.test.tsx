import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import PricingTable from "@/components/PricingTable";

describe("PricingTable theme toggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("turns dark mode on from the corner button", () => {
    render(
      <MemoryRouter>
        <PricingTable />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(toggle).toHaveClass("pricing-theme");
    expect(toggle.parentElement).toHaveClass("pricing-board");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.getElementById("pricing")).not.toHaveClass("dark");

    fireEvent.click(toggle);

    expect(document.getElementById("pricing")).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("tutorconnect-pricing-theme")).toBe("dark");
  });

  it("opens in dark mode when that choice was saved", () => {
    localStorage.setItem("tutorconnect-pricing-theme", "dark");

    render(
      <MemoryRouter>
        <PricingTable />
      </MemoryRouter>,
    );

    expect(document.getElementById("pricing")).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });
});

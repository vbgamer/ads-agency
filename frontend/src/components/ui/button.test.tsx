import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button component", () => {
  it("renders correctly with children", () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByText("Click me");
    expect(buttonElement).toBeDefined();
  });

  it("applies variant classes properly", () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttonElement = screen.getByText("Delete");
    // Destructive variant uses standard destructive classes from tailwind
    expect(buttonElement.className).toContain("bg-destructive");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturesMenu from "./features-menu";

const dispatch = vi.fn();
vi.mock("@/hooks/useFiles", () => ({
  useFileDispatch: () => dispatch,
}));

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) =>
      `${options?.ns ?? "common"}:${key}`,
  }),
}));

describe("FeaturesMenu", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockClear();
  });

  it("clears files and navigates to the selected feature", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("dataset:title"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({
      to: "/app/$feature",
      params: { feature: "DATA_SET" },
    });
  });

  it("renders a full-width settings action", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("common:settings"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({ to: "/home/host" });
  });
});

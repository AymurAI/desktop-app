import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  useTranslation: (namespace?: string) => ({
    t: (key: string, options?: { ns?: string }) =>
      `${options?.ns ?? namespace ?? "common"}:${key}`,
  }),
}));

describe("FeaturesMenu", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockReset();
  });

  it("clears files and navigates to the selected feature only after the navigation resolves", async () => {
    let resolveNavigate: () => void = () => {};
    navigate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveNavigate = resolve;
        }),
    );

    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("dataset:title"));

    expect(navigate).toHaveBeenCalledWith({
      to: "/app/$feature",
      params: { feature: "DATA_SET" },
    });
    expect(dispatch).not.toHaveBeenCalled();

    resolveNavigate();

    await waitFor(() => expect(dispatch).toHaveBeenCalledOnce());
  });

  it("navigates to /home/host and clears files only after the navigation resolves", async () => {
    let resolveNavigate: () => void = () => {};
    navigate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveNavigate = resolve;
        }),
    );

    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("common:settings"));

    expect(navigate).toHaveBeenCalledWith({ to: "/home/host" });
    expect(dispatch).not.toHaveBeenCalled();

    resolveNavigate();

    await waitFor(() => expect(dispatch).toHaveBeenCalledOnce());
  });
});

describe("FeaturesMenu — Summarizer", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockClear();
  });

  it("navigates to the Summarizer flow with the short label and clears files on click", async () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("common:featuresMenu.summary"));

    expect(navigate).toHaveBeenCalledWith({
      to: "/app/$feature",
      params: { feature: "SUMMARIZER" },
    });
    await waitFor(() => expect(dispatch).toHaveBeenCalledOnce());
  });

  it("does not render the full Summarizer title in the menu", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    expect(screen.queryByText("summarizer:title")).toBeNull();
  });
});

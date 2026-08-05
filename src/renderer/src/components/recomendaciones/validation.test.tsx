import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChangeEvent, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DocFile } from "@/types/file";
import type {
  RecomendacionState,
  RecomendacionValues,
} from "@/types/recomendaciones";
import { RecomendacionValidation } from "./validation";

const navigate = vi.fn();
const dispatch = vi.fn();
const showToast = vi.fn();
const saveRecomendacion = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/showToast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

vi.mock("@/components/layout/header", () => ({ default: () => null }));
vi.mock("@/components/layout/footer", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <footer>{children}</footer>
  ),
}));
vi.mock("../file-annotator", () => ({ default: () => null }));

vi.mock("@/services/aymurai/recomendaciones", () => ({
  saveRecomendacion: (...args: unknown[]) => saveRecomendacion(...args),
}));

let currentFile: DocFile;
vi.mock("@/hooks", () => ({
  useFiles: () => [currentFile],
  useFileDispatch: () => dispatch,
}));

// Simplified, easily-interactable stand-ins for the real @aymurai/ui
// components (mirrors the pattern used by components/layout/footer.test.tsx).
vi.mock("@aymurai/ui", () => ({
  TextField: ({
    label,
    value,
    onChange,
    onFocus,
    suggestion,
  }: {
    label: string;
    value: string | undefined;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    suggestion?: string;
  }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        aria-label={label}
        value={value ?? ""}
        onChange={onChange}
        onFocus={onFocus}
      />
      {suggestion && (
        <span data-testid={`suggestion:${label}`}>{suggestion}</span>
      )}
    </div>
  ),
  Select: ({
    label,
    value,
    onChange,
    options,
    suggestion,
  }: {
    label: string;
    value?: string;
    onChange?: (option: { id: string; text: string }) => void;
    options: { id: string; text: string }[];
    suggestion?: { id: string };
  }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <select
        id={label}
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => {
          const picked = options.find(
            (option) => option.id === event.target.value,
          );
          if (picked) onChange?.(picked);
        }}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.text}
          </option>
        ))}
      </select>
      {suggestion?.id && (
        <span data-testid={`suggestion:${label}`}>{suggestion.id}</span>
      )}
    </div>
  ),
  Radio: ({
    children,
    checked,
    onChange,
    value,
    name,
  }: {
    children?: ReactNode;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    value?: string;
    name?: string;
  }) => (
    <label>
      <input
        type="radio"
        name={name}
        value={value}
        checked={!!checked}
        onChange={() => onChange?.(true)}
      />
      {children}
    </label>
  ),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Callout: ({ message }: { message: string }) => <output>{message}</output>,
  Suggestion: ({ children }: { children?: ReactNode }) => (
    <span>{children}</span>
  ),
}));

function buildValues(
  overrides: Partial<RecomendacionValues> = {},
): RecomendacionValues {
  return {
    numero_recomendacion: "123/2024",
    fecha_recomendacion: "2024-01-01",
    destinatarios: [
      {
        id: "d1",
        nombre: "Juan Perez",
        cargo: "Director",
        destinatario_principal: true,
        sector: "GCBA",
      },
      {
        id: "d2",
        nombre: "Maria Lopez",
        cargo: "Subsecretaria",
        destinatario_principal: false,
        sector: "GCBA",
      },
    ],
    tema: "SALUD",
    subtema: "SAME",
    datos_personales: false,
    contenido_para_publicar: "Contenido a publicar",
    ...overrides,
  };
}

function buildState(
  overrides: Partial<RecomendacionState> = {},
): RecomendacionState {
  const values = buildValues();
  return {
    documentId: "doc-1",
    origin: "inference",
    inference: {
      numero_recomendacion: values.numero_recomendacion,
      fecha_recomendacion: values.fecha_recomendacion,
      destinatarios: [],
      tema: values.tema,
      subtema: values.subtema,
      datos_personales: values.datos_personales ?? false,
      contenido_para_publicar: values.contenido_para_publicar,
    },
    suggestions: values,
    values,
    ...overrides,
  };
}

function buildFile(recomendacion: RecomendacionState): DocFile {
  return {
    data: new File(["x"], "doc.docx"),
    selected: true,
    validationObject: {},
    paragraphs: [
      { id: "p1", value: "Juan Perez Director", document_id: "doc-1" },
    ],
    recomendacion,
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecomendacionValidation />
    </QueryClientProvider>,
  );
}

describe("RecomendacionValidation", () => {
  beforeEach(() => {
    navigate.mockReset();
    dispatch.mockReset();
    showToast.mockReset();
    saveRecomendacion.mockReset();
    saveRecomendacion.mockResolvedValue(undefined);
    currentFile = buildFile(buildState());
  });

  it("renders a TextField per scalar value and one tab per destinatario", () => {
    renderScreen();

    expect(screen.getByLabelText("validation.numeroRecomendacion")).toHaveValue(
      "123/2024",
    );
    expect(screen.getByLabelText("validation.fechaRecomendacion")).toHaveValue(
      "2024-01-01",
    );
    expect(screen.getByLabelText("validation.tema")).toHaveValue("SALUD");
    expect(screen.getByLabelText("validation.subtema")).toHaveValue("SAME");

    expect(
      screen.getByText("validation.destinatarioLabel 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("validation.destinatarioLabel 2"),
    ).toBeInTheDocument();
  });

  it("clears subtema when tema changes to one whose taxonomy no longer includes it", () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText("validation.tema"), {
      target: { value: "TURISMO" },
    });

    expect(screen.getByLabelText("validation.subtema")).toHaveValue("");
  });

  it("calls the mutation with a payload containing no id", async () => {
    renderScreen();

    fireEvent.click(screen.getByText("validation.validar"));

    await waitFor(() => expect(saveRecomendacion).toHaveBeenCalled());

    const [documentId, validation] = saveRecomendacion.mock.calls[0];
    expect(documentId).toBe("doc-1");
    expect(validation).not.toHaveProperty("id");
    expect(validation.destinatarios).toHaveLength(2);
    // The local `id` lives on each DESTINATARIO, not on the top-level
    // payload (which never had one under any implementation).
    for (const destinatario of validation.destinatarios) {
      expect(destinatario).not.toHaveProperty("id");
      expect(Object.keys(destinatario).sort()).toEqual(
        ["cargo", "destinatario_principal", "nombre", "sector"].sort(),
      );
    }
  });

  it("still navigates to finish when the mutation rejects", async () => {
    saveRecomendacion.mockRejectedValue(new Error("save failed"));
    renderScreen();

    fireEvent.click(screen.getByText("validation.validar"));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "validation.saveFailed",
        "warning",
      );
      expect(dispatch).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith({
        to: "/app/$feature/finish",
        params: { feature: "RECOMENDACIONES" },
      });
    });
  });

  it("disables the validate button while the save is pending, so a second click cannot fire a second mutation (§F2)", async () => {
    let resolveSave: () => void = () => {};
    saveRecomendacion.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderScreen();

    const button = screen.getByText("validation.validar");
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    // A disabled native <button> does not dispatch click events, matching
    // the precedent in components/voice-to-text/validation.tsx.
    fireEvent.click(button);
    expect(saveRecomendacion).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  it("(§X5) shows the current value while the suggestion mark carries the original inference", () => {
    const values = buildValues({ numero_recomendacion: "999/2024" });
    const suggestions = buildValues({ numero_recomendacion: "111/2024" });
    const state = buildState({
      origin: "validation",
      values,
      suggestions,
    });
    currentFile = buildFile(state);
    renderScreen();

    expect(screen.getByLabelText("validation.numeroRecomendacion")).toHaveValue(
      "999/2024",
    );
    expect(
      screen.getByTestId("suggestion:validation.numeroRecomendacion"),
    ).toHaveTextContent("111/2024");
  });

  it("(§6) keeps an out-of-taxonomy tema, injects it as an extra option, and shows the error", () => {
    const values = buildValues({ tema: "TEMA INEXISTENTE" });
    // Leave `suggestions` at the default fixture (SALUD/SAME) so the
    // injected option's text can't collide with a suggestion mark's text.
    currentFile = buildFile(buildState({ values }));
    renderScreen();

    const temaSelect = screen.getByLabelText(
      "validation.tema",
    ) as HTMLSelectElement;
    expect(temaSelect).toHaveValue("TEMA INEXISTENTE");
    expect(
      Array.from(temaSelect.options).map((option) => option.value),
    ).toContain("TEMA INEXISTENTE");
    expect(
      screen.getByText("validation.temaOutOfTaxonomy"),
    ).toBeInTheDocument();
  });

  it("(§6) keeps an out-of-taxonomy subtema for the current tema, injects it, and shows the error", () => {
    const values = buildValues({
      tema: "SALUD",
      subtema: "SUBTEMA INEXISTENTE",
    });
    currentFile = buildFile(buildState({ values }));
    renderScreen();

    const subtemaSelect = screen.getByLabelText(
      "validation.subtema",
    ) as HTMLSelectElement;
    expect(subtemaSelect).toHaveValue("SUBTEMA INEXISTENTE");
    expect(
      Array.from(subtemaSelect.options).map((option) => option.value),
    ).toContain("SUBTEMA INEXISTENTE");
    expect(
      screen.getByText("validation.subtemaOutOfTaxonomy"),
    ).toBeInTheDocument();
  });

  // §I3: `sector` lacked the keep-and-flag mitigation `tema`/`subtema` got, so
  // a model value outside SECTOR_OPTIONS rendered as an EMPTY Select while
  // `values.sector` silently retained it and shipped it to the save payload
  // and the Excel columns — the user exported a value they never saw.
  it("(§I3) keeps an out-of-list sector, injects it as an extra option, and shows the error", () => {
    const values = buildValues();
    values.destinatarios[0].sector = "SECTOR INEXISTENTE";
    // `suggestions` keeps the default fixture (GCBA) so the injected option's
    // text can't collide with a suggestion mark's text.
    currentFile = buildFile(buildState({ values }));
    renderScreen();

    const sectorSelect = screen.getByLabelText(
      "validation.sector",
    ) as HTMLSelectElement;
    expect(sectorSelect).toHaveValue("SECTOR INEXISTENTE");
    expect(
      Array.from(sectorSelect.options).map((option) => option.value),
    ).toContain("SECTOR INEXISTENTE");
    expect(screen.getByText("validation.sectorOutOfList")).toBeInTheDocument();
  });

  it("(§I3) renders no out-of-list sector error when the sector is in the list", () => {
    renderScreen(); // default fixture: sector GCBA

    expect(
      screen.queryByText("validation.sectorOutOfList"),
    ).not.toBeInTheDocument();
  });

  it("(§6) renders no out-of-taxonomy error when tema and subtema are both in the taxonomy", () => {
    renderScreen(); // default fixture: tema SALUD / subtema SAME, both valid

    expect(
      screen.queryByText("validation.temaOutOfTaxonomy"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("validation.subtemaOutOfTaxonomy"),
    ).not.toBeInTheDocument();
  });
});

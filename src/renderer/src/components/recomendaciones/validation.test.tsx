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
    candidates: {},
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

  it("picking an organigram candidate for nombre writes into the nombre field and leaves cargo untouched (§X4)", () => {
    const state = buildState({
      candidates: {
        d1: {
          nombre: [
            {
              nombre: "Juan Pérez (candidato)",
              cargo: "Director General",
              sigla: "DG",
              depende_de_cargo: null,
              ruta_cargos: "Ministerio > DG",
              score: 90,
            },
          ],
          cargo: [],
        },
      },
    });
    currentFile = buildFile(state);
    renderScreen();

    fireEvent.change(screen.getByLabelText("validation.organigramCandidates"), {
      target: { value: "Juan Pérez (candidato)" },
    });

    expect(screen.getByLabelText("validation.nombre")).toHaveValue(
      "Juan Pérez (candidato)",
    );
    expect(screen.getByLabelText("validation.cargo")).toHaveValue("Director");
  });

  it("calls the mutation with a payload containing no id and no candidatos_* keys", async () => {
    renderScreen();

    fireEvent.click(screen.getByText("validation.validar"));

    await waitFor(() => expect(saveRecomendacion).toHaveBeenCalled());

    const [documentId, validation] = saveRecomendacion.mock.calls[0];
    expect(documentId).toBe("doc-1");
    expect(validation).not.toHaveProperty("id");
    for (const destinatario of validation.destinatarios) {
      expect(destinatario).not.toHaveProperty("candidatos_nombre");
      expect(destinatario).not.toHaveProperty("candidatos_cargo");
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
});

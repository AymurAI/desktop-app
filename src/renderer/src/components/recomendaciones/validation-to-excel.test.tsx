import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Workbook } from "exceljs";
import { type ChangeEvent, type ReactNode, useReducer, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileContext, FileDispatchContext } from "@/context/File";
import reducer from "@/reducers/file";
import { RECOMENDACIONES_SHEET } from "@/services/filesystem/excel/recomendaciones-sheet";
import type { DocFile } from "@/types/file";
import type { RecomendacionState } from "@/types/recomendaciones";

// The seam this file exists for: validation screen -> file reducer -> finish
// screen -> the actual .xlsx row. Every per-task test stopped at one side of
// it (validation.test.tsx asserts the save MUTATION payload;
// submit-recomendacion.test.ts feeds `toExcelRow` directly), which is why C1 —
// edits never written back into `file.recomendacion`, so the Excel export
// carried the raw LLM inference — survived every prior review. So the reducer,
// the contexts, `useFiles`/`useFileDispatch`, the form hook,
// `submitRecomendacion` and `toExcelRow` are all REAL here; only the DOM
// shell, the network and the filesystem are mocked.

const navigate = vi.fn();
const saveRecomendacion = vi.fn();

// An in-memory "disk" that round-trips through real xlsx bytes on every read,
// mirroring `submit-recomendacion.test.ts` (and the real service).
type DiskBuffer = Awaited<ReturnType<Workbook["xlsx"]["writeBuffer"]>>;
let disk: DiskBuffer | null = null;

vi.mock("@/services/filesystem", () => ({
  default: {
    excel: {
      read: async () => {
        if (!disk) return null;
        const workbook = new Workbook();
        await workbook.xlsx.load(disk);
        return workbook;
      },
      create: () => new Workbook(),
      write: async (workbook: Workbook) => {
        disk = await workbook.xlsx.writeBuffer();
      },
      open: vi.fn(),
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/features/showToast", () => ({ showToast: vi.fn() }));
vi.mock("@/components/layout/header", () => ({ default: () => null }));
vi.mock("@/components/layout/footer", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <footer>{children}</footer>
  ),
}));
vi.mock("../file-annotator", () => ({ default: () => null }));
vi.mock("@/components/file-check", () => ({ default: () => null }));
vi.mock("@/components/finish/finish-main-content", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/services/aymurai/recomendaciones", () => ({
  saveRecomendacion: (...args: unknown[]) => saveRecomendacion(...args),
}));

vi.mock("@aymurai/ui", () => ({
  TextField: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        aria-label={label}
        value={value ?? ""}
        onChange={onChange}
      />
    </div>
  ),
  Select: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value?: string;
    onChange?: (option: { id: string; text: string }) => void;
    options: readonly { id: string; text: string }[];
  }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <select
        id={label}
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => {
          const picked = options.find((o) => o.id === event.target.value);
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

import RecomendacionFinish from "./finish";
import { RecomendacionValidation } from "./validation";

const FILE_NAME = "doc.docx";

function buildState(): RecomendacionState {
  const values = {
    numero_recomendacion: "111/2024",
    fecha_recomendacion: "2024-01-01",
    destinatarios: [
      {
        id: "d1",
        nombre: "Juan Perez",
        cargo: "Director",
        destinatario_principal: true,
        sector: "GCBA",
      },
    ],
    tema: "SALUD",
    subtema: "SAME",
    datos_personales: false,
    contenido_para_publicar: "Contenido",
  };
  return {
    documentId: "doc-1",
    origin: "inference",
    inference: {
      numero_recomendacion: values.numero_recomendacion,
      fecha_recomendacion: values.fecha_recomendacion,
      destinatarios: [],
      tema: values.tema,
      subtema: values.subtema,
      datos_personales: false,
      contenido_para_publicar: values.contenido_para_publicar,
    },
    suggestions: values,
    values,
    candidates: {},
  };
}

function buildFile(): DocFile {
  return {
    data: new File(["x"], FILE_NAME),
    selected: true,
    validationObject: {},
    paragraphs: [
      { id: "p1", value: "Juan Perez Director", document_id: "doc-1" },
    ],
    recomendacion: buildState(),
  };
}

/**
 * Mounts the validation screen over the REAL file reducer, and swaps in the
 * finish screen when the validation screen navigates — the same handoff the
 * router performs in production, but without the router.
 */
function Flow() {
  const [state, dispatch] = useReducer(reducer, [buildFile()]);
  const [step, setStep] = useState<"validation" | "finish">("validation");
  navigate.mockImplementation(() => setStep("finish"));

  return (
    <FileContext.Provider value={state}>
      <FileDispatchContext.Provider value={dispatch}>
        {step === "validation" ? (
          <RecomendacionValidation />
        ) : (
          <RecomendacionFinish onRestart={() => undefined} />
        )}
      </FileDispatchContext.Provider>
    </FileContext.Provider>
  );
}

async function readRow() {
  if (!disk) return null;
  const workbook = new Workbook();
  await workbook.xlsx.load(disk);
  const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
  if (!sheet) return null;
  const header = sheet.getRow(1).values as (string | undefined)[];
  const row = sheet.getRow(2).values as (string | undefined)[];
  const record: Record<string, unknown> = {};
  header.forEach((name, index) => {
    if (typeof name === "string") record[name] = row[index];
  });
  return record;
}

describe("validation -> reducer -> finish -> Excel (C1)", () => {
  beforeEach(() => {
    disk = null;
    navigate.mockReset();
    saveRecomendacion.mockReset();
    // The persistence endpoint does not exist yet, so the save ALWAYS fails in
    // production today. That is precisely why the reducer write-back is the
    // only path that carries corrections to the .xlsx.
    saveRecomendacion.mockRejectedValue(new Error("501 not implemented"));
  });

  it("writes the TYPED value, not the inferred one, into the exported Excel row", async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { mutations: { retry: false } } })
        }
      >
        <Flow />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("validation.numeroRecomendacion"), {
      target: { value: "999/2024 CORREGIDO" },
    });
    fireEvent.change(screen.getByLabelText("validation.nombre"), {
      target: { value: "Juana Corregida" },
    });

    fireEvent.click(screen.getByText("validation.validar"));

    await waitFor(async () => {
      const row = await readRow();
      expect(row).not.toBeNull();
      expect(row?.NUMERO_RECOMENDACION).toBe("999/2024 CORREGIDO");
    });

    const row = await readRow();
    expect(row?.DESTINATARIO_PRINCIPAL_NOMBRE).toBe("Juana Corregida");
    // The inferred values must NOT be what got exported.
    expect(row?.NUMERO_RECOMENDACION).not.toBe("111/2024");
    expect(row?.DESTINATARIO_PRINCIPAL_NOMBRE).not.toBe("Juan Perez");
    expect(row?.DOCUMENT_ID).toBe("doc-1");
  });
});

import FileCheck from "@/components/file-check";
import { Grid } from "@/styled/jsx";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/
 * plan.md, same convention as the other `*-fixture.tsx` files here.
 *
 * `FileCheck` has no router/QueryClient dependency, so a single instance can
 * be mounted directly with no wrapping providers.
 */
interface FileCheckFixtureProps {
  fileName?: string;
  hasError?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
}

export function FileCheckFixture({
  fileName = "documento.docx",
  hasError = false,
  isLoading = false,
  errorMessage,
}: FileCheckFixtureProps = {}) {
  return (
    <div style={{ padding: 24 }}>
      <FileCheck {...{ fileName, hasError, isLoading, errorMessage }} />
    </div>
  );
}

/**
 * Reproduces the REAL grid `FinishMainContent` wraps every `FileCheck` card
 * in (`components/finish/finish-main-content.tsx`: `Grid columns={{base:2,
 * lg:4}} gap="8" justifyContent="center" width="full"`) - not a bare
 * `FileCheck`, because issue 07's fix removes `Wrapper`'s own
 * `maxWidth: "[150px]"`, and the ONLY thing that used to keep each card from
 * stretching to fill its grid cell was that cap. This fixture is what
 * catches a regression the isolated single-card fixture above cannot: the
 * two finish screens (`finish-anonymizer.tsx`, `finish-dataset.tsx`) lay out
 * several of these cards side by side, and `finish-dataset.test.tsx` mocks
 * `../file-check` entirely, so it can never see this.
 */
interface FileCheckGridFixtureProps {
  files?: Array<{
    fileName: string;
    hasError?: boolean;
    errorMessage?: string;
  }>;
}

export function FileCheckGridFixture({
  files = [
    { fileName: "acta_audiencia_2024.docx" },
    {
      fileName: "resolucion_muy_larga_con_nombre_extenso.docx",
      hasError: true,
      errorMessage:
        "Error de guardado: no se pudo escribir el archivo en el disco porque el directorio de destino no tiene permisos suficientes.",
    },
    { fileName: "sentencia.docx" },
    { fileName: "denuncia.docx", hasError: true },
  ],
}: FileCheckGridFixtureProps = {}) {
  return (
    <div style={{ padding: 24 }}>
      <Grid
        columns={{ base: 2, lg: 4 }}
        gap="8"
        justifyContent="center"
        width="full"
      >
        {files.map((file) => (
          <FileCheck key={file.fileName} {...file} />
        ))}
      </Grid>
    </div>
  );
}

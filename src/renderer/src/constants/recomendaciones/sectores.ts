import type { SelectOption } from "@/types/select";

export const SECTOR_OPTIONS = [
  { id: "GCBA", text: "GCBA" },
  { id: "Organismos Nacionales", text: "Organismos Nacionales" },
  { id: "Obra Social / Prepaga", text: "Obra Social / Prepaga" },
  { id: "Empresa", text: "Empresa" },
] as const satisfies SelectOption[];

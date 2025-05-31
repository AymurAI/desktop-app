export type DefaultFormValues<T extends FormStructure> = {
  [K in T["sections"][number]["fields"][number] as K["id"]]: K extends {
    type: "text" | "number";
  }
    ? string
    : K extends { type: "select" }
      ? K["options"][number]["value"] | ""
      : K extends { type: "checkbox" }
        ? Partial<Record<K["fields"][number]["id"], string>>
        : K extends { type: "radio" }
          ? K["fields"][number]["id"] | ""
          : never;
};

interface Field {
  label?: string;
  id: string;
}

interface InputField extends Field {
  type: "text" | "number";
}

interface SelectField extends Field {
  type: "select";
  options: {
    value: string;
    label: string;
  }[];
}

interface CheckboxField extends Field {
  type: "checkbox";
  fields: Field[];
}

interface RadioField extends Field {
  type: "radio";
  fields: Field[];
}

export type GenericFieldType =
  | InputField
  | SelectField
  | CheckboxField
  | RadioField;
export interface Section {
  title?: string;
  fields: GenericFieldType[];
}

export interface FormStructure {
  sections: Section[];
}

export const formStructure = {
  sections: [
    {
      title: "Información general",
      fields: [
        {
          id: "nombre",
          label: "Nombre",
          type: "text",
        },
        {
          id: "numero",
          label: "Número",
          type: "number",
        },
        {
          id: "tipo",
          label: "Selector tipo",
          type: "select",
          options: [
            { value: "opcion_a", label: "Opción A" },
            { value: "opcion_b", label: "Opción B" },
          ],
        },
        {
          id: "checkbox",
          label: "Checkbox",
          type: "checkbox",
          fields: [
            {
              id: "checkbox_a",
              label: "Checkbox A",
            },
            {
              id: "checkbox_b",
              label: "Checkbox B",
            },
          ],
        },
        {
          id: "radio",
          label: "Radio",
          type: "radio",
          fields: [
            {
              id: "radio_a",
              label: "Radio A",
            },
            {
              id: "radio_b",
              label: "Radio B",
            },
          ],
        },
      ],
    },
    {
      title: "Segunda seccion",
      fields: [
        {
          id: "apellido",
          label: "Nombre",
          type: "text",
        },
        {
          id: "documento",
          label: "Documento",
          type: "select",
          options: [
            { value: "DNI", label: "DNI" },
            { value: "PASAPORTE", label: "Pasaporte" },
          ],
        },
      ],
    },
  ],
} as const satisfies FormStructure;

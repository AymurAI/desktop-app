import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { CheckboxGroup, Input, RadioGroup, Select } from "components/design";
import {
  type DefaultFormValues,
  type GenericFieldType,
  formStructure,
} from "./sctructure";

function GenericField({
  field,
  fieldAPI,
}: { field: GenericFieldType; fieldAPI: AnyFieldApi }) {
  switch (field.type) {
    case "text":
      return (
        <Input
          id={field.id}
          name={fieldAPI.name}
          onBlur={fieldAPI.handleBlur}
          onChange={fieldAPI.handleChange}
          value={fieldAPI.state.value}
          type="text"
        />
      );
    case "number":
      return (
        <Input
          id={field.id}
          name={fieldAPI.name}
          onBlur={fieldAPI.handleBlur}
          onChange={fieldAPI.handleChange}
          value={fieldAPI.state.value}
          type="number"
        />
      );
    case "select":
      return (
        <Select
          id={field.id}
          name={fieldAPI.name}
          onBlur={fieldAPI.handleBlur}
          onChange={fieldAPI.handleChange}
          value={fieldAPI.state.value}
          options={field.options}
        />
      );
    case "checkbox":
      return (
        <CheckboxGroup
          name={fieldAPI.name}
          value={fieldAPI.state.value}
          onChange={fieldAPI.handleChange}
          checkboxes={field.fields.map((cbox) => ({
            id: cbox.id,
            value: cbox.id,
            label: cbox.label,
          }))}
        />
      );
    case "radio":
      return (
        <RadioGroup
          name={fieldAPI.name}
          value={fieldAPI.state.value}
          onChange={fieldAPI.handleChange}
          radios={field.fields.map((cbox) => ({
            id: cbox.id,
            value: cbox.id,
            label: cbox.label,
          }))}
        />
      );
    default:
      return <em>No se ha implementado el campo {fieldAPI.name}</em>;
  }
}

export default function Form() {
  const form = useForm({
    defaultValues: {
      nombre: "Luciano",
      numero: "24",
      tipo: "",
      checkbox: {},
      radio: "",
      apellido: "",
      documento: "",
    } satisfies DefaultFormValues<typeof formStructure>,
    onSubmit: ({ value }) => {
      // Do something with form data
      console.log("submit", value);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      {formStructure.sections.map((section) => (
        <div key={section.title}>
          <h2>{section.title}</h2>
          {section.fields.map((field) => (
            <form.Field key={field.id} name={field.id}>
              {(fieldAPI) => <GenericField field={field} fieldAPI={fieldAPI} />}
            </form.Field>
          ))}
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}

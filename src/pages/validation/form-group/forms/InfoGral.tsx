import { Input, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import preds from 'utils/predictions';

export default function InfoGral({
  getSuggestion,
  onSubmit,
  register,
  predictions,
}: FormProps) {
  return (
    <ValidationForm title="Información general" onSubmit={onSubmit}>
      <Input
        ref={register(LabelType.N)}
        {...preds(predictions).getTextSuggestion(LabelType.N)}
        label="Número"
        type="number"
      />
      <Input
        ref={register(LabelType.NRO_REGISTRO)}
        {...preds(predictions).getTextSuggestion(LabelType.NRO_REGISTRO)}
        label="Número de registro"
        type="number"
      />
      <Input
        ref={register(LabelType.TOMO)}
        {...preds(predictions).getTextSuggestion(LabelType.TOMO)}
        label="Tomo"
        type="number"
      />
      <Input
        ref={register(LabelType.FECHA_RESOLUCION)}
        {...preds(predictions).getTextSuggestion(LabelType.FECHA_RESOLUCION)}
        label="Fecha de resolución"
      />
      <Input
        ref={register(LabelType.N_EXPTE_EJE)}
        {...preds(predictions).getTextSuggestion(LabelType.N_EXPTE_EJE)}
        label="Nro de expediente"
        type="number"
      />
      <Input
        ref={register(LabelType.FIRMA)}
        {...preds(predictions).getTextSuggestion(LabelType.FIRMA)}
        label="Firma"
      />
    </ValidationForm>
  );
}

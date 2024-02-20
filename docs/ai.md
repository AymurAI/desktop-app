# AymurAI

En este documento se detallan los endpoints que utiliza el frontend para
comunicarse con la AI.

## Endpoints

### Predictions

- `/anonymizer/predict`: analiza un documento e informa sobre los `strings` que
deben ser _anonimizados_.
- `/datapublic/predict`: analiza un documento e informa sobre la información que
debe ser añadida a la base de datos.

### Documents

- `/docx-to-odt`: convierte un documento `.docx` a `.odt`.
- `/document-extract`: convierte un documento `.doc` en HTML plano (en formato
de `string`).
- `/document-extract/docx2html`: convierte un documento `.docx` en HTML plano,
devolviendo `header`, `footer` y `content`.

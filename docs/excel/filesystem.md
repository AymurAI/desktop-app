# Filesystem (WIP)

## Ubicación

La ubicación del archivo se calcula utilizando:

```ts
const EXPORTS_FOLDER = path.resolve(homedir(), 'Documents/AymurAI');
const FILENAME = 'set_de_datos.xlsx';
const PATH = `${EXPORTS_FOLDER}/${FILENAME}`;
```

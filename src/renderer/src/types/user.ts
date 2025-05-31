export type User = {
  online: false;
  function?: FunctionType;
  token: string;
};

export enum FunctionType {
  DATASET = "DATA_SET",
  ANONYMIZER = "ANONYMIZER",
  NULL = "",
}

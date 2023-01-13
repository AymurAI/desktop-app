import { AllLabels, PredictLabel } from 'types/aymurai';

export type PredictionValue = string | string[];
export type Prediction<T extends any> = Partial<Record<AllLabels, T>>;

export type PropertyCallback<T extends any> = (prediction: PredictLabel) => T;

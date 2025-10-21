import { EvaluationStatus } from './types';

const evaluationColorMap: Record<EvaluationStatus, string> = {
  apto: 'bg-green-500',
  no_apto: 'bg-red-500',
  pendiente: 'bg-gray-500',
};

const evaluationLabelMap: Record<EvaluationStatus, string> = {
  apto: 'Apto',
  no_apto: 'No apto',
  pendiente: 'Pendiente',
};

export const getEvaluationColor = (evaluation: EvaluationStatus | undefined): string => {
  if (!evaluation) {
    return evaluationColorMap.pendiente;
  }

  return evaluationColorMap[evaluation];
};

export const getEvaluationLabel = (evaluation: EvaluationStatus | undefined): string => {
  if (!evaluation) {
    return evaluationLabelMap.pendiente;
  }

  return evaluationLabelMap[evaluation];
};

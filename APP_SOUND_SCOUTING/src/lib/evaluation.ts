import { EvaluationStatus } from './types';

const evaluationColorMap: Record<EvaluationStatus, string> = {
  apto: 'bg-green-500',
  no_apto: 'bg-red-500',
  sin_evaluar: 'bg-gray-500',
};

const evaluationLabelMap: Record<EvaluationStatus, string> = {
  apto: 'Apto',
  no_apto: 'No apto',
  sin_evaluar: 'Sin evaluar',
};

export const getEvaluationColor = (evaluation: EvaluationStatus | undefined): string => {
  if (!evaluation) {
    return evaluationColorMap.sin_evaluar;
  }

  return evaluationColorMap[evaluation];
};

export const getEvaluationLabel = (evaluation: EvaluationStatus | undefined): string => {
  if (!evaluation) {
    return evaluationLabelMap.sin_evaluar;
  }

  return evaluationLabelMap[evaluation];
};

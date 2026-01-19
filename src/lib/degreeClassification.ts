/**
 * Calculates UK degree classification based on weighted average mark
 * UK Academic Standards:
 * - First Class Honours: 70%+
 * - Upper Second Class Honours (2:1): 60-69%
 * - Lower Second Class Honours (2:2): 50-59%
 * - Third Class Honours: 40-49%
 * - Fail: <40%
 */
export function calculateDegreeClassification(
  marks: Array<{ mark: number; credits: number }>
): {
  averageMark: number;
  classification: string;
  classificationFull: string;
} {
  if (marks.length === 0) {
    return {
      averageMark: 0,
      classification: 'N/A',
      classificationFull: 'No marks available',
    };
  }

  // Calculate weighted average
  let totalWeightedMarks = 0;
  let totalCredits = 0;

  marks.forEach(({ mark, credits }) => {
    totalWeightedMarks += mark * credits;
    totalCredits += credits;
  });

  const averageMark = totalCredits > 0 ? totalWeightedMarks / totalCredits : 0;

  // Determine classification
  let classification = '';
  let classificationFull = '';

  if (averageMark >= 70) {
    classification = '1st';
    classificationFull = 'First Class Honours';
  } else if (averageMark >= 60) {
    classification = '2:1';
    classificationFull = 'Upper Second Class Honours';
  } else if (averageMark >= 50) {
    classification = '2:2';
    classificationFull = 'Lower Second Class Honours';
  } else if (averageMark >= 40) {
    classification = '3rd';
    classificationFull = 'Third Class Honours';
  } else {
    classification = 'Fail';
    classificationFull = 'Fail';
  }

  return {
    averageMark: Math.round(averageMark * 100) / 100,
    classification,
    classificationFull,
  };
}

/**
 * Gets the color for a degree classification badge
 */
export function getClassificationColor(
  classification: string
): 'gold' | 'blue' | 'silver' | 'bronze' | 'red' | 'gray' {
  switch (classification) {
    case '1st':
      return 'gold';
    case '2:1':
      return 'blue';
    case '2:2':
      return 'silver';
    case '3rd':
      return 'bronze';
    case 'Fail':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Validates that all modules have marks assigned
 */
export function validateAllMarksAssigned(
  modules: Array<{ id: string }>,
  marks: Array<{ moduleId: string; mark: number }>
): {
  isValid: boolean;
  missingModules: string[];
} {
  const markedModuleIds = new Set(marks.map((m) => m.moduleId));
  const missingModules = modules
    .filter((m) => !markedModuleIds.has(m.id))
    .map((m) => m.id);

  return {
    isValid: missingModules.length === 0,
    missingModules,
  };
}

/**
 * Validates total credits match program requirement
 */
export function validateTotalCredits(
  marks: Array<{ credits: number }>,
  requiredCredits: number
): {
  isValid: boolean;
  totalCredits: number;
  difference: number;
} {
  const totalCredits = marks.reduce((sum, m) => sum + m.credits, 0);
  const difference = requiredCredits - totalCredits;

  return {
    isValid: difference === 0,
    totalCredits,
    difference,
  };
}

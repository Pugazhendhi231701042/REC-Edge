// Curriculum Credit Calculation & Subject Code Generation Rules

export interface CreditResult {
  valid: boolean;
  credits: number;
  warning?: string;
}

/**
 * Calculates academic credits based on Regulation LTP formula:
 * Credits = (L * 1) + (T * 1) + (P * 0.5)
 * Disallows decimal whole number violations (e.g., 1.5).
 */
export function calculateCredits(L: number, T: number, P: number): CreditResult {
  const lVal = Number(L) || 0;
  const tVal = Number(T) || 0;
  const pVal = Number(P) || 0;

  if (lVal < 0 || tVal < 0 || pVal < 0) {
    return {
      valid: false,
      credits: 0,
      warning: 'L, T, and P values cannot be negative numbers.',
    };
  }

  const rawCredits = lVal * 1 + tVal * 1 + pVal * 0.5;

  if (!Number.isInteger(rawCredits)) {
    return {
      valid: false,
      credits: rawCredits,
      warning: `⚠ Invalid LTPC combination: The calculated credit value is ${rawCredits}. Credits must be a whole number. Please adjust L, T, or P.`,
    };
  }

  return {
    valid: true,
    credits: rawCredits,
  };
}

/**
 * Generates Subject Code format:
 * Department Code + Regulation + Semester + Subject Type Code + Sequence Number
 * Example: CS + 26 + 4 + 2 + 1 => CS26421
 */
export function formatSubjectCode(
  deptCode: string,
  regCode: string,
  semester: number,
  typeCode: number,
  sequenceNumber: number
): string {
  const dCode = (deptCode || 'XX').trim().toUpperCase();
  const rCode = (regCode || '26').trim();
  const sem = semester || 1;
  const tCode = typeCode || 1;
  const seq = sequenceNumber || 1;

  return `${dCode}${rCode}${sem}${tCode}${seq}`;
}

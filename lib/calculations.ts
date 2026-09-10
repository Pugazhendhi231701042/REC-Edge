// Curriculum Credit Calculation & Subject Code Generation Rules

export interface CreditResult {
  valid: boolean;
  credits: number;
  warning?: string;
}

/**
 * Calculates academic credits based on configuration.
 * Method A (SUM / DIRECT): C = L + T + P
 * Method B (WEIGHTED): C = L*wL + T*wT + P*wP
 */
export function calculateCredits(
  L: number,
  T: number,
  P: number,
  lWeight = 1.0,
  tWeight = 1.0,
  pWeight = 0.5,
  calculationMethod = 'WEIGHTED'
): CreditResult {
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

  const isDirectSum = calculationMethod === 'SUM' || calculationMethod === 'DIRECT' || calculationMethod === 'METHOD_A';
  const rawCredits = isDirectSum
    ? lVal + tVal + pVal
    : lVal * lWeight + tVal * tWeight + pVal * pWeight;

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
 * Prefix/Dept Code + Regulation + Semester/Vertical Letter + Subject Type Code + Sequence Number
 * Example Professional Core: CS + 27 + 4 + 2 + 1 => CS27421
 * Example Elective: CD + 27 + E + 3 + 1 => CD27E31
 */
export function formatSubjectCode(
  deptCode: string,
  regCode: string,
  semOrVerticalStr: number | string,
  typeCode: number,
  sequenceNumber: number
): string {
  const dCode = (deptCode || 'XX').trim().toUpperCase();
  const rCode = (regCode || '27').trim();
  let semOrVert = '1';
  if (typeof semOrVerticalStr === 'string' && semOrVerticalStr.trim().length > 0) {
    const str = semOrVerticalStr.trim();
    if (str.toUpperCase().startsWith('VERTICAL ')) {
      semOrVert = str.split(' ')[1].toUpperCase();
    } else {
      semOrVert = str.toUpperCase();
    }
  } else if (semOrVerticalStr !== undefined && semOrVerticalStr !== null) {
    semOrVert = String(semOrVerticalStr).trim();
  }
  const tCode = typeCode || 1;
  const seq = sequenceNumber || 1;

  return `${dCode}${rCode}${semOrVert}${tCode}${seq}`;
}

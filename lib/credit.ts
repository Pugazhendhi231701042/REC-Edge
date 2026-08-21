export function calculateCredits(
  lecture: number,
  tutorial: number,
  practical: number,
  config?: { calculationMethod?: string; lWeight?: number; tWeight?: number; pWeight?: number }
): number {
  const method = config?.calculationMethod || 'SUM';
  const l = Number(lecture) || 0;
  const t = Number(tutorial) || 0;
  const p = Number(practical) || 0;

  if (method === 'SUM') {
    return l + t + p;
  } else {
    const lw = config?.lWeight ?? 1.0;
    const tw = config?.tWeight ?? 1.0;
    const pw = config?.pWeight ?? 0.5;
    return Number((l * lw + t * tw + p * pw).toFixed(1));
  }
}

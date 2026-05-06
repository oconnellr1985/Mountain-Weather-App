export function buildAlertText(climb: any, best: any, source: string) {
  return [
    `${climb.name}: possible weather window`,
    `Best window: ${best.label}`,
    `Quality: ${best.quality.toFixed(1)}/10`,
    `Confidence: ${best.confidence.toFixed(1)}/10`,
    `Lead: ${best.leadDays} day(s)`,
    `Source: ${source}`,
    `Manual review required before making any mountain decision.`
  ].join("\n");
}

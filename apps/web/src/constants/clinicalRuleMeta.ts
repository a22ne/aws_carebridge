/**
 * Display metadata for clinical rules.
 *
 * The rule engine lives in the backend and returns rule IDs plus Chinese
 * titles from clinical-rules.json. The IDs are the stable contract, so the UI
 * translates them via `rule_<id>` i18n keys and uses this list to know which
 * ones are emergency-level (the backend's `escalationWarnings` are pre-filtered
 * but only available in Chinese).
 *
 * Keep in sync with services/api/src/rules/clinical-rules.json.
 */

export const EMERGENCY_RULE_IDS = [
  'RF-001', // unresponsive
  'RF-002', // consciousness change
  'RF-003', // severe dyspnea
  'RF-004', // cyanosis
  'RF-005', // persistent chest pain
  'RF-006', // stroke FAST signs
  'RF-007', // major bleeding
  'RF-008', // fall with loss of consciousness
  'RF-009', // seizure
] as const;

export function isEmergencyRule(ruleId: string): boolean {
  return (EMERGENCY_RULE_IDS as readonly string[]).includes(ruleId);
}

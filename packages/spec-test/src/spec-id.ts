// Single source of truth for the requirement-id grammar, e.g. ARM-SUBMIT-004.
// schema.ts validates bare ids in spec YAML; the runners and the ESLint rule
// parse the "[ID] title" prefix that specTest() prepends to test titles.
export const SPEC_ID_SOURCE = "[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)+-\\d{3,}";

/** Matches a bare requirement id (whole string), e.g. "ARM-SUBMIT-004". */
export const BARE_SPEC_ID_RE = new RegExp(`^${SPEC_ID_SOURCE}$`);

/** Matches a test title prefixed with a requirement id, capturing the id. */
export const TITLE_SPEC_ID_RE = new RegExp(`^\\[(${SPEC_ID_SOURCE})\\]`);

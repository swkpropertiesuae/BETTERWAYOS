/**
 * UAE PDPL Decree-Law 45/2021 PII Shield:
 * Automatically strips Emirates IDs, IBANs, UAE/international phone numbers, emails & passport refs
 * before any text leaves Betterway's Supabase boundary to an external LLM API.
 */
export function scrubPiiForLlm(input: string): { sanitized: string; redactions: number } {
  let text = String(input || '');
  let redactions = 0;

  const replacePattern = (regex: RegExp, token: string) => {
    text = text.replace(regex, () => {
      redactions += 1;
      return token;
    });
  };

  // UAE Emirates ID (784-YYYY-NNNNNNN-N or 15 digits starting with 784)
  replacePattern(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, '[REDACTED_EID]');
  // UAE & International IBANs
  replacePattern(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,26}\b/g, '[REDACTED_IBAN]');
  // Email addresses
  replacePattern(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]');
  // UAE & International phone numbers
  replacePattern(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b/g, '[REDACTED_PHONE]');
  // Passport numbers prefixed by label
  text = text.replace(/\b(passport(?:\s*(?:no|number|#))?[:\s]+)([A-Z0-9]{6,12})\b/gi, (_m: string, p1: string) => {
    redactions += 1;
    return `${p1}[REDACTED_PASSPORT]`;
  });

  return { sanitized: text, redactions };
}

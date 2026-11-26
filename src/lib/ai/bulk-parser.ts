export interface ParsedBulkLead {
  contactName: string;
  contactPhone: string;
  normalizedPhone: string;
  contactEmail: string;
  community: string;
  projectName: string;
  propertyPriceAed: number;
  notes: string;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00971')) return `+971${digits.slice(5)}`;
  if (digits.startsWith('971')) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+971${digits.slice(1)}`;
  return raw.trim();
}

export function parseBulkLeadText(rawText: string, existingPhones: string[] = []): {
  items: ParsedBulkLead[];
  duplicatesSkipped: number;
  skippedLines: number;
} {
  const seen = new Set(existingPhones.map((p) => normalizePhone(p).replace(/\D/g, '')));
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedBulkLead[] = [];
  let duplicatesSkipped = 0;
  let skippedLines = 0;

  for (const line of lines) {
    // Skip obvious CSV headers
    if (/^(name|client|borrower|contact)\b/i.test(line) && /phone|mobile/i.test(line)) continue;

    const parts = line
      .split(/[,\t|;]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const phoneMatch = line.match(/(?:\+?\d[\d\s\-()]{7,18}\d)/);
    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const numParts = parts.filter((p) => /^(?:AED\s*)?[\d,.]+(?:[mMkK])?$/i.test(p));

    if (!phoneMatch && parts.length < 2) {
      skippedLines += 1;
      continue;
    }

    const rawPhone = phoneMatch ? phoneMatch[0].trim() : parts[1] || '';
    const norm = normalizePhone(rawPhone);
    const digitsKey = norm.replace(/\D/g, '');

    if (digitsKey.length >= 7 && seen.has(digitsKey)) {
      duplicatesSkipped += 1;
      continue;
    }
    if (digitsKey.length >= 7) seen.add(digitsKey);

    // Parse price (handle 4.8M, 4800000, 3,450,000)
    let price = 2_500_000;
    const priceToken = numParts.find((n) => {
      const clean = n.replace(/AED|\s|,/gi, '');
      if (/[mM]$/.test(clean)) return true;
      const v = Number(clean);
      return Number.isFinite(v) && v >= 200_000;
    });
    if (priceToken) {
      const clean = priceToken.replace(/AED|\s|,/gi, '');
      if (/[mM]$/.test(clean)) price = Math.round(Number(clean.slice(0, -1)) * 1_000_000);
      else if (/[kK]$/.test(clean)) price = Math.round(Number(clean.slice(0, -1)) * 1_000);
      else price = Math.round(Number(clean));
    }

    const textTokens = parts.filter(
      (p) =>
        p !== rawPhone &&
        (!emailMatch || !p.includes(emailMatch[0])) &&
        p !== priceToken &&
        !p.replace(/\D/g, '').startsWith(digitsKey.slice(0, 7)),
    );

    const contactName = textTokens[0] || parts[0] || 'Unnamed Enquiry';
    const community = textTokens[1] || 'Dubai';
    const projectName = textTokens[2] || '';

    items.push({
      contactName: contactName.slice(0, 120),
      contactPhone: norm,
      normalizedPhone: norm,
      contactEmail: emailMatch ? emailMatch[0].toLowerCase() : '',
      community: community.slice(0, 120),
      projectName: projectName.slice(0, 140),
      propertyPriceAed: price,
      notes: line.slice(0, 400),
    });
  }

  return { items, duplicatesSkipped, skippedLines };
}

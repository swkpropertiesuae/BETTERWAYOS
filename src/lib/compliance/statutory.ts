import { FORBIDDEN_PAYMENT_TERMS } from '@/lib/domain/workflow';

export function validateCorporateAccountChannel(input: {
  payeeAccountType: string;
  destinationIban: string;
  channelNote?: string;
  ornVerified?: boolean;
  bankLetterVerified?: boolean;
}): true {
  const combined = `${input.payeeAccountType} ${input.channelNote || ''}`.toLowerCase();
  if (input.payeeAccountType.toUpperCase() !== 'CORPORATE') {
    throw new Error('CORPORATE_ACCOUNT_REQUIRED: Personal or individual bank accounts are strictly prohibited.');
  }
  for (const term of FORBIDDEN_PAYMENT_TERMS) {
    if (combined.includes(term)) {
      throw new Error(`CORPORATE_ACCOUNT_REQUIRED: Forbidden payment channel detected ("${term}").`);
    }
  }
  const iban = input.destinationIban.replace(/\s+/g, '').toUpperCase();
  if (!/^AE\d{21}$/.test(iban)) {
    throw new Error('CORPORATE_ACCOUNT_REQUIRED: Valid 23-character UAE corporate IBAN (AE + 21 digits) is required.');
  }
  if (!input.ornVerified || !input.bankLetterVerified) {
    throw new Error(
      'CORPORATE_ACCOUNT_REQUIRED: Outgoing commission payouts require verified ORN brokerage status and uploaded corporate bank letter.',
    );
  }
  return true;
}

function xmlEsc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generatePintAeXml(inv: {
  invoiceNo: string;
  issueDate: string;
  sellerName: string;
  sellerTrn: string;
  buyerName: string;
  subtotalAed: number;
  vatAmountAed: number;
  totalAed: number;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:peppol:pint:billing-1@ae-1</cbc:CustomizationID>
  <cbc:ProfileID>urn:peppol:bis:billing</cbc:ProfileID>
  <cbc:ID>${xmlEsc(inv.invoiceNo)}</cbc:ID>
  <cbc:IssueDate>${xmlEsc(inv.issueDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>AED</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PartyLegalEntity><cbc:RegistrationName>${xmlEsc(inv.sellerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
    <cac:PartyTaxScheme><cbc:CompanyID>${xmlEsc(inv.sellerTrn)}</cbc:CompanyID></cac:PartyTaxScheme>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party>
    <cac:PartyLegalEntity><cbc:RegistrationName>${xmlEsc(inv.buyerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
  </cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="AED">${inv.vatAmountAed.toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="AED">${inv.subtotalAed.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="AED">${inv.totalAed.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="AED">${inv.totalAed.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}

export function generateGoAmlXml(rep: { reportId: string; subjectName: string; reason: string }): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<report>
  <rentity_id>BETTERWAY-MORTGAGES-LLC-AE</rentity_id>
  <submission_code>E</submission_code>
  <report_code>STR</report_code>
  <entity_reference>${xmlEsc(rep.reportId)}</entity_reference>
  <submission_date>${new Date().toISOString()}</submission_date>
  <currency_code_local>AED</currency_code_local>
  <reason>${xmlEsc(rep.reason)}</reason>
  <subject><name>${xmlEsc(rep.subjectName)}</name></subject>
</report>`;
}

export function generateMohreWpsSif(
  molEmployerId: string,
  periodYm: string,
  employees: Array<{ molId: string; routingCode: string; iban: string; fixedAed: number; variableAed: number }>,
): string {
  const [y, m] = periodYm.split('-');
  const start = `${y}-${m}-01`;
  const end = `${y}-${m}-28`;
  const edrLines = employees.map(
    (e) => `EDR,${e.molId},${e.routingCode},${e.iban},${start},${end},30,${e.fixedAed.toFixed(2)},${e.variableAed.toFixed(2)},0`,
  );
  const totalSalary = employees.reduce((s, e) => s + e.fixedAed + e.variableAed, 0);
  const scr = `SCR,${molEmployerId},026100101,${new Date().toISOString().slice(0, 10)},1200,${m}${y},${employees.length},${totalSalary.toFixed(2)},AED,Betterway Mortgages LLC`;
  return [...edrLines, scr].join('\n');
}

export function calculateUaeEosbGratuity(basicSalaryAed: number, yearsOfService: number): number {
  if (basicSalaryAed <= 0 || yearsOfService < 1) return 0;
  const dailyWage = basicSalaryAed / 30;
  const first5 = Math.min(yearsOfService, 5) * 21 * dailyWage;
  const after5 = Math.max(0, yearsOfService - 5) * 30 * dailyWage;
  return Math.round(Math.min(basicSalaryAed * 24, first5 + after5));
}

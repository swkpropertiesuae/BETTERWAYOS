// Official 24-Bank UAE Mortgage Panel + Live CBUAE EIBOR Snapshot (from BETTERWAYMORTGAGES repo)

export interface UaeBank {
  id: string;
  key: string;
  slug: string;
  name: string;
  short: string;
  nameAr: string;
  logo: string;
  type: 'Islamic' | 'Conventional' | 'Dual';
  hq: string;
  slaDays: number;
  dsaRatePct: number;
  indicativeFixed3Y: number;
  revertMarginOver3m: number;
  floorPct: number;
  salaryTransferRequired: boolean;
  nonResidentSupported: boolean;
  lowDocSupported: boolean;
  handoverSupported: boolean;
  maxLtvResident: number;
  processingFeePct: number;
  note: string;
  verifiedDate: string;
}

export const UAE_BANKS: UaeBank[] = [
  {
    id: 'BNK-ENBD', key: 'emirates-nbd', slug: 'emirates-nbd-mortgage', name: 'Emirates NBD', short: 'ENBD',
    nameAr: 'بنك الإمارات دبي الوطني', logo: '/banks/emirates-nbd.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 3, dsaRatePct: 0.85, indicativeFixed3Y: 3.89, revertMarginOver3m: 1.75, floorPct: 3.89,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Dubai flagship lender — residential, handover SOA financing, private client & Emaar/Nakheel APL depth.',
  },
  {
    id: 'BNK-FAB', key: 'fab', slug: 'first-abu-dhabi-bank-fab-mortgage', name: 'First Abu Dhabi Bank', short: 'FAB',
    nameAr: 'بنك أبوظبي الأول', logo: '/banks/fab.svg', type: 'Conventional', hq: 'Abu Dhabi',
    slaDays: 4, dsaRatePct: 0.80, indicativeFixed3Y: 3.94, revertMarginOver3m: 1.69, floorPct: 3.94,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 85, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'UAE largest bank by assets — strong UAE National 85% LTV, Abu Dhabi ADREC & HNW Dubai villas.',
  },
  {
    id: 'BNK-DIB', key: 'dib', slug: 'dubai-islamic-bank-dib-mortgage', name: 'Dubai Islamic Bank', short: 'DIB',
    nameAr: 'بنك دبي الإسلامي', logo: '/banks/dib.png', type: 'Islamic', hq: 'Dubai',
    slaDays: 3, dsaRatePct: 0.85, indicativeFixed3Y: 3.95, revertMarginOver3m: 1.85, floorPct: 3.95,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Sharia-compliant Ijara home finance leader across Dubai ready, buyout, and developer handover units.',
  },
  {
    id: 'BNK-ADCB', key: 'adcb', slug: 'adcb-mortgage', name: 'ADCB', short: 'ADCB',
    nameAr: 'بنك أبوظبي التجاري', logo: '/banks/adcb.svg', type: 'Conventional', hq: 'Abu Dhabi',
    slaDays: 3, dsaRatePct: 0.80, indicativeFixed3Y: 3.99, revertMarginOver3m: 1.75, floorPct: 3.99,
    salaryTransferRequired: true, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 85, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Competitive salary-transfer fixed tiers and fast digital valuation panel across Dubai & Abu Dhabi.',
  },
  {
    id: 'BNK-ADIB', key: 'adib', slug: 'abu-dhabi-islamic-bank-adib-mortgage', name: 'Abu Dhabi Islamic Bank', short: 'ADIB',
    nameAr: 'مصرف أبوظبي الإسلامي', logo: '/banks/adib.svg', type: 'Islamic', hq: 'Abu Dhabi',
    slaDays: 4, dsaRatePct: 0.80, indicativeFixed3Y: 3.99, revertMarginOver3m: 1.89, floorPct: 3.99,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 85, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Premier Sharia-compliant home finance for ready villas, Emirati housing top-ups, and approved off-plan.',
  },
  {
    id: 'BNK-EI', key: 'emirates-islamic', slug: 'emirates-islamic-bank-mortgage', name: 'Emirates Islamic', short: 'EI',
    nameAr: 'الإمارات الإسلامي', logo: '/banks/emirates-islamic.png', type: 'Islamic', hq: 'Dubai',
    slaDays: 3, dsaRatePct: 0.85, indicativeFixed3Y: 3.92, revertMarginOver3m: 1.80, floorPct: 3.92,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'ENBD Group Islamic arm — swift pre-approvals for Murabaha/Ijara ready & handover mortgages.',
  },
  {
    id: 'BNK-HSBC', key: 'hsbc', slug: 'hsbc-uae-mortgage', name: 'HSBC UAE', short: 'HSBC',
    nameAr: 'إتش إس بي سي الإمارات', logo: '/banks/hsbc.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 4, dsaRatePct: 0.75, indicativeFixed3Y: 3.84, revertMarginOver3m: 1.65, floorPct: 3.84,
    salaryTransferRequired: true, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.0, verifiedDate: '2026-11-23',
    note: 'Global Premier wealth lender — zero-fee promo windows and cross-border expat credit continuity.',
  },
  {
    id: 'BNK-MASHREQ', key: 'mashreq', slug: 'mashreq-bank-mortgage', name: 'Mashreq Bank', short: 'Mashreq',
    nameAr: 'بنك المشرق', logo: '/banks/mashreq.png', type: 'Dual', hq: 'Dubai',
    slaDays: 2, dsaRatePct: 0.90, indicativeFixed3Y: 3.95, revertMarginOver3m: 1.90, floorPct: 3.95,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Fastest digital DIP turnaround (24–48h) with flexible non-resident and self-employed credit review.',
  },
  {
    id: 'BNK-CBD', key: 'cbd', slug: 'commercial-bank-of-dubai-cbd-mortgage', name: 'Commercial Bank of Dubai', short: 'CBD',
    nameAr: 'بنك دبي التجاري', logo: '/banks/cbd.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 3, dsaRatePct: 0.90, indicativeFixed3Y: 3.99, revertMarginOver3m: 1.85, floorPct: 3.99,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Strong business-owner, SME shareholder, and overseas investor underwriting appetite in Dubai.',
  },
  {
    id: 'BNK-RAK', key: 'rakbank', slug: 'rakbank-mortgage', name: 'RAKBANK', short: 'RAKBANK',
    nameAr: 'بنك رأس الخيمة الوطني', logo: '/banks/rakbank.svg', type: 'Dual', hq: 'Ras Al Khaimah',
    slaDays: 3, dsaRatePct: 0.95, indicativeFixed3Y: 4.15, revertMarginOver3m: 2.05, floorPct: 4.15,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'High appetite for self-employed, Low-Doc personal-statement applicants, and Al Marjan Island RAK stock.',
  },
  {
    id: 'BNK-SC', key: 'standard-chartered', slug: 'standard-chartered-uae-mortgage', name: 'Standard Chartered UAE', short: 'SC',
    nameAr: 'ستاندرد تشارترد الإمارات', logo: '/banks/standard-chartered.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 5, dsaRatePct: 0.75, indicativeFixed3Y: 3.89, revertMarginOver3m: 1.70, floorPct: 3.89,
    salaryTransferRequired: true, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Priority-banking mortgage desk for multinational executives and AED 5M+ luxury villas.',
  },
  {
    id: 'BNK-SIB', key: 'sib', slug: 'sharjah-islamic-bank-mortgage', name: 'Sharjah Islamic Bank', short: 'SIB',
    nameAr: 'مصرف الشارقة الإسلامي', logo: '/banks/sib.png', type: 'Islamic', hq: 'Sharjah',
    slaDays: 4, dsaRatePct: 0.80, indicativeFixed3Y: 4.05, revertMarginOver3m: 1.95, floorPct: 4.05,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Northern Emirates & Sharjah Aljada/Masaar Islamic Ijara specialist with competitive buyout pricing.',
  },
  {
    id: 'BNK-UAB', key: 'uab', slug: 'united-arab-bank-mortgage', name: 'United Arab Bank', short: 'UAB',
    nameAr: 'البنك العربي المتحد', logo: '/banks/uab.svg', type: 'Conventional', hq: 'Sharjah',
    slaDays: 4, dsaRatePct: 0.85, indicativeFixed3Y: 4.19, revertMarginOver3m: 2.00, floorPct: 4.19,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Commercial residential desk covering Sharjah & Dubai ready freehold apartments and townhouses.',
  },
  {
    id: 'BNK-AJMAN', key: 'ajman', slug: 'ajman-bank-mortgage', name: 'Ajman Bank', short: 'Ajman',
    nameAr: 'مصرف عجمان', logo: '/banks/ajman.png', type: 'Islamic', hq: 'Ajman',
    slaDays: 4, dsaRatePct: 0.90, indicativeFixed3Y: 4.10, revertMarginOver3m: 1.95, floorPct: 4.10,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Agile Islamic desk with strong appetite for buyout+equity and mid-market Dubai communities.',
  },
  {
    id: 'BNK-NBF', key: 'nbf', slug: 'national-bank-of-fujairah-nbf-mortgage', name: 'National Bank of Fujairah', short: 'NBF',
    nameAr: 'بنك الفجيرة الوطني', logo: '/banks/nbf.png', type: 'Conventional', hq: 'Fujairah',
    slaDays: 5, dsaRatePct: 0.80, indicativeFixed3Y: 4.15, revertMarginOver3m: 1.95, floorPct: 4.15,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Corporate relationship bank with strong SME owner mortgage desk.',
  },
  {
    id: 'BNK-ARAB', key: 'arab-bank', slug: 'arab-bank-uae-mortgage', name: 'Arab Bank UAE', short: 'Arab Bank',
    nameAr: 'البنك العربي', logo: '/banks/arab-bank.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 5, dsaRatePct: 0.75, indicativeFixed3Y: 4.09, revertMarginOver3m: 1.90, floorPct: 4.09,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'MENA cross-border banking network ideal for Levant/GCC buyers investing in Dubai freehold.',
  },
  {
    id: 'BNK-RAKISL', key: 'rakislamic', slug: 'rakislamic-mortgage', name: 'RAKislamic', short: 'RAKislamic',
    nameAr: 'راك الإسلامي', logo: '/banks/rakislamic.svg', type: 'Islamic', hq: 'Ras Al Khaimah',
    slaDays: 3, dsaRatePct: 0.95, indicativeFixed3Y: 4.15, revertMarginOver3m: 2.05, floorPct: 4.15,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Sharia-compliant arm of RAKBANK offering flexible self-employed & equity-release Ijara.',
  },
  {
    id: 'BNK-ALHILAL', key: 'al-hilal', slug: 'al-hilal-bank-mortgage', name: 'Al Hilal Bank', short: 'Al Hilal',
    nameAr: 'مصرف الهلال', logo: '/banks/al-hilal.png', type: 'Islamic', hq: 'Abu Dhabi',
    slaDays: 4, dsaRatePct: 0.80, indicativeFixed3Y: 3.99, revertMarginOver3m: 1.80, floorPct: 3.99,
    salaryTransferRequired: true, nonResidentSupported: false, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 85, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'ADCB Group Islamic retail bank specializing in UAE National & resident Sharia mortgages.',
  },
  {
    id: 'BNK-NBQ', key: 'nbq', slug: 'nbq-umm-al-qaiwain-mortgage', name: 'National Bank of Umm Al Qaiwain', short: 'NBQ',
    nameAr: 'بنك أم القيوين الوطني', logo: '/banks/nbq.svg', type: 'Conventional', hq: 'Umm Al Quwain',
    slaDays: 5, dsaRatePct: 0.85, indicativeFixed3Y: 4.25, revertMarginOver3m: 2.10, floorPct: 4.25,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: false,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Northern Emirates & Dubai commercial residential financing for ready Title Deed properties.',
  },
  {
    id: 'BNK-CITI', key: 'citi', slug: 'citibank-uae-mortgage', name: 'Citibank UAE', short: 'Citi',
    nameAr: 'سيتي بنك الإمارات', logo: '/banks/citi.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 5, dsaRatePct: 0.70, indicativeFixed3Y: 3.95, revertMarginOver3m: 1.75, floorPct: 3.95,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: false, handoverSupported: false,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Citigold relationship home financing & low-friction refinancing for international executives.',
  },
  {
    id: 'BNK-BOB', key: 'bank-of-baroda', slug: 'bank-of-baroda-uae-mortgage', name: 'Bank of Baroda UAE', short: 'BoB',
    nameAr: 'بنك بارودا', logo: '/banks/bank-of-baroda.svg', type: 'Conventional', hq: 'Dubai',
    slaDays: 5, dsaRatePct: 0.80, indicativeFixed3Y: 4.19, revertMarginOver3m: 2.00, floorPct: 4.19,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: false, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Strong NRI & Indian expatriate corridor mortgage desk across Dubai & Sharjah.',
  },
  {
    id: 'BNK-INVEST', key: 'invest-bank', slug: 'invest-bank-mortgage', name: 'Invest Bank', short: 'Invest Bank',
    nameAr: 'بنك الاستثمار', logo: '/banks/invest-bank.png', type: 'Conventional', hq: 'Sharjah',
    slaDays: 5, dsaRatePct: 0.85, indicativeFixed3Y: 4.29, revertMarginOver3m: 2.15, floorPct: 4.29,
    salaryTransferRequired: false, nonResidentSupported: false, lowDocSupported: false, handoverSupported: false,
    maxLtvResident: 75, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Sharjah-headquartered commercial bank servicing ready residential portfolios.',
  },
  {
    id: 'BNK-CBI', key: 'cbi', slug: 'cbi-commercial-bank-international-mortgage', name: 'Commercial Bank International', short: 'CBI',
    nameAr: 'البنك التجاري الدولي', logo: '/banks/cbi.png', type: 'Conventional', hq: 'Dubai',
    slaDays: 4, dsaRatePct: 0.90, indicativeFixed3Y: 4.12, revertMarginOver3m: 1.95, floorPct: 4.12,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 80, processingFeePct: 0.5, verifiedDate: '2026-11-23',
    note: 'Flexible buyout, equity release, and international buyer mortgage programs in Dubai.',
  },
  {
    id: 'BNK-AMLAK', key: 'amlak', slug: 'amlak-finance-mortgage', name: 'Amlak Finance', short: 'Amlak',
    nameAr: 'أملاك للتمويل', logo: '/banks/amlak.svg', type: 'Islamic', hq: 'Dubai',
    slaDays: 4, dsaRatePct: 0.95, indicativeFixed3Y: 4.35, revertMarginOver3m: 2.25, floorPct: 4.35,
    salaryTransferRequired: false, nonResidentSupported: true, lowDocSupported: true, handoverSupported: true,
    maxLtvResident: 75, processingFeePct: 1.0, verifiedDate: '2026-11-23',
    note: 'Specialist Dubai Islamic property financier for edge-case DBR, non-standard buildings & handover.',
  },
];

export const EIBOR_SNAPSHOT = {
  source: 'https://centralbank.ae/en/forex-eibor/eibor-rates/',
  asOfDate: '2026-11-06',
  valueDate: '2026-11-10',
  latest: {
    overnight: 3.66539,
    oneMonth: 4.1425,
    threeMonth: 4.20677,
    sixMonth: 4.68714,
    oneYear: 4.80361,
  },
  history: [
    { date: '2026-08-07', overnight: 3.581, oneMonth: 3.779, threeMonth: 3.873, sixMonth: 4.005, oneYear: 4.259 },
    { date: '2026-08-17', overnight: 3.632, oneMonth: 3.747, threeMonth: 3.957, sixMonth: 4.063, oneYear: 4.148 },
    { date: '2026-08-27', overnight: 3.408, oneMonth: 3.741, threeMonth: 3.865, sixMonth: 4.020, oneYear: 4.471 },
    { date: '2026-09-08', overnight: 3.512, oneMonth: 3.810, threeMonth: 3.940, sixMonth: 4.150, oneYear: 4.490 },
    { date: '2026-09-18', overnight: 3.550, oneMonth: 3.880, threeMonth: 4.010, sixMonth: 4.290, oneYear: 4.560 },
    { date: '2026-09-30', overnight: 3.595, oneMonth: 3.945, threeMonth: 4.065, sixMonth: 4.380, oneYear: 4.620 },
    { date: '2026-10-12', overnight: 3.610, oneMonth: 4.012, threeMonth: 4.115, sixMonth: 4.495, oneYear: 4.695 },
    { date: '2026-10-24', overnight: 3.640, oneMonth: 4.088, threeMonth: 4.168, sixMonth: 4.590, oneYear: 4.748 },
    { date: '2026-11-06', overnight: 3.665, oneMonth: 4.143, threeMonth: 4.207, sixMonth: 4.687, oneYear: 4.804 },
  ],
};

export interface DeveloperAplProject {
  id: string;
  developer: string;
  project: string;
  emirate: string;
  stage: 'Ready' | 'Handover Q4 2026' | 'Handover 2027' | 'Off-Plan';
  image: string;
  developerLogo?: string;
  approvedBanks: string[];
  maxLtv: number;
  typicalYieldPct: number;
}

export const DEVELOPER_APL_PROJECTS: DeveloperAplProject[] = [
  {
    id: 'APL-01', developer: 'Emaar Properties', project: 'The Oasis by Emaar', emirate: 'Dubai',
    stage: 'Handover 2027', image: '/projects/the-oasis.webp', developerLogo: '/projects/emaar.svg',
    approvedBanks: ['ENBD', 'FAB', 'DIB', 'ADCB', 'ADIB', 'HSBC', 'Mashreq', 'EI'], maxLtv: 80, typicalYieldPct: 6.2,
  },
  {
    id: 'APL-02', developer: 'DAMAC Properties', project: 'DAMAC Islands & Lagoons', emirate: 'Dubai',
    stage: 'Handover Q4 2026', image: '/projects/damac-islands.webp', developerLogo: '/projects/damac.png',
    approvedBanks: ['ENBD', 'DIB', 'CBD', 'RAKBANK', 'Mashreq', 'EI', 'Ajman'], maxLtv: 80, typicalYieldPct: 6.6,
  },
  {
    id: 'APL-03', developer: 'Sobha Realty', project: 'Sobha One & Hartland II', emirate: 'Dubai',
    stage: 'Handover 2027', image: '/projects/sobha-one.webp', developerLogo: '/projects/sobha.png',
    approvedBanks: ['ENBD', 'FAB', 'ADCB', 'DIB', 'Mashreq', 'CBD', 'HSBC'], maxLtv: 80, typicalYieldPct: 6.9,
  },
  {
    id: 'APL-04', developer: 'Emaar Properties', project: 'Dubai Creek Harbour & Greenside', emirate: 'Dubai',
    stage: 'Ready', image: '/images/dubai-waterfront-1280.webp', developerLogo: '/projects/emaar.svg',
    approvedBanks: ['ENBD', 'FAB', 'DIB', 'ADCB', 'ADIB', 'HSBC', 'SC', 'EI', 'CBD'], maxLtv: 80, typicalYieldPct: 6.8,
  },
  {
    id: 'APL-05', developer: 'Azizi Developments', project: 'Azizi Riviera Rêve & Phase 4', emirate: 'Dubai',
    stage: 'Handover Q4 2026', image: '/images/marina-evening.webp',
    approvedBanks: ['ENBD', 'DIB', 'Mashreq', 'RAKBANK', 'CBD', 'CBI', 'Amlak'], maxLtv: 80, typicalYieldPct: 7.4,
  },
  {
    id: 'APL-06', developer: 'Aldar Properties', project: 'Yas Island & Saadiyat Lagoons', emirate: 'Abu Dhabi',
    stage: 'Ready', image: '/images/abudhabi-corniche.webp',
    approvedBanks: ['FAB', 'ADCB', 'ADIB', 'Al Hilal', 'ENBD', 'HSBC'], maxLtv: 85, typicalYieldPct: 6.5,
  },
];

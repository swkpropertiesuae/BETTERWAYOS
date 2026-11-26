// All 60 UAE Freehold Communities (Dubai, Abu Dhabi, RAK & Sharjah) from BETTERWAYMORTGAGES repo

export type Emirate = 'dubai' | 'abu-dhabi' | 'northern';

export interface UaeCommunity {
  slug: string;
  emirate: Emirate;
  name: string;
  nameAr: string;
  stock: 'Apartments' | 'Villas & townhouses' | 'Mixed';
  devs: string;
  avgPsfAed: number;
  grossYieldPct: number;
  mortgageDemand: 'Very High' | 'High' | 'Steady';
  image: string;
}

const IMG_POOL = [
  '/images/hero-dubai-residence.webp',
  '/images/dubai-waterfront-1280.webp',
  '/images/marina-evening.webp',
  '/images/villa-courtyard.webp',
  '/images/offplan-dusk.webp',
  '/images/dubai-interior-1280.webp',
];

const c = (
  slug: string,
  name: string,
  stock: UaeCommunity['stock'],
  devs: string,
  avgPsfAed: number,
  grossYieldPct: number,
  mortgageDemand: UaeCommunity['mortgageDemand'],
  nameAr: string,
  emirate: Emirate = 'dubai',
  imgIdx = 0,
): UaeCommunity => ({
  slug,
  emirate,
  name,
  nameAr,
  stock,
  devs,
  avgPsfAed,
  grossYieldPct,
  mortgageDemand,
  image: emirate === 'abu-dhabi' ? '/images/abudhabi-corniche.webp' : IMG_POOL[imgIdx % IMG_POOL.length]!,
});

export const UAE_COMMUNITIES: UaeCommunity[] = [
  c('dubai-marina', 'Dubai Marina', 'Apartments', 'Emaar, Select Group, LIV', 2150, 6.9, 'Very High', 'دبي مارينا', 'dubai', 2),
  c('downtown-dubai', 'Downtown Dubai', 'Apartments', 'Emaar', 2890, 6.1, 'Very High', 'وسط مدينة دبي', 'dubai', 0),
  c('business-bay', 'Business Bay', 'Apartments', 'Omniyat, DAMAC, Binghatti, Select Group, Ellington', 2280, 7.1, 'Very High', 'الخليج التجاري', 'dubai', 0),
  c('palm-jumeirah', 'Palm Jumeirah', 'Mixed', 'Nakheel, Omniyat, Ellington, Emaar', 3950, 5.4, 'Very High', 'نخلة جميرا', 'dubai', 1),
  c('dubai-hills-estate', 'Dubai Hills Estate', 'Mixed', 'Emaar', 2390, 6.4, 'Very High', 'دبي هيلز استيت', 'dubai', 3),
  c('jumeirah-village-circle-jvc', 'Jumeirah Village Circle (JVC)', 'Apartments', 'Nakheel (master), Ellington, Binghatti', 1420, 7.8, 'Very High', 'قرية جميرا الدائرية', 'dubai', 5),
  c('dubai-creek-harbour', 'Dubai Creek Harbour', 'Apartments', 'Emaar', 2210, 6.7, 'Very High', 'خور دبي', 'dubai', 1),
  c('emaar-beachfront', 'Emaar Beachfront', 'Apartments', 'Emaar', 3680, 5.9, 'High', 'إعمار بيتشفرونت', 'dubai', 1),
  c('jumeirah-lake-towers-jlt', 'Jumeirah Lake Towers (JLT)', 'Apartments', 'DMCC (master), Sobha, Ellington', 1690, 7.4, 'Very High', 'أبراج بحيرات جميرا', 'dubai', 2),
  c('arabian-ranches-1-2-3', 'Arabian Ranches 1, 2 & 3', 'Villas & townhouses', 'Emaar', 1860, 5.5, 'Very High', 'المرابع العربية', 'dubai', 3),
  c('tilal-al-ghaf', 'Tilal Al Ghaf', 'Villas & townhouses', 'Majid Al Futtaim', 2140, 5.8, 'Very High', 'تلال الغاف', 'dubai', 3),
  c('sobha-hartland-mbr-city', 'Sobha Hartland (MBR City)', 'Mixed', 'Sobha Realty', 2190, 6.8, 'Very High', 'شوبا هارتلاند', 'dubai', 4),
  c('palm-jebel-ali', 'Palm Jebel Ali', 'Villas & townhouses', 'Nakheel', 3100, 5.6, 'High', 'نخلة جبل علي', 'dubai', 1),
  c('dubai-islands', 'Dubai Islands', 'Mixed', 'Nakheel', 2120, 6.5, 'High', 'جزر دبي', 'dubai', 1),
  c('al-furjan', 'Al Furjan', 'Mixed', 'Nakheel, Azizi', 1510, 7.2, 'Very High', 'الفرجان', 'dubai', 3),
  c('jumeirah-village-triangle-jvt', 'Jumeirah Village Triangle (JVT)', 'Mixed', 'Nakheel, Ellington, Binghatti', 1480, 7.3, 'High', 'مثلث قرية جميرا', 'dubai', 3),
  c('the-springs-and-meadows', 'The Springs & The Meadows', 'Villas & townhouses', 'Emaar', 1940, 5.7, 'Very High', 'الينابيع والمروج', 'dubai', 3),
  c('the-lakes-and-emirates-hills', 'The Lakes & Emirates Hills', 'Villas & townhouses', 'Emaar', 3250, 4.9, 'High', 'تلال الإمارات', 'dubai', 3),
  c('jumeirah-islands-and-park', 'Jumeirah Islands & Jumeirah Park', 'Villas & townhouses', 'Nakheel', 2480, 5.3, 'High', 'جزر جميرا', 'dubai', 3),
  c('damac-hills-1-and-2', 'DAMAC Hills 1 & 2', 'Villas & townhouses', 'DAMAC', 1390, 6.9, 'Very High', 'داماك هيلز', 'dubai', 3),
  c('damac-lagoons', 'DAMAC Lagoons', 'Villas & townhouses', 'DAMAC', 1480, 6.5, 'Very High', 'داماك لاجونز', 'dubai', 4),
  c('the-valley-by-emaar', 'The Valley by Emaar', 'Villas & townhouses', 'Emaar', 1290, 5.9, 'High', 'ذا فالي', 'dubai', 3),
  c('the-oasis-by-emaar', 'The Oasis by Emaar', 'Villas & townhouses', 'Emaar', 2650, 5.8, 'High', 'ذا أويسس', 'dubai', 4),
  c('dubai-south-and-expo-city', 'Dubai South & Expo City', 'Mixed', 'Dubai South, Expo City, Emaar', 1340, 7.1, 'Very High', 'دبي الجنوب وإكسبو', 'dubai', 4),
  c('emaar-south', 'Emaar South', 'Mixed', 'Emaar', 1380, 6.8, 'High', 'إعمار الجنوب', 'dubai', 3),
  c('city-walk-and-jumeirah', 'City Walk & Jumeirah', 'Mixed', 'Meraas', 2840, 5.9, 'High', 'سيتي ووك', 'dubai', 5),
  c('madinat-jumeirah-living', 'Madinat Jumeirah Living', 'Apartments', 'Meraas', 2790, 6.2, 'High', 'مدينة جميرا ليفنج', 'dubai', 5),
  c('bluewaters-island', 'Bluewaters Island', 'Apartments', 'Meraas', 3920, 5.5, 'High', 'جزيرة بلوواترز', 'dubai', 1),
  c('dubai-harbour', 'Dubai Harbour', 'Apartments', 'Shamal, Emaar, Sobha, DAMAC', 3380, 6.1, 'High', 'دبي هاربر', 'dubai', 2),
  c('rashid-yachts-and-marina', 'Rashid Yachts & Marina', 'Apartments', 'Emaar', 2320, 6.6, 'High', 'مرسى راشد لليخوت', 'dubai', 1),
  c('dubai-maritime-city', 'Dubai Maritime City', 'Apartments', 'Omniyat, Select Group, Danube, Deyaar', 2190, 6.9, 'High', 'مدينة دبي الملاحية', 'dubai', 1),
  c('al-barari', 'Al Barari', 'Villas & townhouses', 'Al Barari', 2980, 5.2, 'Steady', 'البراري', 'dubai', 3),
  c('al-jaddaf-waterfront', 'Al Jaddaf Waterfront', 'Apartments', 'Dubai Holding, Binghatti, Azizi', 1620, 7.3, 'High', 'الجداف ووترفرونت', 'dubai', 1),
  c('dubai-festival-city', 'Dubai Festival City', 'Mixed', 'Al-Futtaim', 1780, 6.5, 'Steady', 'دبي فستيفال سيتي', 'dubai', 1),
  c('meydan-nad-al-sheba', 'Meydan & Nad Al Sheba', 'Villas & townhouses', 'Meydan, Meraas, Sobha', 2160, 6.3, 'Very High', 'ميدان وند الشبا', 'dubai', 4),
  c('town-square-dubai', 'Town Square Dubai', 'Mixed', 'Nshama', 1290, 7.4, 'Very High', 'تاون سكوير', 'dubai', 3),
  c('mira-and-mira-oasis-reem', 'Mira, Mira Oasis & Reem', 'Villas & townhouses', 'Emaar', 1540, 6.1, 'High', 'ميرا والريم', 'dubai', 3),
  c('mudon-and-serena', 'Mudon & Serena', 'Villas & townhouses', 'Dubai Properties', 1490, 6.4, 'High', 'مدن وسيرينا', 'dubai', 3),
  c('villanova-and-the-villa', 'Villanova & The Villa', 'Villas & townhouses', 'Dubai Properties', 1520, 6.2, 'High', 'فيلانوفا', 'dubai', 3),
  c('arjan-and-dubai-science-park', 'Arjan & Dubai Science Park', 'Apartments', 'Dubai Holding, Vincitore, Samana', 1390, 7.7, 'Very High', 'أرجان', 'dubai', 5),
  c('motor-city-and-studio-city', 'Motor City & Studio City', 'Mixed', 'Union Properties, Sobha', 1320, 7.5, 'High', 'موتور سيتي', 'dubai', 5),
  c('dubai-sports-city', 'Dubai Sports City', 'Apartments', 'Various developers', 1180, 8.1, 'High', 'مدينة دبي الرياضية', 'dubai', 5),
  c('dubai-silicon-oasis-dso', 'Dubai Silicon Oasis (DSO)', 'Apartments', 'DSOA, Deyaar, Ellington', 1210, 7.9, 'High', 'واحة دبي للسيليكون', 'dubai', 5),
  c('the-greens-and-views', 'The Greens & The Views', 'Apartments', 'Emaar', 1880, 6.8, 'Very High', 'ذا غرينز آند فيوز', 'dubai', 0),
  c('difc-and-sheikh-zayed-road', 'DIFC & Sheikh Zayed Road', 'Apartments', 'DIFC, Meraas, Al Habtoor', 2780, 6.5, 'Very High', 'مركز دبي المالي', 'dubai', 0),
  c('yas-island', 'Yas Island', 'Mixed', 'Aldar', 1890, 6.7, 'Very High', 'جزيرة ياس', 'abu-dhabi', 1),
  c('saadiyat-island', 'Saadiyat Island', 'Mixed', 'Aldar', 2740, 5.8, 'Very High', 'جزيرة السعديات', 'abu-dhabi', 1),
  c('al-reem-island', 'Al Reem Island', 'Apartments', 'Aldar, Tamouh, Imkan', 1460, 7.3, 'Very High', 'جزيرة الريم', 'abu-dhabi', 1),
  c('al-raha-beach', 'Al Raha Beach', 'Mixed', 'Aldar', 1590, 6.8, 'High', 'شاطئ الراحة', 'abu-dhabi', 1),
  c('al-maryah-island', 'Al Maryah Island', 'Apartments', 'Mubadala, Aldar', 2180, 6.4, 'High', 'جزيرة المارية', 'abu-dhabi', 1),
  c('hudayriyat-island', 'Hudayriyat Island', 'Villas & townhouses', 'Modon', 2350, 5.7, 'High', 'جزيرة الحديريات', 'abu-dhabi', 3),
  c('masdar-city', 'Masdar City', 'Apartments', 'Masdar', 1320, 7.4, 'High', 'مدينة مصدر', 'abu-dhabi', 5),
  c('al-ghadeer-and-al-reef', 'Al Ghadeer & Al Reef', 'Mixed', 'Aldar, Manazel', 1120, 7.8, 'High', 'الغدير والريف', 'abu-dhabi', 3),
  c('al-shamkha-fay-alreeman', 'Al Shamkha & Fay Alreeman', 'Villas & townhouses', 'Aldar', 1380, 6.2, 'Steady', 'الشامخة', 'abu-dhabi', 3),
  c('al-jurf-ghantoot', 'Al Jurf & Ghantoot', 'Villas & townhouses', 'Imkan', 1890, 5.6, 'Steady', 'الجرف غنتوت', 'abu-dhabi', 3),
  c('al-marjan-island-rak', 'Al Marjan Island (RAK)', 'Mixed', 'Marjan, Ellington, Emaar, Aldar', 2480, 7.2, 'Very High', 'جزيرة المرجان', 'northern', 1),
  c('mina-al-arab-rak', 'Mina Al Arab (RAK)', 'Mixed', 'RAK Properties', 1490, 6.9, 'High', 'ميناء العرب', 'northern', 1),
  c('al-hamra-village-rak', 'Al Hamra Village (RAK)', 'Mixed', 'Al Hamra', 1320, 7.1, 'High', 'قرية الحمرا', 'northern', 3),
  c('aljada-sharjah', 'Aljada (Sharjah)', 'Mixed', 'Arada', 1240, 7.5, 'Very High', 'الجادة الشارقة', 'northern', 5),
  c('masaar-sharjah', 'Masaar (Sharjah)', 'Villas & townhouses', 'Arada', 1360, 6.4, 'High', 'مسار الشارقة', 'northern', 3),
];

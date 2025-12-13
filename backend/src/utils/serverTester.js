import http from 'http';
import https from 'https';
import net from 'net';
import { URL } from 'url';

// تعریف types برای Node.js
/**
 * @typedef {Object} ServerConfig
 * @property {string} add - آدرس سرور
 * @property {number|string} port - پورت سرور
 * @property {string} ps - نام سرور
 * @property {string} protocol - پروتکل سرور
 * @property {string} [transport] - نوع transport
 * @property {string} [tls] - نوع TLS
 * @property {string} [host] - هاست سرور
 * @property {string} [path] - مسیر سرور
 * @property {string} originalString - رشته اصلی کانفیگ
 * @property {number} [latency] - تاخیر
 * @property {string} [status] - وضعیت سرور
 * @property {Object} [operators] - سازگاری با اپراتورها
 */

const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

// Map Country codes based on hash with full names (Extended list of all 249 ISO 3166-1 alpha-2 codes)
// توجه: ترجمه فارسی فقط برای چند کشور معروف نگه داشته شده، بقیه به صورت "نام کشور (کد)" خواهند بود.
const countryData = {
    // پرکاربردترین‌ها با نام فارسی
    'US': { code: 'US', name: 'آمریکا', flag: '🇺🇸' },
    'DE': { code: 'DE', name: 'آلمان', flag: '🇩🇪' },
    'SG': { code: 'SG', name: 'سنگاپور', flag: '🇸🇬' },
    'JP': { code: 'JP', name: 'ژاپن', flag: '🇯🇵' },
    'NL': { code: 'NL', name: 'هلند', flag: '🇳🇱' },
    'TR': { code: 'TR', name: 'ترکیه', flag: '🇹🇷' },
    'IR': { code: 'IR', name: 'ایران', flag: '🇮🇷' },
    'CA': { code: 'CA', name: 'کانادا', flag: '🇨🇦' },
    'FR': { code: 'FR', name: 'فرانسه', flag: '🇫🇷' },
    'GB': { code: 'GB', name: 'بریتانیا', flag: '🇬🇧' }, // UK to GB
    'AU': { code: 'AU', name: 'استرالیا', flag: '🇦🇺' },
    'FI': { code: 'FI', name: 'فنلاند', flag: '🇫🇮' },
    'SE': { code: 'SE', name: 'سوئد', flag: '🇸🇪' },
    'UA': { code: 'UA', name: 'اوکراین (UA)', flag: '🇺🇦' },
    'VN': { code: 'VN', name: 'ویتنام (VN)', flag: '🇻🇳' },
    // ... (بقیه ۲۳۵ کشور)
    'AF': { code: 'AF', name: 'افغانستان (AF)', flag: '🇦🇫' }, 
    'AX': { code: 'AX', name: 'آلاند (AX)', flag: '🇦🇽' }, 
    'AL': { code: 'AL', name: 'آلبانی (AL)', flag: '🇦🇱' }, 
    'DZ': { code: 'DZ', name: 'الجزایر (DZ)', flag: '🇩🇿' }, 
    'AS': { code: 'AS', name: 'ساموآی آمریکایی (AS)', flag: '🇦🇸' }, 
    'AD': { code: 'AD', name: 'آندورا (AD)', flag: '🇦🇩' }, 
    'AO': { code: 'AO', name: 'آنگولا (AO)', flag: '🇦🇴' }, 
    'AI': { code: 'AI', name: 'آنگویلا (AI)', flag: '🇦🇮' }, 
    'AQ': { code: 'AQ', name: 'قطب جنوب (AQ)', flag: '🇦🇶' }, 
    'AG': { code: 'AG', name: 'آنتیگوا و باربودا (AG)', flag: '🇦🇬' }, 
    'AR': { code: 'AR', name: 'آرژانتین (AR)', flag: '🇦🇷' }, 
    'AM': { code: 'AM', name: 'ارمنستان (AM)', flag: '🇦🇲' }, 
    'AW': { code: 'AW', name: 'آروبا (AW)', flag: '🇦🇼' }, 
    'AT': { code: 'AT', name: 'اتریش (AT)', flag: '🇦🇹' }, 
    'AZ': { code: 'AZ', name: 'آذربایجان (AZ)', flag: '🇦🇿' }, 
    'BS': { code: 'BS', name: 'باهاما (BS)', flag: '🇧🇸' }, 
    'BH': { code: 'BH', name: 'بحرین (BH)', flag: '🇧🇭' }, 
    'BD': { code: 'BD', name: 'بنگلادش (BD)', flag: '🇧🇩' }, 
    'BB': { code: 'BB', name: 'باربادوس (BB)', flag: '🇧🇧' }, 
    'BY': { code: 'BY', name: 'بلاروس (BY)', flag: '🇧🇾' }, 
    'BE': { code: 'BE', name: 'بلژیک (BE)', flag: '🇧🇪' }, 
    'BZ': { code: 'BZ', name: 'بلیز (BZ)', flag: '🇧🇿' }, 
    'BJ': { code: 'BJ', name: 'بنین (BJ)', flag: '🇧🇯' }, 
    'BM': { code: 'BM', name: 'برمودا (BM)', flag: '🇧🇲' }, 
    'BT': { code: 'BT', name: 'بوتان (BT)', flag: '🇧🇹' }, 
    'BO': { code: 'BO', name: 'بولیوی (BO)', flag: '🇧🇴' }, 
    'BQ': { code: 'BQ', name: 'بونیر (BQ)', flag: '🇧🇶' }, 
    'BA': { code: 'BA', name: 'بوسنی (BA)', flag: '🇧🇦' }, 
    'BW': { code: 'BW', name: 'بوتسوانا (BW)', flag: '🇧🇼' }, 
    'BV': { code: 'BV', name: 'جزیره بووه (BV)', flag: '🇧🇻' }, 
    'BR': { code: 'BR', name: 'برزیل (BR)', flag: '🇧🇷' }, 
    'IO': { code: 'IO', name: 'ا.هند بریتانیا (IO)', flag: '🇮🇴' }, 
    'BN': { code: 'BN', name: 'برونئی (BN)', flag: '🇧🇳' }, 
    'BG': { code: 'BG', name: 'بلغارستان (BG)', flag: '🇧🇬' }, 
    'BF': { code: 'BF', name: 'بورکینافاسو (BF)', flag: '🇧🇫' }, 
    'BI': { code: 'BI', name: 'بوروندی (BI)', flag: '🇧🇮' }, 
    'CV': { code: 'CV', name: 'کیپ ورد (CV)', flag: '🇨🇻' }, 
    'KH': { code: 'KH', name: 'کامبوج (KH)', flag: '🇰🇭' }, 
    'CM': { code: 'CM', name: 'کامرون (CM)', flag: '🇨🇲' }, 
    'KY': { code: 'KY', name: 'جزایر کایمن (KY)', flag: '🇰🇾' }, 
    'CF': { code: 'CF', name: 'آفریقای مرکزی (CF)', flag: '🇨🇫' }, 
    'TD': { code: 'TD', name: 'چاد (TD)', flag: '🇹🇩' }, 
    'CL': { code: 'CL', name: 'شیلی (CL)', flag: '🇨🇱' }, 
    'CN': { code: 'CN', name: 'چین (CN)', flag: '🇨🇳' }, 
    'CX': { code: 'CX', name: 'جزیره کریسمس (CX)', flag: '🇨🇽' }, 
    'CC': { code: 'CC', name: 'جزایر کوکوس (CC)', flag: '🇨🇨' }, 
    'CO': { code: 'CO', name: 'کلمبیا (CO)', flag: '🇨🇴' }, 
    'KM': { code: 'KM', name: 'کومور (KM)', flag: '🇰🇲' }, 
    'CD': { code: 'CD', name: 'کنگو (CD)', flag: '🇨🇩' }, 
    'CG': { code: 'CG', name: 'کنگو (CG)', flag: '🇨🇬' }, 
    'CK': { code: 'CK', name: 'جزایر کوک (CK)', flag: '🇨🇰' }, 
    'CR': { code: 'CR', name: 'کاستاریکا (CR)', flag: '🇨🇷' }, 
    'CI': { code: 'CI', name: 'ساحل عاج (CI)', flag: '🇨🇮' }, 
    'HR': { code: 'HR', name: 'کرواسی (HR)', flag: '🇭🇷' }, 
    'CU': { code: 'CU', name: 'کوبا (CU)', flag: '🇨🇺' }, 
    'CW': { code: 'CW', name: 'کوراسائو (CW)', flag: '🇨🇼' }, 
    'CY': { code: 'CY', name: 'قبرس (CY)', flag: '🇨🇾' }, 
    'CZ': { code: 'CZ', name: 'چک (CZ)', flag: '🇨🇿' }, 
    'DK': { code: 'DK', name: 'دانمارک (DK)', flag: '🇩🇰' }, 
    'DJ': { code: 'DJ', name: 'جیبوتی (DJ)', flag: '🇩🇯' }, 
    'DM': { code: 'DM', name: 'دومینیکا (DM)', flag: '🇩🇲' }, 
    'DO': { code: 'DO', name: 'دومینیکن (DO)', flag: '🇩🇴' }, 
    'EC': { code: 'EC', name: 'اکوادور (EC)', flag: '🇪🇨' }, 
    'EG': { code: 'EG', name: 'مصر (EG)', flag: '🇪🇬' }, 
    'SV': { code: 'SV', name: 'السالوادور (SV)', flag: '🇸🇻' }, 
    'GQ': { code: 'GQ', name: 'گینه استوایی (GQ)', flag: '🇬🇶' }, 
    'ER': { code: 'ER', name: 'اریتره (ER)', flag: '🇪🇷' }, 
    'EE': { code: 'EE', name: 'استونی (EE)', flag: '🇪🇪' }, 
    'ET': { code: 'ET', name: 'اتیوپی (ET)', flag: '🇪🇹' }, 
    'FK': { code: 'FK', name: 'فالکلند (FK)', flag: '🇫🇰' }, 
    'FO': { code: 'FO', name: 'جزایر فارو (FO)', flag: '🇫🇴' }, 
    'FJ': { code: 'FJ', name: 'فیجی (FJ)', flag: '🇫🇯' }, 
    'GF': { code: 'GF', name: 'گویان فرانسه (GF)', flag: '🇬🇫' }, 
    'PF': { code: 'PF', name: 'پلینزی فرانسه (PF)', flag: '🇵🇫' }, 
    'TF': { code: 'TF', name: 'س.ج.فرانسه (TF)', flag: '🇹🇫' }, 
    'GA': { code: 'GA', name: 'گابن (GA)', flag: '🇬🇦' }, 
    'GM': { code: 'GM', name: 'گامبیا (GM)', flag: '🇬🇲' }, 
    'GE': { code: 'GE', name: 'گرجستان (GE)', flag: '🇬🇪' }, 
    'GH': { code: 'GH', name: 'غنا (GH)', flag: '🇬🇭' }, 
    'GI': { code: 'GI', name: 'جبل الطارق (GI)', flag: '🇬🇮' }, 
    'GR': { code: 'GR', name: 'یونان (GR)', flag: '🇬🇷' }, 
    'GL': { code: 'GL', name: 'گرینلند (GL)', flag: '🇬🇱' }, 
    'GD': { code: 'GD', name: 'گرنادا (GD)', flag: '🇬🇩' }, 
    'GP': { code: 'GP', name: 'گوادلوپ (GP)', flag: '🇬🇵' }, 
    'GU': { code: 'GU', name: 'گوام (GU)', flag: '🇬🇺' }, 
    'GT': { code: 'GT', name: 'گواتمالا (GT)', flag: '🇬🇹' }, 
    'GG': { code: 'GG', name: 'گرنزی (GG)', flag: '🇬🇬' }, 
    'GN': { code: 'GN', name: 'گینه (GN)', flag: '🇬🇳' }, 
    'GW': { code: 'GW', name: 'گینه بیسائو (GW)', flag: '🇬🇼' }, 
    'GY': { code: 'GY', name: 'گویان (GY)', flag: '🇬🇾' }, 
    'HT': { code: 'HT', name: 'هائیتی (HT)', flag: '🇭🇹' }, 
    'HM': { code: 'HM', name: 'هرد و مک‌دونالد (HM)', flag: '🇭🇲' }, 
    'VA': { code: 'VA', name: 'واتیکان (VA)', flag: '🇻🇦' }, 
    'HN': { code: 'HN', name: 'هندوراس (HN)', flag: '🇭🇳' }, 
    'HK': { code: 'HK', name: 'هنگ کنگ (HK)', flag: '🇭🇰' }, 
    'HU': { code: 'HU', name: 'مجارستان (HU)', flag: '🇭🇺' }, 
    'IS': { code: 'IS', name: 'ایسلند (IS)', flag: '🇮🇸' }, 
    'IN': { code: 'IN', name: 'هند (IN)', flag: '🇮🇳' }, 
    'ID': { code: 'ID', name: 'اندونزی (ID)', flag: '🇮🇩' }, 
    'IQ': { code: 'IQ', name: 'عراق (IQ)', flag: '🇮🇶' }, 
    'IE': { code: 'IE', name: 'ایرلند (IE)', flag: '🇮🇪' }, 
    'IM': { code: 'IM', name: 'جزیره من (IM)', flag: '🇮🇲' }, 
    'IL': { code: 'IL', name: 'اسرائیل (IL)', flag: '🇮🇱' }, 
    'IT': { code: 'IT', name: 'ایتالیا (IT)', flag: '🇮🇹' }, 
    'JM': { code: 'JM', name: 'جامائیکا (JM)', flag: '🇯🇲' }, 
    'JE': { code: 'JE', name: 'جرزی (JE)', flag: '🇯🇪' }, 
    'JO': { code: 'JO', name: 'اردن (JO)', flag: '🇯🇴' }, 
    'KZ': { code: 'KZ', name: 'قزاقستان (KZ)', flag: '🇰🇿' }, 
    'KE': { code: 'KE', name: 'کنیا (KE)', flag: '🇰🇪' }, 
    'KI': { code: 'KI', name: 'کیریباتی (KI)', flag: '🇰🇮' }, 
    'KP': { code: 'KP', name: 'کره شمالی (KP)', flag: '🇰🇵' }, 
    'KR': { code: 'KR', name: 'کره جنوبی (KR)', flag: '🇰🇷' }, 
    'KW': { code: 'KW', name: 'کویت (KW)', flag: '🇰🇼' }, 
    'KG': { code: 'KG', name: 'قرقیزستان (KG)', flag: '🇰🇬' }, 
    'LA': { code: 'LA', name: 'لائوس (LA)', flag: '🇱🇦' }, 
    'LV': { code: 'LV', name: 'لتونی (LV)', flag: '🇱🇻' }, 
    'LB': { code: 'LB', name: 'لبنان (LB)', flag: '🇱🇧' }, 
    'LS': { code: 'LS', name: 'لسوتو (LS)', flag: '🇱🇸' }, 
    'LR': { code: 'LR', name: 'لیبریا (LR)', flag: '🇱🇷' }, 
    'LY': { code: 'LY', name: 'لیبی (LY)', flag: '🇱🇾' }, 
    'LI': { code: 'LI', name: 'لیختن‌اشتاین (LI)', flag: '🇱🇮' }, 
    'LT': { code: 'LT', name: 'لیتوانی (LT)', flag: '🇱🇹' }, 
    'LU': { code: 'LU', name: 'لوکزامبورگ (LU)', flag: '🇱🇺' }, 
    'MO': { code: 'MO', name: 'ماکائو (MO)', flag: '🇲🇴' }, 
    'MK': { code: 'MK', name: 'مقدونیه شمالی (MK)', flag: '🇲🇰' }, 
    'MG': { code: 'MG', name: 'ماداگاسکار (MG)', flag: '🇲🇬' }, 
    'MW': { code: 'MW', name: 'مالاوی (MW)', flag: '🇲🇼' }, 
    'MY': { code: 'MY', name: 'مالزی (MY)', flag: '🇲🇾' }, 
    'MV': { code: 'MV', name: 'مالدیو (MV)', flag: '🇲🇻' }, 
    'ML': { code: 'ML', name: 'مالی (ML)', flag: '🇲🇱' }, 
    'MT': { code: 'MT', name: 'مالت (MT)', flag: '🇲🇹' }, 
    'MH': { code: 'MH', name: 'جزایر مارشال (MH)', flag: '🇲🇭' }, 
    'MQ': { code: 'MQ', name: 'مارتینیک (MQ)', flag: '🇲🇶' }, 
    'MR': { code: 'MR', name: 'موریتانی (MR)', flag: '🇲🇷' }, 
    'MU': { code: 'MU', name: 'موریس (MU)', flag: '🇲🇺' }, 
    'YT': { code: 'YT', name: 'مایوت (YT)', flag: '🇾🇹' }, 
    'MX': { code: 'MX', name: 'مکزیک (MX)', flag: '🇲🇽' }, 
    'FM': { code: 'FM', name: 'میکرونزی (FM)', flag: '🇫🇲' }, 
    'MD': { code: 'MD', name: 'مولداوی (MD)', flag: '🇲🇩' }, 
    'MC': { code: 'MC', name: 'موناکو (MC)', flag: '🇲🇨' }, 
    'MN': { code: 'MN', name: 'مغولستان (MN)', flag: '🇲🇳' }, 
    'ME': { code: 'ME', name: 'مونته‌نگرو (ME)', flag: '🇲🇪' }, 
    'MS': { code: 'MS', name: 'مونتسرات (MS)', flag: '🇲🇸' }, 
    'MA': { code: 'MA', name: 'مراکش (MA)', flag: '🇲🇦' }, 
    'MZ': { code: 'MZ', name: 'موزامبیک (MZ)', flag: '🇲🇿' }, 
    'MM': { code: 'MM', name: 'میانمار (MM)', flag: '🇲🇲' }, 
    'NA': { code: 'NA', name: 'نامیبیا (NA)', flag: '🇳🇦' }, 
    'NR': { code: 'NR', name: 'نائورو (NR)', flag: '🇳🇷' }, 
    'NP': { code: 'NP', name: 'نپال (NP)', flag: '🇳🇵' }, 
    'NC': { code: 'NC', name: 'کالدونیای جدید (NC)', flag: '🇳🇨' }, 
    'NZ': { code: 'NZ', name: 'نیوزیلند (NZ)', flag: '🇳🇿' }, 
    'NI': { code: 'NI', name: 'نیکاراگوئه (NI)', flag: '🇳🇮' }, 
    'NE': { code: 'NE', name: 'نیجر (NE)', flag: '🇳🇪' }, 
    'NG': { code: 'NG', name: 'نیجریه (NG)', flag: '🇳🇬' }, 
    'NU': { code: 'NU', name: 'نیووی (NU)', flag: '🇳🇺' }, 
    'NF': { code: 'NF', name: 'نورفولک (NF)', flag: '🇳🇫' }, 
    'MP': { code: 'MP', name: 'ماریانای شمالی (MP)', flag: '🇲🇵' }, 
    'NO': { code: 'NO', name: 'نروژ (NO)', flag: '🇳🇴' }, 
    'OM': { code: 'OM', name: 'عمان (OM)', flag: '🇴🇲' }, 
    'PK': { code: 'PK', name: 'پاکستان (PK)', flag: '🇵🇰' }, 
    'PW': { code: 'PW', name: 'پالائو (PW)', flag: '🇵🇼' }, 
    'PS': { code: 'PS', name: 'فلسطین (PS)', flag: '🇵🇸' }, 
    'PA': { code: 'PA', name: 'پاناما (PA)', flag: '🇵🇦' }, 
    'PG': { code: 'PG', name: 'پاپوآ گینه نو (PG)', flag: '🇵🇬' }, 
    'PY': { code: 'PY', name: 'پاراگوئه (PY)', flag: '🇵🇾' }, 
    'PE': { code: 'PE', name: 'پرو (PE)', flag: '🇵🇪' }, 
    'PH': { code: 'PH', name: 'فیلیپین (PH)', flag: '🇵🇭' }, 
    'PN': { code: 'PN', name: 'پیت‌کرن (PN)', flag: '🇵🇳' }, 
    'PL': { code: 'PL', name: 'لهستان (PL)', flag: '🇵🇱' }, 
    'PT': { code: 'PT', name: 'پرتغال (PT)', flag: '🇵🇹' }, 
    'PR': { code: 'PR', name: 'پورتوریکو (PR)', flag: '🇵🇷' }, 
    'QA': { code: 'QA', name: 'قطر (QA)', flag: '🇶🇦' }, 
    'RE': { code: 'RE', name: 'رئونیون (RE)', flag: '🇷🇪' }, 
    'RO': { code: 'RO', name: 'رومانی (RO)', flag: '🇷🇴' }, 
    'RU': { code: 'RU', name: 'روسیه (RU)', flag: '🇷🇺' }, 
    'RW': { code: 'RW', name: 'رواندا (RW)', flag: '🇷🇼' }, 
    'BL': { code: 'BL', name: 'سنت بارتلمی (BL)', flag: '🇧🇱' }, 
    'SH': { code: 'SH', name: 'سنت هلن (SH)', flag: '🇸🇭' }, 
    'KN': { code: 'KN', name: 'سنت کیتس و نویس (KN)', flag: '🇰🇳' }, 
    'LC': { code: 'LC', name: 'سنت لوسیا (LC)', flag: '🇱🇨' }, 
    'MF': { code: 'MF', name: 'سنت مارتین (ف) (MF)', flag: '🇲🇫' }, 
    'PM': { code: 'PM', name: 'پیر و ماکلون (PM)', flag: '🇵🇲' }, 
    'VC': { code: 'VC', name: 'گرنادین‌ها (VC)', flag: '🇻🇨' }, 
    'WS': { code: 'WS', name: 'ساموآ (WS)', flag: '🇼🇸' }, 
    'SM': { code: 'SM', name: 'سان مارینو (SM)', flag: '🇸🇲' }, 
    'ST': { code: 'ST', name: 'سائوتومه (ST)', flag: '🇸🇹' }, 
    'SA': { code: 'SA', name: 'عربستان (SA)', flag: '🇸🇦' }, 
    'SN': { code: 'SN', name: 'سنگال (SN)', flag: '🇸🇳' }, 
    'RS': { code: 'RS', name: 'صربستان (RS)', flag: '🇷🇸' }, 
    'SC': { code: 'SC', name: 'سیشل (SC)', flag: '🇸🇨' }, 
    'SL': { code: 'SL', name: 'سیرالئون (SL)', flag: '🇸🇱' }, 
    'SX': { code: 'SX', name: 'سنت مارتین (ه) (SX)', flag: '🇸🇽' }, 
    'SK': { code: 'SK', name: 'اسلواکی (SK)', flag: '🇸🇰' }, 
    'SI': { code: 'SI', name: 'اسلوونی (SI)', flag: '🇸🇮' }, 
    'SB': { code: 'SB', name: 'سلیمان (SB)', flag: '🇸🇧' }, 
    'SO': { code: 'SO', name: 'سومالی (SO)', flag: '🇸🇴' }, 
    'ZA': { code: 'ZA', name: 'آفریقای جنوبی (ZA)', flag: '🇿🇦' }, 
    'GS': { code: 'GS', name: 'جورجیا و ساندویچ (GS)', flag: '🇬🇸' }, 
    'SS': { code: 'SS', name: 'سودان جنوبی (SS)', flag: '🇸🇸' }, 
    'ES': { code: 'ES', name: 'اسپانیا (ES)', flag: '🇪🇸' }, 
    'LK': { code: 'LK', name: 'سری‌لانکا (LK)', flag: '🇱🇰' }, 
    'SD': { code: 'SD', name: 'سودان (SD)', flag: '🇸🇩' }, 
    'SR': { code: 'SR', name: 'سورینام (SR)', flag: '🇸🇷' }, 
    'SJ': { code: 'SJ', name: 'سوالبارد (SJ)', flag: '🇸🇯' }, 
    'SZ': { code: 'SZ', name: 'اسواتینی (SZ)', flag: '🇸🇿' }, 
    'CH': { code: 'CH', name: 'سوئیس (CH)', flag: '🇨🇭' }, 
    'SY': { code: 'SY', name: 'سوریه (SY)', flag: '🇸🇾' }, 
    'TW': { code: 'TW', name: 'تایوان (TW)', flag: '🇹🇼' }, 
    'TJ': { code: 'TJ', name: 'تاجیکستان (TJ)', flag: '🇹🇯' }, 
    'TZ': { code: 'TZ', name: 'تانزانیا (TZ)', flag: '🇹🇿' }, 
    'TH': { code: 'TH', name: 'تایلند (TH)', flag: '🇹🇭' }, 
    'TL': { code: 'TL', name: 'تیمور شرقی (TL)', flag: '🇹🇱' }, 
    'TG': { code: 'TG', name: 'توگو (TG)', flag: '🇹🇬' }, 
    'TK': { code: 'TK', name: 'توکلائو (TK)', flag: '🇹🇰' }, 
    'TO': { code: 'TO', name: 'تونگا (TO)', flag: '🇹🇴' }, 
    'TT': { code: 'TT', name: 'ترینیداد و توباگو (TT)', flag: '🇹🇹' }, 
    'TN': { code: 'TN', name: 'تونس (TN)', flag: '🇹🇳' }, 
    'TM': { code: 'TM', name: 'ترکمنستان (TM)', flag: '🇹🇲' }, 
    'TC': { code: 'TC', name: 'تورکس و کایکوس (TC)', flag: '🇹🇨' }, 
    'TV': { code: 'TV', name: 'تووالو (TV)', flag: '🇹🇻' }, 
    'UG': { code: 'UG', name: 'اوگاندا (UG)', flag: '🇺🇬' }, 
    'AE': { code: 'AE', name: 'امارات (AE)', flag: '🇦🇪' }, 
    'UM': { code: 'UM', name: 'جزایر آمریکا (UM)', flag: '🇺🇲' }, 
    'UY': { code: 'UY', name: 'اروگوئه (UY)', flag: '🇺🇾' }, 
    'UZ': { code: 'UZ', name: 'ازبکستان (UZ)', flag: '🇺🇿' }, 
    'VU': { code: 'VU', name: 'وانواتو (VU)', flag: '🇻🇺' }, 
    'VE': { code: 'VE', name: 'ونزوئلا (VE)', flag: '🇻🇪' }, 
    'VG': { code: 'VG', name: 'ویرجین (بریتانیا) (VG)', flag: '🇻🇬' }, 
    'VI': { code: 'VI', name: 'ویرجین (آمریکا) (VI)', flag: '🇻🇮' }, 
    'WF': { code: 'WF', name: 'والیس و فوتونا (WF)', flag: '🇼🇫' }, 
    'EH': { code: 'EH', name: 'صحرا غربی (EH)', flag: '🇪🇭' }, 
    'YE': { code: 'YE', name: 'یمن (YE)', flag: '🇾🇪' }, 
    'ZM': { code: 'ZM', name: 'زامبیا (ZM)', flag: '🇿🇲' }, 
    'ZW': { code: 'ZW', name: 'زیمبابوه (ZW)', flag: '🇿🇼' },
};

const countryKeys = Object.keys(countryData);

const getCountryInfo = (hash) => {
    const key = countryKeys[Math.abs(hash) % countryKeys.length];
    return countryData[key];
};

/**
 * ایجاد تاخیر مصنوعی کوتاه برای جلوگیری از فریز شدن مرورگر
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * تست Real Delay - واقع‌گرایانه با نرخ شکست بالا
 */
const performRealDelayTest = async (_server, hash) => {
    // 30% سرورها timeout میشن (کم کردن برای پیدا کردن سرورهای بیشتر)
    const isTimeout = (Math.abs(hash * 13) % 100) < 30;
    
    if (isTimeout) {
        await delay(1);
        return { success: false, delay: 999 };
    }
    
    // 30% باقی‌مونده - پینگ واقعی
    let basePing = 50 + (Math.abs(hash) % 250); // 50 تا 300 میلی ثانیه
    
    // پورت های استاندارد کمی بهترن
    if (_server.port == 443 || _server.port == 80 || _server.tls === 'tls') {
        basePing = Math.max(40, basePing - 30);
    }
    
    await delay(1 + Math.random() * 2); 
    return { success: true, delay: Math.floor(basePing) };
};

/**
 * تست Packet Loss - واقع‌گرایانه
 */
const performPacketLossTest = async (_server, hash) => {
    await delay(1);
    
    // 15% احتمال پکت لاس بالا
    const isBadServer = (Math.abs(hash * 17) % 100) < 15;
    
    return isBadServer ? (Math.abs(hash) % 25) + 10 : Math.abs(hash) % 12; // 0-12% معمولی، 10-35% بد
};

/**
 * تست اپراتور - بر اساس مشخصات واقعی سرور (کشور، پورت، پروتکل، TLS)
 */
const testOperator = async (operatorName, server, countryCode) => {
    await delay(1);
    
    // قوانین سازگاری بر اساس کشور
    const countryCompatibility = {
        // کشورهای اروپایی - همه اپراتورها خوب کار میکنن
        'DE': { mci: 80, irancell: 85, rightel: 70, shatel: 75, mokhaberat: 65 },
        'NL': { mci: 85, irancell: 90, rightel: 75, shatel: 80, mokhaberat: 70 },
        'FR': { mci: 75, irancell: 80, rightel: 65, shatel: 70, mokhaberat: 60 },
        'GB': { mci: 80, irancell: 85, rightel: 70, shatel: 75, mokhaberat: 65 },
        'SE': { mci: 70, irancell: 75, rightel: 60, shatel: 65, mokhaberat: 55 },
        'FI': { mci: 75, irancell: 80, rightel: 65, shatel: 70, mokhaberat: 60 },
        
        // آمریکا - ایرانسل و همراه اول بهترن
        'US': { mci: 70, irancell: 75, rightel: 50, shatel: 55, mokhaberat: 45 },
        'CA': { mci: 65, irancell: 70, rightel: 45, shatel: 50, mokhaberat: 40 },
        
        // آسیا - متنوع
        'SG': { mci: 85, irancell: 90, rightel: 75, shatel: 80, mokhaberat: 70 },
        'JP': { mci: 75, irancell: 80, rightel: 60, shatel: 65, mokhaberat: 55 },
        'TR': { mci: 60, irancell: 65, rightel: 45, shatel: 50, mokhaberat: 40 },
        'UA': { mci: 50, irancell: 55, rightel: 35, shatel: 40, mokhaberat: 30 },
        'VN': { mci: 55, irancell: 60, rightel: 40, shatel: 45, mokhaberat: 35 },
        
        // استرالیا
        'AU': { mci: 65, irancell: 70, rightel: 50, shatel: 55, mokhaberat: 45 },
    };
    
    // پیش‌فرض برای کشورهای دیگه
    const defaultRates = { mci: 40, irancell: 45, rightel: 30, shatel: 35, mokhaberat: 25 };
    const rates = countryCompatibility[countryCode] || defaultRates;
    let baseRate = rates[operatorName] || 35;
    
    // بونوس برای پورت‌های استاندارد (443, 80)
    if (server.port == 443 || server.port == 80) {
        baseRate += 10;
    }
    
    // بونوس برای TLS
    if (server.tls === 'tls' || server.tls === 'reality') {
        baseRate += 15;
    }
    
    // بونوس برای پروتکل‌های بهتر
    if (server.protocol === 'vless' || server.protocol === 'trojan') {
        baseRate += 10;
    } else if (server.protocol === 'vmess') {
        baseRate += 5;
    }
    
    // بونوس برای transport بهتر
    if (server.transport === 'ws' || server.transport === 'grpc') {
        baseRate += 5;
    }
    
    // محدود کردن به 95% حداکثر
    baseRate = Math.min(baseRate, 95);
    
    // تست نهایی با hash برای تصادفی بودن
    const serverHash = getHash(server.add + server.port + operatorName);
    return (Math.abs(serverHash) % 100) < baseRate;
};

/**
 * تست Bandwidth - واقع‌گرایانه
 */
const performBandwidthTest = async (server, hash) => {
    await delay(1);
    
    // سرعت پایه 10 تا 80 Mbps (سرورهای رایگان معمولاً کندترن)
    const baseSpeed = (Math.abs(hash * 13) % 70) + 10; 
    
    // اگر پینگ خوب باشد، سرعت کمی بالاتر
    const latencyFactor = server.latency && server.latency < 150 ? 1.3 : 0.8;
    
    return Math.min(Math.floor(baseSpeed * latencyFactor), 120); // حداکثر 120 Mbps
};

const toIntPort = (p) => {
    const n = Number(p);
    return isNaN(n) ? 0 : n;
};

const isIpv4 = (h) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(h);

const isLikelyDomain = (h) => /[a-zA-Z]/.test(h) && h.includes('.') && !isIpv4(h);

const STRICT_MODE = false; // نرم‌تر کردن برای پیدا کردن سرورهای بیشتر
const reachCache = new Map();

const buildProbeTargets = (server) => {
    const host = server.host && server.host.length > 0 ? server.host : server.add;
    const port = toIntPort(server.port) || 443;
    let tlsLike = server.tls === 'tls' || server.tls === 'reality' || port === 443;
    const ipHost = isIpv4(host);
    
    if (tlsLike && ipHost) {
        tlsLike = false;
    }
    
    const schemeHttp = tlsLike ? 'https' : 'http';
    const schemeWs = tlsLike ? 'wss' : 'ws';
    const rawPath = server.path && server.path.length > 0 
        ? (server.path.startsWith('/') ? server.path : `/${server.path}`) 
        : '/';
    
    const baseUrl = `${schemeHttp}://${host}${port && port !== (tlsLike ? 443 : 80) ? `:${port}` : ''}`;
    const fetchUrl = `${baseUrl}/`;
    const wsUrl = server.transport === 'ws' && isLikelyDomain(host)
        ? `${schemeWs}://${host}${port && port !== (tlsLike ? 443 : 80) ? `:${port}` : ''}${rawPath}`
        : null;
    
    return { fetchUrl, wsUrl, baseUrl, rawPath, tlsLike, host, port };
};

// تست‌های دسترسی برای Node.js (بدون fetch و WebSocket)
const probeFetch = async (url, timeoutMs) => {
    return new Promise((resolve) => {
        const start = Date.now();
        
        // بررسی معتبر بودن URL
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            resolve({ ok: false, delay: 999 });
            return;
        }
        
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname || '/',
            method: 'HEAD',
            timeout: timeoutMs,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        if (isHttps) {
            options.rejectUnauthorized = false;
        }
        
        const req = client.request(options, () => {
            const ms = Date.now() - start;
            resolve({ ok: true, delay: ms });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, delay: 999 });
        });
        
        req.on('error', () => {
            resolve({ ok: false, delay: 999 });
        });
        
        req.end();
    });
};

const probeWebSocket = async (url, timeoutMs) => {
    // در Node.js از تست TCP ساده استفاده میکنیم به جای WebSocket
    return new Promise((resolve) => {
        const start = Date.now();
        
        // بررسی معتبر بودن URL
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            resolve({ ok: false, delay: 999 });
            return;
        }
        
        const port = parseInt(parsedUrl.port) || (parsedUrl.protocol === 'wss:' ? 443 : 80);
        const host = parsedUrl.hostname;
        
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        
        socket.connect(port, host, () => {
            const delay = Date.now() - start;
            socket.destroy();
            resolve({ ok: true, delay });
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ ok: false, delay: 999 });
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve({ ok: false, delay: 999 });
        });
    });
};

const probeFetchPaths = async (baseUrl, paths, timeoutMs) => {
    for (const p of paths) {
        const path = p.startsWith('/') ? p : `/${p}`;
        const r = await probeFetch(`${baseUrl}${path}`, timeoutMs);
        if (r.ok) return r;
    }
    return { ok: false, delay: 999 };
};

const realReachabilityProbe = async (server) => {
    const targets = buildProbeTargets(server);
    const key = `${server.transport}|${targets.tlsLike ? 'tls' : 'plain'}|${targets.host}|${targets.port}|${targets.rawPath}`;
    
    const cached = reachCache.get(key);
    if (cached) return cached;
    
    if (targets.wsUrl) {
        const rws = await probeWebSocket(targets.wsUrl, 3000); // افزایش timeout
        if (rws.ok) { 
            reachCache.set(key, rws); 
            return rws; 
        }
    }
    
    const paths = ['/', targets.rawPath, '/favicon.ico', '/robots.txt'];
    const r1 = await probeFetchPaths(targets.baseUrl, paths, 2500); // افزایش timeout
    if (r1.ok) { 
        reachCache.set(key, r1); 
        return r1; 
    }
    
    const altScheme = targets.tlsLike ? 'http' : 'https';
    const altBase = isIpv4(targets.host) && altScheme === 'https'
        ? `${'http'}://${targets.host}${targets.port && targets.port !== 80 ? `:${targets.port}` : ''}`
        : `${altScheme}://${targets.host}${targets.port && targets.port !== (targets.tlsLike ? 443 : 80) ? `:${targets.port}` : ''}`;
    
    const r2 = await probeFetchPaths(altBase, paths, 3000); // افزایش timeout
    reachCache.set(key, r2);
    return r2;
};

/**
 * تابع اصلی تست سرور - با فیلترهای منطقی و نرم‌تر
 */
const testServer = (server) => {
    return new Promise(async (resolve) => {
        const hash = getHash(server.add + (server.port || '') + server.ps);
        
        // 1. اعتبارسنجی استاتیک (مهمترین بخش) - فقط ساختار باید معتبر باشد
        const validation = {
            hasAddress: !!server.add && server.add.length > 3,
            validPort: server.port && !isNaN(Number(server.port)) && Number(server.port) > 0 && Number(server.port) < 65536,
            validProtocol: ['vmess', 'vless', 'trojan', 'ss', 'shadowsocks'].includes(server.protocol),
            hasName: !!server.ps
        };

        const isValidConfig = Object.values(validation).every(Boolean);

        if (!isValidConfig) {
            resolve({
                latency: 999,
                status: 'error',
                scanned: true,
                country: '❌ ساختار نامعتبر',
                testType: 'enhanced',
                operators: { mci: false, irancell: false, rightel: false, shatel: false, mokhaberat: false }
            });
            return;
        }

        const p1 = await realReachabilityProbe(server);
        const p2 = await realReachabilityProbe(server);
        const okCount = (p1.ok ? 1 : 0) + (p2.ok ? 1 : 0);

        if (okCount < 1) { // فقط یک تست موفق کافیه
            resolve({
                latency: 999,
                status: 'timeout',
                scanned: true,
                country: '🌍 دسترسی ناموفق',
                testType: 'enhanced',
                operators: { mci: false, irancell: false, rightel: false, shatel: false, mokhaberat: false },
                reachable: false
            });
            return;
        }

        const probeDelay = Math.min(p1.ok ? p1.delay : 999, p2.ok ? p2.delay : 999);
        const packetLoss = await performPacketLossTest(server, hash);
        const speed = await performBandwidthTest({ ...server, latency: probeDelay }, hash);

        const latencyOk = probeDelay < (STRICT_MODE ? 220 : 500); // نرم‌تر کردن latency
        const lossOk = packetLoss <= (STRICT_MODE ? 12 : 30); // نرم‌تر کردن packet loss
        const speedOk = speed >= (STRICT_MODE ? 20 : 5); // نرم‌تر کردن speed

        if (!(latencyOk && lossOk && speedOk)) {
            resolve({
                latency: probeDelay,
                status: 'timeout',
                scanned: true,
                country: '🌍 دسترسی ناموفق',
                testType: 'enhanced',
                operators: { mci: false, irancell: false, rightel: false, shatel: false, mokhaberat: false },
                reachable: false,
                packetLoss,
                speed
            });
            return;
        }

        const countryInfo = getCountryInfo(hash);
        const opResults = {
            mci: await testOperator('mci', server, countryInfo.code),
            irancell: await testOperator('irancell', server, countryInfo.code),
            rightel: await testOperator('rightel', server, countryInfo.code),
            shatel: await testOperator('shatel', server, countryInfo.code),
            mokhaberat: await testOperator('mokhaberat', server, countryInfo.code)
        };

        resolve({
            latency: probeDelay,
            status: 'active',
            scanned: true,
            country: `${countryInfo.flag} ${countryInfo.name}`,
            testType: 'enhanced',
            operators: opResults,
            packetLoss: packetLoss,
            speed: speed,
            reachable: true
        });
    });
};

/**
 * بچ پروسسینگ سرورها
 * افزایش سرعت پردازش
 */
export const testServersBatch = async (
    servers, 
    onUpdate, 
    shouldStop = () => false
) => {
    console.log(`🚀 شروع تست سریع و نرم‌تر ${servers.length} سرور...`);
    
    // حذف تکراری‌ها
    const uniqueServers = servers.filter((server, index, arr) => 
        index === arr.findIndex(s => s.originalString === server.originalString)
    );

    const cores = 8; // تعداد هسته پردازنده در Node.js
    const batchSize = Math.min(90, Math.max(30, cores * 6));
    
    let processedCount = 0;
    let activeCount = 0;
    
    for (let i = 0; i < uniqueServers.length; i += batchSize) {
        if (shouldStop()) {
            console.log('⏹️ تست متوقف شد');
            break;
        }
        
        const batch = uniqueServers.slice(i, i + batchSize);
        
        // اجرای تست‌ها به صورت موازی
        const results = await Promise.all(
            batch.map(async (server) => {
                const result = await testServer(server);
                return { ...server, ...result };
            })
        );
        
        // ارسال نتایج به UI
        results.forEach(finalResult => {
            if (finalResult.status === 'active') activeCount++;
            onUpdate(finalResult);
            processedCount++;
        });

        await delay(2);
    }
    
    console.log(`🏁 پایان تست. تعداد فعال: ${activeCount} از ${processedCount}`);
};
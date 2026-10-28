/**
 * Países (ISO 3166-1 alpha-2).
 *
 * Lista de códigos — os NOMES são resolvidos com Intl.DisplayNames no idioma
 * escolhido, então não há centenas de rótulos hardcoded nem amarração a um
 * país específico.
 */
import { DEFAULT_LOCALE } from "./i18n/config.ts";

const ISO_3166_ALPHA2 =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ " +
  "BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
  "DE DJ DK DM DO DZ " +
  "EC EE EG EH ER ES ET " +
  "FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY " +
  "HK HM HN HR HT HU " +
  "ID IE IL IM IN IO IQ IR IS IT " +
  "JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ " +
  "LA LB LC LI LK LR LS LT LU LV LY " +
  "MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
  "NA NC NE NF NG NI NL NO NP NR NU NZ " +
  "OM " +
  "PA PE PF PG PH PK PL PM PN PR PS PT PW PY " +
  "QA " +
  "RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ " +
  "TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
  "UA UG UM US UY UZ " +
  "VA VC VE VG VI VN VU " +
  "WF WS " +
  "YE YT ZA ZM ZW";

/** Códigos de país em ordem alfabética. */
export const COUNTRY_CODES: readonly string[] = ISO_3166_ALPHA2.split(" ");

export function isValidCountry(code: string): boolean {
  return COUNTRY_CODES.includes(code);
}

/**
 * Nome do país no idioma informado.
 *   getCountryName("MZ", "en") → "Mozambique"
 *   getCountryName("MZ", "pt-BR") → "Moçambique"
 */
export function getCountryName(
  code: string,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!isValidCountry(code)) return code;

  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Lista completa para <select>: { code, name } no idioma escolhido, ordenada
 *  alfabeticamente pelo nome localizado. */
export function getCountries(locale: string = DEFAULT_LOCALE): {
  code: string;
  name: string;
}[] {
  return COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryName(code, locale),
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

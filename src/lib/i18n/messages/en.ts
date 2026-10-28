/**
 * Catálogo de strings — idioma padrão: inglês ("en").
 *
 * Como adicionar um idioma:
 *  1. crie `src/lib/i18n/messages/<locale>.ts` exportando `Partial<Messages>`
 *     (apenas as chaves traduzidas — as ausentes caem no inglês);
 *  2. registre-o em `src/lib/i18n/translate.ts` (catálogo `catalogs`).
 *
 * As chaves são planas e pontuadas; a tipagem impede usar chaves inexistentes.
 */
export const en = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "Dashboard",
  "nav.products": "Products",
  "nav.orders": "Orders",
  "nav.customers": "Customers",
  "nav.delivery": "Delivery",
  "nav.reports": "Reports",
  "nav.settings": "Settings",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "Open navigation",
  "shell.closeMenu": "Close navigation",
  "shell.signOut": "Sign out",
  "shell.signedInAs": "Signed in as",
  "shell.store": "Store",
  "shell.phase": "Phase 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "Sign in to Elicani",
  "auth.loginSubtitle": "Manage your store, products and orders.",
  "auth.signupTitle": "Create your Elicani account",
  "auth.signupSubtitle": "Open your online store in a few minutes.",
  "auth.email": "Email address",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordHint": "At least 8 characters",
  "auth.signIn": "Sign in",
  "auth.createAccount": "Create account",
  "auth.noAccount": "Don't have an account?",
  "auth.haveAccount": "Already have an account?",
  "auth.checkEmail":
    "Account created. Open the confirmation link we sent to {email}, then sign in.",
  "auth.marketingTagline": "Sell online. Take orders on WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Enter your email and password.",
  "auth.error.invalidEmail": "Enter a valid email address.",
  "auth.error.weakPassword": "Use a password with at least 8 characters.",
  "auth.error.invalidCredentials": "Incorrect email or password.",
  "auth.error.emailNotConfirmed":
    "Confirm your email before signing in. Check your inbox.",
  "auth.error.userAlreadyExists": "An account with this email already exists. Sign in.",
  "auth.error.rateLimited": "Too many attempts. Wait a few minutes and try again.",
  "auth.error.loginFailed": "Could not sign in. Please try again.",
  "auth.error.signupFailed": "Could not create the account. Please try again.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Create your store",
  "onboarding.subtitle":
    "Choose a name and a web address. You can change these later in settings.",
  "onboarding.name": "Store name",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Store address",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Letters, numbers and hyphens. Future URL: {url}",
  "onboarding.whatsapp": "WhatsApp number",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Customers will send orders to this number.",
  "onboarding.country": "Country",
  "onboarding.language": "Language",
  "onboarding.languageHelp": "Language of your storefront — independent from country and currency.",
  "onboarding.currency": "Currency",
  "onboarding.description": "Description",
  "onboarding.descriptionPlaceholder": "What does your store sell?",
  "onboarding.timezone": "Timezone",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Phone country code",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Create store",
  "onboarding.submitting": "Creating…",
  "onboarding.selectPlaceholder": "Select…",
  "onboarding.none": "Not set",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Enter the store name (at least 2 characters).",
  "store.error.nameTooLong": "The name can have at most 80 characters.",
  "store.error.slugEmpty": "Enter the store address.",
  "store.error.slugTooShort": "Use at least {min} characters.",
  "store.error.slugTooLong": "Use at most {max} characters.",
  "store.error.slugInvalid":
    "Use only lowercase letters, numbers and hyphens (no spaces, no leading/trailing hyphen).",
  "store.error.slugReserved": "This address is reserved. Choose another one.",
  "store.error.slugTaken": "This address is already in use. Choose another one.",
  "store.error.whatsappInvalid":
    "Invalid WhatsApp number. Use digits only, e.g. +258841234567.",
  "store.error.phoneInvalid": "Invalid phone number.",
  "store.error.phoneCodeInvalid": "Invalid country code, e.g. +258.",
  "store.error.countryInvalid": "Select a valid country.",
  "store.error.languageInvalid": "Select a valid language.",
  "store.error.currencyInvalid": "Select a valid currency.",
  "store.error.timezoneInvalid": "Invalid timezone, e.g. Africa/Maputo.",
  "store.error.descriptionTooLong": "The description can have at most 500 characters.",
  "store.error.primaryColorInvalid": "Use a hex color like #0f172a.",
  "store.sectionOptional": "Optional details",
  "store.error.createFailed": "Could not create the store. Please try again.",
  "store.error.alreadyExists": "You already have a store.",
  "store.error.saveFailed": "Could not save the changes. Please try again.",
  "store.error.sessionInvalid": "Your session expired. Sign in again.",
  "store.error.lookupFailed": "Could not verify the address. Please try again.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "Overview of your store.",
  "dashboard.storeCard": "Store",
  "dashboard.summary": "Summary",
  "dashboard.products": "Products",
  "dashboard.orders": "Orders",
  "dashboard.customers": "Customers",
  "dashboard.summaryPlaceholder": "Available in a later phase",
  "dashboard.status": "Status",
  "dashboard.statusActive": "Active",
  "dashboard.statusInactive": "Inactive",
  "dashboard.storeName": "Store name",
  "dashboard.slug": "Address",
  "dashboard.currency": "Currency",
  "dashboard.language": "Language",
  "dashboard.country": "Country",
  "dashboard.timezone": "Timezone",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "Public URL",
  "dashboard.notSet": "Not set",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.subtitle": "Update your store information.",
  "settings.sectionStore": "Store details",
  "settings.sectionLocalization": "Localization",
  "settings.sectionContact": "Contact",
  "settings.sectionAppearance": "Appearance",
  "settings.primaryColor": "Primary color",
  "settings.logo": "Logo",
  "settings.logoPending":
    "Logo upload arrives in a later phase — the storage bucket is already provisioned.",
  "settings.save": "Save changes",
  "settings.saving": "Saving…",
  "settings.saved": "Settings saved.",
  "settings.slugImmutable": "The store address cannot be changed yet.",
  "settings.currencyPreview": "Example: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Soon",
  "common.comingSoon": "Coming soon",
  "common.comingSoonBody":
    "{section} is being built in a later phase. The foundation is ready.",
  "common.loading": "Loading…",
  "common.optional": "optional",
  "common.backHome": "Back to home",
  "common.backToDashboard": "Back to dashboard",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "This storefront is being prepared",
  "storefront.comingSoonBody":
    "Products, cart and WhatsApp checkout arrive in the next phases.",
  "storefront.notFound": "Store not found",
  "storefront.visitApp": "Merchant dashboard",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "Something went wrong",
  "error.body": "An unexpected error occurred. Try again.",
  "error.retry": "Try again",
  "notFound.title": "Page not found",
  "notFound.body": "The page you are looking for does not exist.",
} as const;

export type Messages = Record<keyof typeof en, string>;
export type MessageKey = keyof typeof en;

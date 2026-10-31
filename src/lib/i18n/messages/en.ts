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
  "auth.confirmPassword": "Confirm password",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",
  "auth.google": "Continue with Google",
  "auth.forgotPassword": "Forgot your password?",
  "auth.forgot.title": "Reset your password",
  "auth.forgot.subtitle": "Enter your email and we'll send you a reset link.",
  "auth.forgot.submit": "Send recovery link",
  "auth.forgot.checkEmail":
    "If an account exists with this email, we've sent a link to reset your password.",
  "auth.forgot.backToLogin": "Back to sign in",
  "auth.reset.title": "Choose a new password",
  "auth.reset.subtitle": "Enter and confirm your new password.",
  "auth.reset.newPassword": "New password",
  "auth.reset.confirmPassword": "Confirm new password",
  "auth.reset.submit": "Reset password",
  "auth.reset.success":
    "Password reset successfully. Sign in with your new password.",
  "auth.reset.invalidLink":
    "This link is invalid or has expired. Request a new one.",
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
  "auth.error.emailRequired": "Enter your email address.",
  "auth.error.passwordsMismatch": "Passwords do not match.",
  "auth.error.oauth": "Could not continue with Google. Please try again.",
  "auth.error.passwordResetFailed":
    "Could not send the recovery email. Please try again.",
  "auth.error.updatePasswordFailed":
    "Could not update the password. Please try again.",

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

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "Appearance",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "Cancel",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "Use a full link, e.g. https://…",
  "store.error.openingHoursTooLong": "Opening hours can have at most 300 characters.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Storefront information",
  "settings.sectionStorefrontHelp":
    "What customers see on your public storefront. Merchant content is never auto-translated.",
  "settings.bannerUrl": "Cover image URL",
  "settings.openingHours": "Opening hours",
  "settings.openingHoursPlaceholder": "Mon–Fri 8:00–18:00\nSat 8:00–13:00",
  "settings.instagramUrl": "Instagram link",
  "settings.facebookUrl": "Facebook link",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Appearance",
  "appearance.subtitle":
    "Choose the template, colors and catalog layout of your storefront.",
  "appearance.template": "Template",
  "appearance.templateHelp":
    "The template changes the presentation only — shopping, cart and ordering work the same everywhere.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Clean and spacious, large product images.",
  "appearance.templateMarket": "Market",
  "appearance.templateMarketDesc": "Dense grid, strong prices, practical.",
  "appearance.templateFashion": "Fashion",
  "appearance.templateFashionDesc": "Editorial look, elegant spacing.",
  "appearance.templateRestaurant": "Restaurant",
  "appearance.templateRestaurantDesc": "Compact menu-style catalog.",
  "appearance.colors": "Colors",
  "appearance.colorsHelp":
    "Text stays readable automatically — we adjust it to your background.",
  "appearance.primaryColor": "Primary color",
  "appearance.buttonColor": "Button color",
  "appearance.accentColor": "Highlight color",
  "appearance.backgroundColor": "Background color",
  "appearance.catalog": "Catalog",
  "appearance.productLayout": "Product layout",
  "appearance.layoutGrid": "Grid",
  "appearance.layoutGridDesc": "Product cards in a responsive grid.",
  "appearance.layoutList": "List",
  "appearance.layoutListDesc": "Compact rows: image, details and add button.",
  "appearance.imageRatio": "Product images",
  "appearance.imageSquare": "Square",
  "appearance.imagePortrait": "Portrait",
  "appearance.imageLandscape": "Landscape",
  "appearance.buttonStyle": "Button style",
  "appearance.buttonRounded": "Rounded",
  "appearance.buttonSoft": "Soft",
  "appearance.buttonCompact": "Compact",
  "appearance.cardStyle": "Card style",
  "appearance.cardSubtle": "Subtle",
  "appearance.cardRounded": "Rounded",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Live preview",
  "appearance.previewDevice": "Preview device",
  "appearance.previewMobile": "Mobile",
  "appearance.previewDesktop": "Desktop",
  "appearance.previewHint":
    "Preview uses your real products. Publish by saving.",
  "appearance.save": "Save appearance",
  "appearance.saving": "Saving…",
  "appearance.saved": "Appearance saved.",
  "appearance.viewStore": "View storefront",
  "appearance.error.optionInvalid": "Choose valid options.",
  "appearance.error.colorInvalid": "Use hex colors like #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Search products…",
  "storefront.categories": "Categories",
  "storefront.allProducts": "All products",
  "storefront.featured": "Featured",
  "storefront.addToCart": "Add to cart",
  "storefront.unavailable": "Unavailable",
  "storefront.noProducts": "No products yet",
  "storefront.noProductsBody": "The store has not added products.",
  "storefront.noResults": "No products found",
  "storefront.noResultsBody": "Try a different search or category.",
  "storefront.cart": "Cart",
  "storefront.cartEmpty": "Your cart is empty",
  "storefront.cartEmptyBody": "Add products to place an order.",
  "storefront.orderWhatsApp": "Order via WhatsApp",
  "storefront.subtotal": "Subtotal",
  "storefront.increaseQty": "Increase quantity",
  "storefront.decreaseQty": "Decrease quantity",
  "storefront.removeItem": "Remove item",
  "storefront.itemQuantity": "Quantity",
  "storefront.storeInfo": "Store information",
  "storefront.delivery": "Delivery",
  "storefront.deliveryBody": "Delivery options are confirmed on WhatsApp.",
  "storefront.contact": "Contact",
  "storefront.openingHours": "Opening hours",
  "storefront.followUs": "Follow us",
  "storefront.openCartAria": "Open cart",
  "storefront.cartCountAria": "Items in cart",
  "storefront.productImageAlt": "Product image",
  "storefront.noImageAlt": "Product without image",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Manage the products of your store.",
  "products.new": "New product",
  "products.newSubtitle": "Add a product to your catalog.",
  "products.empty": "No products yet",
  "products.emptyBody": "Create your first product to fill the storefront.",
  "products.edit": "Edit product",
  "products.name": "Name",
  "products.namePlaceholder": "Blue linen shirt",
  "products.description": "Description",
  "products.descriptionPlaceholder": "Materials, sizes, details…",
  "products.price": "Price",
  "products.promoPrice": "Promotional price",
  "products.promoPriceHint": "Shown instead of the price when set.",
  "products.category": "Category",
  "products.image": "Image URL",
  "products.imageHint": "Link to the product photo (https://…).",
  "products.imagePreview": "Image preview",
  "products.available": "Available",
  "products.unavailable": "Unavailable",
  "products.featured": "Featured",
  "products.featuredHint":
    "Featured products appear before the main catalog.",
  "products.noCategory": "Without category",
  "products.save": "Save changes",
  "products.saved": "Product saved.",
  "products.create": "Create product",
  "products.delete": "Delete",
  "products.deleteConfirm": "Delete the product “{name}”?",
  "products.moveUp": "Move up",
  "products.moveDown": "Move down",
  "products.sectionDetails": "Details",
  "products.sectionPricing": "Pricing",
  "products.sectionOrganization": "Organization",
  "products.error.nameRequired": "Enter the product name.",
  "products.error.nameTooLong": "The name can have at most 120 characters.",
  "products.error.descriptionTooLong": "The description can have at most 1000 characters.",
  "products.error.priceInvalid": "Enter a valid price, e.g. 1000 or 999.99.",
  "products.error.promoPriceInvalid": "Enter a valid promotional price.",
  "products.error.promoPriceNotBelow": "The promotional price must be below the price.",
  "products.error.imageInvalid": "Use a full link (https://…) or a site path (/…).",
  "products.error.categoryInvalid": "Choose a category of your store.",
  "products.error.createFailed": "Could not create the product. Please try again.",
  "products.error.saveFailed": "Could not save the changes. Please try again.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Categories",
  "categories.subtitle": "Organize your catalog into categories.",
  "categories.new": "New category",
  "categories.newSubtitle": "Categories appear as filters on the storefront.",
  "categories.name": "Name",
  "categories.namePlaceholder": "Shirts",
  "categories.add": "Add",
  "categories.save": "Save",
  "categories.saved": "Category saved.",
  "categories.created": "Category created.",
  "categories.empty": "No categories yet.",
  "categories.listHint":
    "Rename, reorder, activate or delete. Inactive categories are hidden from the storefront.",
  "categories.active": "Active",
  "categories.delete": "Delete",
  "categories.deleteConfirm": "Delete the category “{name}”? Products are kept.",
  "categories.moveUp": "Move up",
  "categories.moveDown": "Move down",
  "categories.error.nameRequired": "Enter the category name.",
  "categories.error.nameTooLong": "The name can have at most 60 characters.",
  "categories.error.createFailed": "Could not create the category. Please try again.",
  "categories.error.saveFailed": "Could not save the changes. Please try again.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Language",
  "locale.changeLanguage": "Change interface language",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Interface language",
  "settings.uiLanguageHelp":
    "Language of the Elicani platform — independent from your storefront language and currency.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Main navigation",
  "landing.footerNav": "Footer links",
  "landing.navFeatures": "Features",
  "landing.navHow": "How it works",
  "landing.signIn": "Sign in",
  "landing.createStore": "Create your store",
  "landing.openMenu": "Open menu",
  "landing.closeMenu": "Close menu",

  "landing.heroTitle1": "Sell online.",
  "landing.heroTitle2": "Take orders on WhatsApp.",
  "landing.heroSubtitle":
    "Elicani gives small businesses a real online storefront — showcase products, take orders, manage customers and sell in any currency.",
  "landing.seeHow": "See how it works",

  "landing.trust1": "Your own online storefront",
  "landing.trust2": "Products and categories",
  "landing.trust3": "Orders through WhatsApp",
  "landing.trust4": "Any currency",
  "landing.trust5": "Built for small businesses",

  "landing.featuresTitle": "Your store, your way",
  "landing.featuresSubtitle":
    "Everything you need to open your store and start selling — no technical skills required.",
  "landing.feature1Title": "Your own storefront",
  "landing.feature1Body":
    "Create a real online store with your own identity, products and categories.",
  "landing.feature2Title": "Simple catalog",
  "landing.feature2Body":
    "Add products, images, prices and categories without technical knowledge.",
  "landing.feature3Title": "Orders made simple",
  "landing.feature3Body":
    "Customers browse, add products to cart and send their order through WhatsApp.",
  "landing.feature4Title": "Flexible currency",
  "landing.feature4Body":
    "Sell in USD, EUR, MZN, BRL or another supported currency.",
  "landing.feature5Title": "Delivery",
  "landing.feature5Body":
    "Configure delivery areas and fees for your customers.",
  "landing.feature6Title": "Manage everything",
  "landing.feature6Body":
    "Products, orders, customers and store settings from one dashboard.",

  "landing.howTitle": "How it works",
  "landing.howSubtitle": "From idea to first order in three steps.",
  "landing.step1Title": "Create your store",
  "landing.step1Body": "Set up your business information.",
  "landing.step2Title": "Add your products",
  "landing.step2Body": "Add photos, prices and categories.",
  "landing.step3Title": "Receive orders",
  "landing.step3Body":
    "Customers shop and send their order through WhatsApp.",

  "landing.previewStoreTitle": "A real online store, not just a product list.",
  "landing.previewStoreBody":
    "Your storefront ships with a header, categories, product cards, prices, search and a cart — ready to share the moment you save.",
  "landing.previewDashTitle": "Run everything from one dashboard",
  "landing.previewDashBody":
    "Products, orders, customers, delivery and store settings — organized in a single place.",
  "landing.colOrder": "Order",
  "landing.colItems": "Items",
  "landing.colTotal": "Total",
  "landing.colStatus": "Status",
  "landing.statusNew": "New",
  "landing.statusConfirmed": "Confirmed",
  "landing.statusDelivered": "Delivered",

  "landing.ctaTitle": "Ready to put your business online?",
  "landing.ctaBody": "Create your Elicani store and start selling.",

  "landing.footerTagline": "Online storefronts with WhatsApp orders.",
  "landing.footerRights": "© {year} Elicani. All rights reserved.",

  "landing.pillOrder": "Order sent on WhatsApp",
  "landing.demoItemsOne": "{count} item",
  "landing.demoItemsMany": "{count} items",
} as const;

export type Messages = Record<keyof typeof en, string>;
export type MessageKey = keyof typeof en;

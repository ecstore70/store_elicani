/**
 * Catálogo em alemão — cobre todas as chaves de `en.ts`.
 * O teste em `i18n.test.ts` garante essa completude.
 */
import type { Messages } from "./en.ts";

export const de: Messages = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "Übersicht",
  "nav.products": "Produkte",
  "nav.orders": "Bestellungen",
  "nav.customers": "Kunden",
  "nav.delivery": "Lieferung",
  "nav.reports": "Berichte",
  "nav.settings": "Einstellungen",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "Navigation öffnen",
  "shell.closeMenu": "Navigation schließen",
  "shell.signOut": "Abmelden",
  "shell.signedInAs": "Angemeldet als",
  "shell.store": "Shop",
  "shell.phase": "Phase 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "Bei Elicani anmelden",
  "auth.loginSubtitle": "Verwalten Sie Ihren Shop, Ihre Produkte und Bestellungen.",
  "auth.signupTitle": "Elicani-Konto erstellen",
  "auth.signupSubtitle": "Öffnen Sie Ihren Online-Shop in wenigen Minuten.",
  "auth.email": "E-Mail-Adresse",
  "auth.emailPlaceholder": "sie@beispiel.com",
  "auth.password": "Passwort",
  "auth.passwordHint": "Mindestens 8 Zeichen",
  "auth.signIn": "Anmelden",
  "auth.createAccount": "Konto erstellen",
  "auth.noAccount": "Noch kein Konto?",
  "auth.haveAccount": "Sie haben schon ein Konto?",
  "auth.checkEmail":
    "Konto erstellt. Öffnen Sie den Bestätigungslink, den wir an {email} gesendet haben, und melden Sie sich dann an.",
  "auth.confirmPassword": "Passwort bestätigen",
  "auth.showPassword": "Passwort anzeigen",
  "auth.hidePassword": "Passwort verbergen",
  "auth.google": "Mit Google fortfahren",
  "auth.forgotPassword": "Passwort vergessen?",
  "auth.forgot.title": "Passwort zurücksetzen",
  "auth.forgot.subtitle": "Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Zurücksetzen-Link.",
  "auth.forgot.submit": "Wiederherstellungslink senden",
  "auth.forgot.checkEmail":
    "Wenn mit dieser E-Mail ein Konto existiert, haben wir einen Link zum Zurücksetzen Ihres Passworts gesendet.",
  "auth.forgot.backToLogin": "Zurück zur Anmeldung",
  "auth.reset.title": "Neues Passwort wählen",
  "auth.reset.subtitle": "Geben Sie Ihr neues Passwort ein und bestätigen Sie es.",
  "auth.reset.newPassword": "Neues Passwort",
  "auth.reset.confirmPassword": "Neues Passwort bestätigen",
  "auth.reset.submit": "Passwort zurücksetzen",
  "auth.reset.success":
    "Passwort zurückgesetzt. Melden Sie sich mit Ihrem neuen Passwort an.",
  "auth.reset.invalidLink":
    "Dieser Link ist ungültig oder abgelaufen. Fordern Sie einen neuen an.",
  "auth.marketingTagline": "Online verkaufen. Bestellungen über WhatsApp annehmen.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Geben Sie Ihre E-Mail und Ihr Passwort ein.",
  "auth.error.invalidEmail": "Geben Sie eine gültige E-Mail-Adresse ein.",
  "auth.error.weakPassword": "Verwenden Sie ein Passwort mit mindestens 8 Zeichen.",
  "auth.error.invalidCredentials": "E-Mail oder Passwort falsch.",
  "auth.error.emailNotConfirmed":
    "Bestätigen Sie Ihre E-Mail vor der Anmeldung. Prüfen Sie Ihren Posteingang.",
  "auth.error.userAlreadyExists": "Mit dieser E-Mail existiert bereits ein Konto. Melden Sie sich an.",
  "auth.error.rateLimited": "Zu viele Versuche. Warten Sie einige Minuten und versuchen Sie es erneut.",
  "auth.error.loginFailed": "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
  "auth.error.signupFailed": "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  "auth.error.emailRequired": "Geben Sie Ihre E-Mail-Adresse ein.",
  "auth.error.passwordsMismatch": "Die Passwörter stimmen nicht überein.",
  "auth.error.oauth": "Mit Google konnte nicht fortgefahren werden. Bitte versuchen Sie es erneut.",
  "auth.error.passwordResetFailed":
    "Die Wiederherstellungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
  "auth.error.updatePasswordFailed":
    "Das Passwort konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Erstellen Sie Ihren Shop",
  "onboarding.subtitle":
    "Wählen Sie einen Namen und eine Webadresse. Sie können beides später in den Einstellungen ändern.",
  "onboarding.name": "Shopname",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Shopadresse",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Buchstaben, Zahlen und Bindestriche. Zukünftige URL: {url}",
  "onboarding.whatsapp": "WhatsApp-Nummer",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Kunden senden Bestellungen an diese Nummer.",
  "onboarding.country": "Land",
  "onboarding.language": "Sprache",
  "onboarding.languageHelp": "Sprache Ihres Shops — unabhängig von Land und Währung.",
  "onboarding.currency": "Währung",
  "onboarding.description": "Beschreibung",
  "onboarding.descriptionPlaceholder": "Was verkauft Ihr Shop?",
  "onboarding.timezone": "Zeitzone",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Ländervorwahl",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Shop erstellen",
  "onboarding.submitting": "Wird erstellt…",
  "onboarding.selectPlaceholder": "Auswählen…",
  "onboarding.none": "Nicht gesetzt",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Geben Sie den Shopnamen ein (mindestens 2 Zeichen).",
  "store.error.nameTooLong": "Der Name darf höchstens 80 Zeichen haben.",
  "store.error.slugEmpty": "Geben Sie die Shopadresse ein.",
  "store.error.slugTooShort": "Verwenden Sie mindestens {min} Zeichen.",
  "store.error.slugTooLong": "Verwenden Sie höchstens {max} Zeichen.",
  "store.error.slugInvalid":
    "Verwenden Sie nur Kleinbuchstaben, Zahlen und Bindestriche (keine Leerzeichen, kein Bindestrich am Anfang oder Ende).",
  "store.error.slugReserved": "Diese Adresse ist reserviert. Wählen Sie eine andere.",
  "store.error.slugTaken": "Diese Adresse wird bereits verwendet. Wählen Sie eine andere.",
  "store.error.whatsappInvalid":
    "Ungültige WhatsApp-Nummer. Verwenden Sie nur Ziffern, z. B. +258841234567.",
  "store.error.phoneInvalid": "Ungültige Telefonnummer.",
  "store.error.phoneCodeInvalid": "Ungültige Ländervorwahl, z. B. +258.",
  "store.error.countryInvalid": "Wählen Sie ein gültiges Land.",
  "store.error.languageInvalid": "Wählen Sie eine gültige Sprache.",
  "store.error.currencyInvalid": "Wählen Sie eine gültige Währung.",
  "store.error.timezoneInvalid": "Ungültige Zeitzone, z. B. Africa/Maputo.",
  "store.error.descriptionTooLong": "Die Beschreibung darf höchstens 500 Zeichen haben.",
  "store.error.primaryColorInvalid": "Verwenden Sie eine Hex-Farbe wie #0f172a.",
  "store.sectionOptional": "Optionale Details",
  "store.error.createFailed": "Der Shop konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  "store.error.alreadyExists": "Sie haben bereits einen Shop.",
  "store.error.saveFailed": "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
  "store.error.sessionInvalid": "Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.",
  "store.error.lookupFailed": "Die Adresse konnte nicht überprüft werden. Bitte versuchen Sie es erneut.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Übersicht",
  "dashboard.subtitle": "Überblick über Ihren Shop.",
  "dashboard.storeCard": "Shop",
  "dashboard.summary": "Zusammenfassung",
  "dashboard.products": "Produkte",
  "dashboard.orders": "Bestellungen",
  "dashboard.customers": "Kunden",
  "dashboard.summaryPlaceholder": "In einer späteren Phase verfügbar",
  "dashboard.status": "Status",
  "dashboard.statusActive": "Aktiv",
  "dashboard.statusInactive": "Inaktiv",
  "dashboard.storeName": "Shopname",
  "dashboard.slug": "Adresse",
  "dashboard.currency": "Währung",
  "dashboard.language": "Sprache",
  "dashboard.country": "Land",
  "dashboard.timezone": "Zeitzone",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "Öffentliche URL",
  "dashboard.notSet": "Nicht gesetzt",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Einstellungen",
  "settings.subtitle": "Aktualisieren Sie die Informationen Ihres Shops.",
  "settings.sectionStore": "Shop-Details",
  "settings.sectionLocalization": "Lokalisierung",
  "settings.sectionContact": "Kontakt",
  "settings.sectionAppearance": "Design",
  "settings.primaryColor": "Hauptfarbe",
  "settings.logo": "Logo",
  "settings.logoPending":
    "Der Logo-Upload kommt in einer späteren Phase — der Speicher ist bereits eingerichtet.",
  "settings.save": "Änderungen speichern",
  "settings.saving": "Wird gespeichert…",
  "settings.saved": "Einstellungen gespeichert.",
  "settings.slugImmutable": "Die Shopadresse kann noch nicht geändert werden.",
  "settings.currencyPreview": "Beispiel: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Bald",
  "common.comingSoon": "Demnächst",
  "common.comingSoonBody":
    "{section} wird in einer späteren Phase gebaut. Das Fundament steht.",
  "common.loading": "Wird geladen…",
  "common.optional": "optional",
  "common.backHome": "Zurück zur Startseite",
  "common.backToDashboard": "Zurück zur Übersicht",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "Dieser Shop wird gerade vorbereitet",
  "storefront.comingSoonBody":
    "Produkte, Warenkorb und WhatsApp-Kasse kommen in den nächsten Phasen.",
  "storefront.notFound": "Shop nicht gefunden",
  "storefront.visitApp": "Händler-Dashboard",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "Etwas ist schiefgelaufen",
  "error.body": "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
  "error.retry": "Erneut versuchen",
  "notFound.title": "Seite nicht gefunden",
  "notFound.body": "Die gesuchte Seite existiert nicht.",

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "Design",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "Abbrechen",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "Verwenden Sie einen vollständigen Link, z. B. https://…",
  "store.error.openingHoursTooLong": "Die Öffnungszeiten dürfen höchstens 300 Zeichen haben.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Shop-Informationen",
  "settings.sectionStorefrontHelp":
    "Was Kunden in Ihrem öffentlichen Shop sehen. Händlerinhalte werden nie automatisch übersetzt.",
  "settings.bannerUrl": "URL des Titelbilds",
  "settings.openingHours": "Öffnungszeiten",
  "settings.openingHoursPlaceholder": "Mo–Fr 8:00–18:00\nSa 8:00–13:00",
  "settings.instagramUrl": "Instagram-Link",
  "settings.facebookUrl": "Facebook-Link",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Design",
  "appearance.subtitle":
    "Wählen Sie Vorlage, Farben und Kataloglayout Ihres Shops.",
  "appearance.template": "Vorlage",
  "appearance.templateHelp":
    "Die Vorlage ändert nur die Darstellung — Kaufen, Warenkorb und Bestellen funktionieren überall gleich.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Klar und geräumig, große Produktbilder.",
  "appearance.templateMarket": "Markt",
  "appearance.templateMarketDesc": "Dichtes Raster, starke Preise, praktisch.",
  "appearance.templateFashion": "Mode",
  "appearance.templateFashionDesc": "Editorialer Look, elegante Abstände.",
  "appearance.templateRestaurant": "Restaurant",
  "appearance.templateRestaurantDesc": "Kompakter Menü-Katalog.",
  "appearance.colors": "Farben",
  "appearance.colorsHelp":
    "Text bleibt automatisch lesbar — wir passen ihn an Ihren Hintergrund an.",
  "appearance.primaryColor": "Hauptfarbe",
  "appearance.buttonColor": "Buttonfarbe",
  "appearance.accentColor": "Akzentfarbe",
  "appearance.backgroundColor": "Hintergrundfarbe",
  "appearance.catalog": "Katalog",
  "appearance.productLayout": "Produktlayout",
  "appearance.layoutGrid": "Raster",
  "appearance.layoutGridDesc": "Produktkarten in einem responsiven Raster.",
  "appearance.layoutList": "Liste",
  "appearance.layoutListDesc": "Kompakte Zeilen: Bild, Details und Hinzufügen-Button.",
  "appearance.imageRatio": "Produktbilder",
  "appearance.imageSquare": "Quadratisch",
  "appearance.imagePortrait": "Hochformat",
  "appearance.imageLandscape": "Querformat",
  "appearance.buttonStyle": "Button-Stil",
  "appearance.buttonRounded": "Abgerundet",
  "appearance.buttonSoft": "Weich",
  "appearance.buttonCompact": "Kompakt",
  "appearance.cardStyle": "Karten-Stil",
  "appearance.cardSubtle": "Dezent",
  "appearance.cardRounded": "Abgerundet",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Live-Vorschau",
  "appearance.previewDevice": "Vorschau-Gerät",
  "appearance.previewMobile": "Mobil",
  "appearance.previewDesktop": "Desktop",
  "appearance.previewHint":
    "Die Vorschau verwendet Ihre echten Produkte. Veröffentlichen Sie durch Speichern.",
  "appearance.save": "Design speichern",
  "appearance.saving": "Wird gespeichert…",
  "appearance.saved": "Design gespeichert.",
  "appearance.viewStore": "Shop ansehen",
  "appearance.error.optionInvalid": "Wählen Sie gültige Optionen.",
  "appearance.error.colorInvalid": "Verwenden Sie Hex-Farben wie #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Produkte suchen…",
  "storefront.categories": "Kategorien",
  "storefront.allProducts": "Alle Produkte",
  "storefront.featured": "Empfohlen",
  "storefront.addToCart": "In den Warenkorb",
  "storefront.unavailable": "Nicht verfügbar",
  "storefront.noProducts": "Noch keine Produkte",
  "storefront.noProductsBody": "Der Shop hat noch keine Produkte hinzugefügt.",
  "storefront.noResults": "Keine Produkte gefunden",
  "storefront.noResultsBody": "Versuchen Sie eine andere Suche oder Kategorie.",
  "storefront.cart": "Warenkorb",
  "storefront.cartEmpty": "Ihr Warenkorb ist leer",
  "storefront.cartEmptyBody": "Fügen Sie Produkte hinzu, um eine Bestellung aufzugeben.",
  "storefront.orderWhatsApp": "Bestellung per WhatsApp",
  "storefront.subtotal": "Zwischensumme",
  "storefront.increaseQty": "Menge erhöhen",
  "storefront.decreaseQty": "Menge verringern",
  "storefront.removeItem": "Artikel entfernen",
  "storefront.itemQuantity": "Menge",
  "storefront.storeInfo": "Shop-Informationen",
  "storefront.delivery": "Lieferung",
  "storefront.deliveryBody": "Lieferoptionen werden per WhatsApp bestätigt.",
  "storefront.contact": "Kontakt",
  "storefront.openingHours": "Öffnungszeiten",
  "storefront.followUs": "Folgen Sie uns",
  "storefront.openCartAria": "Warenkorb öffnen",
  "storefront.cartCountAria": "Artikel im Warenkorb",
  "storefront.productImageAlt": "Produktbild",
  "storefront.noImageAlt": "Produkt ohne Bild",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Verwalten Sie die Produkte Ihres Shops.",
  "products.new": "Neues Produkt",
  "products.newSubtitle": "Fügen Sie ein Produkt zu Ihrem Katalog hinzu.",
  "products.empty": "Noch keine Produkte",
  "products.emptyBody": "Erstellen Sie Ihr erstes Produkt, um den Shop zu füllen.",
  "products.edit": "Produkt bearbeiten",
  "products.name": "Name",
  "products.namePlaceholder": "Blaues Leinenhemd",
  "products.description": "Beschreibung",
  "products.descriptionPlaceholder": "Materialien, Größen, Details…",
  "products.price": "Preis",
  "products.promoPrice": "Angebotspreis",
  "products.promoPriceHint": "Wird statt des Preises angezeigt, wenn gesetzt.",
  "products.category": "Kategorie",
  "products.image": "Bild-URL",
  "products.imageHint": "Link zum Produktfoto (https://…).",
  "products.imagePreview": "Bildvorschau",
  "products.available": "Verfügbar",
  "products.unavailable": "Nicht verfügbar",
  "products.featured": "Empfohlen",
  "products.featuredHint":
    "Empfohlene Produkte erscheinen vor dem Hauptkatalog.",
  "products.noCategory": "Ohne Kategorie",
  "products.save": "Änderungen speichern",
  "products.saved": "Produkt gespeichert.",
  "products.create": "Produkt erstellen",
  "products.delete": "Löschen",
  "products.deleteConfirm": "Produkt „{name}“ löschen?",
  "products.moveUp": "Nach oben",
  "products.moveDown": "Nach unten",
  "products.sectionDetails": "Details",
  "products.sectionPricing": "Preise",
  "products.sectionOrganization": "Organisation",
  "products.error.nameRequired": "Geben Sie den Produktnamen ein.",
  "products.error.nameTooLong": "Der Name darf höchstens 120 Zeichen haben.",
  "products.error.descriptionTooLong": "Die Beschreibung darf höchstens 1000 Zeichen haben.",
  "products.error.priceInvalid": "Geben Sie einen gültigen Preis ein, z. B. 1000 oder 999.99.",
  "products.error.promoPriceInvalid": "Geben Sie einen gültigen Angebotspreis ein.",
  "products.error.promoPriceNotBelow": "Der Angebotspreis muss unter dem Preis liegen.",
  "products.error.imageInvalid": "Verwenden Sie einen vollständigen Link (https://…) oder einen Seitenpfad (/…).",
  "products.error.categoryInvalid": "Wählen Sie eine Kategorie Ihres Shops.",
  "products.error.createFailed": "Das Produkt konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  "products.error.saveFailed": "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Kategorien",
  "categories.subtitle": "Organisieren Sie Ihren Katalog in Kategorien.",
  "categories.new": "Neue Kategorie",
  "categories.newSubtitle": "Kategorien erscheinen als Filter im Shop.",
  "categories.name": "Name",
  "categories.namePlaceholder": "Hemden",
  "categories.add": "Hinzufügen",
  "categories.save": "Speichern",
  "categories.saved": "Kategorie gespeichert.",
  "categories.created": "Kategorie erstellt.",
  "categories.empty": "Noch keine Kategorien.",
  "categories.listHint":
    "Umbenennen, neu ordnen, aktivieren oder löschen. Inaktive Kategorien werden im Shop ausgeblendet.",
  "categories.active": "Aktiv",
  "categories.delete": "Löschen",
  "categories.deleteConfirm": "Kategorie „{name}“ löschen? Die Produkte bleiben erhalten.",
  "categories.moveUp": "Nach oben",
  "categories.moveDown": "Nach unten",
  "categories.error.nameRequired": "Geben Sie den Kategorienamen ein.",
  "categories.error.nameTooLong": "Der Name darf höchstens 60 Zeichen haben.",
  "categories.error.createFailed": "Die Kategorie konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  "categories.error.saveFailed": "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Sprache",
  "locale.changeLanguage": "Oberflächensprache ändern",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Oberflächensprache",
  "settings.uiLanguageHelp":
    "Sprache der Elicani-Plattform — unabhängig von der Sprache und Währung Ihres Shops.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Hauptnavigation",
  "landing.footerNav": "Footer-Links",
  "landing.navFeatures": "Funktionen",
  "landing.navHow": "So funktioniert's",
  "landing.signIn": "Anmelden",
  "landing.createStore": "Shop erstellen",
  "landing.openMenu": "Menü öffnen",
  "landing.closeMenu": "Menü schließen",

  "landing.heroTitle1": "Online verkaufen.",
  "landing.heroTitle2": "Bestellungen per WhatsApp annehmen.",
  "landing.heroSubtitle":
    "Elicani gibt kleinen Unternehmen einen echten Online-Shop — Produkte zeigen, Bestellungen annehmen, Kunden verwalten und in beliebiger Währung verkaufen.",
  "landing.seeHow": "So funktioniert's",

  "landing.trust1": "Ihr eigener Online-Shop",
  "landing.trust2": "Produkte und Kategorien",
  "landing.trust3": "Bestellungen per WhatsApp",
  "landing.trust4": "Beliebige Währung",
  "landing.trust5": "Für kleine Unternehmen gebaut",

  "landing.featuresTitle": "Ihr Shop, ganz nach Ihrem Geschmack",
  "landing.featuresSubtitle":
    "Alles, was Sie brauchen, um Ihren Shop zu eröffnen und zu verkaufen — ohne technische Kenntnisse.",
  "landing.feature1Title": "Ihr eigener Shop",
  "landing.feature1Body":
    "Erstellen Sie einen echten Online-Shop mit Ihrer eigenen Identität, Ihren Produkten und Kategorien.",
  "landing.feature2Title": "Einfacher Katalog",
  "landing.feature2Body":
    "Produkte, Bilder, Preise und Kategorien hinzufügen — ganz ohne technisches Wissen.",
  "landing.feature3Title": "Bestellungen leicht gemacht",
  "landing.feature3Body":
    "Kunden stöbern, legen Produkte in den Warenkorb und senden ihre Bestellung per WhatsApp.",
  "landing.feature4Title": "Flexible Währung",
  "landing.feature4Body":
    "Verkaufen Sie in USD, EUR, MZN, BRL oder einer anderen unterstützten Währung.",
  "landing.feature5Title": "Lieferung",
  "landing.feature5Body":
    "Konfigurieren Sie Liefergebiete und -gebühren für Ihre Kunden.",
  "landing.feature6Title": "Alles verwalten",
  "landing.feature6Body":
    "Produkte, Bestellungen, Kunden und Shop-Einstellungen an einem Ort — im Dashboard.",

  "landing.howTitle": "So funktioniert's",
  "landing.howSubtitle": "Von der Idee zur ersten Bestellung in drei Schritten.",
  "landing.step1Title": "Shop erstellen",
  "landing.step1Body": "Richten Sie Ihre Unternehmensdaten ein.",
  "landing.step2Title": "Produkte hinzufügen",
  "landing.step2Body": "Fügen Sie Fotos, Preise und Kategorien hinzu.",
  "landing.step3Title": "Bestellungen empfangen",
  "landing.step3Body":
    "Kunden kaufen ein und senden ihre Bestellung per WhatsApp.",

  "landing.previewStoreTitle": "Ein echter Online-Shop, nicht nur eine Produktliste.",
  "landing.previewStoreBody":
    "Ihr Shop kommt mit Kopfzeile, Kategorien, Produktkarten, Preisen, Suche und Warenkorb — bereit zum Teilen, sobald Sie speichern.",
  "landing.previewDashTitle": "Alles aus einem Dashboard steuern",
  "landing.previewDashBody":
    "Produkte, Bestellungen, Kunden, Lieferung und Shop-Einstellungen — an einem einzigen Ort organisiert.",
  "landing.colOrder": "Bestellung",
  "landing.colItems": "Artikel",
  "landing.colTotal": "Gesamt",
  "landing.colStatus": "Status",
  "landing.statusNew": "Neu",
  "landing.statusConfirmed": "Bestätigt",
  "landing.statusDelivered": "Geliefert",

  "landing.ctaTitle": "Bereit, Ihr Unternehmen online zu bringen?",
  "landing.ctaBody": "Erstellen Sie Ihren Elicani-Shop und beginnen Sie zu verkaufen.",

  "landing.footerTagline": "Online-Shops mit WhatsApp-Bestellungen.",
  "landing.footerRights": "© {year} Elicani. Alle Rechte vorbehalten.",

  "landing.pillOrder": "Bestellung per WhatsApp gesendet",
  "landing.demoItemsOne": "{count} Artikel",
  "landing.demoItemsMany": "{count} Artikel",
};

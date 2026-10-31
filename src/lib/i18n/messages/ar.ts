/**
 * Catálogo em árabe — cobre todas as chaves de `en.ts`.
 * O teste em `i18n.test.ts` garante essa completude.
 * O documento passa a dir="rtl" com este idioma (ver getLocaleDirection).
 */
import type { Messages } from "./en.ts";

export const ar: Messages = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "لوحة التحكم",
  "nav.products": "المنتجات",
  "nav.orders": "الطلبات",
  "nav.customers": "العملاء",
  "nav.delivery": "التوصيل",
  "nav.reports": "التقارير",
  "nav.settings": "الإعدادات",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "فتح التنقل",
  "shell.closeMenu": "إغلاق التنقل",
  "shell.signOut": "تسجيل الخروج",
  "shell.signedInAs": "تم تسجيل الدخول باسم",
  "shell.store": "المتجر",
  "shell.phase": "المرحلة 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "تسجيل الدخول إلى إيكاني",
  "auth.loginSubtitle": "أدر متجرك ومنتجاتك وطلباتك.",
  "auth.signupTitle": "أنشئ حسابك في إيكاني",
  "auth.signupSubtitle": "افتح متجرك الإلكتروني في دقائق معدودة.",
  "auth.email": "البريد الإلكتروني",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "كلمة المرور",
  "auth.passwordHint": "٨ أحرف على الأقل",
  "auth.signIn": "تسجيل الدخول",
  "auth.createAccount": "إنشاء حساب",
  "auth.noAccount": "ليس لديك حساب؟",
  "auth.haveAccount": "لديك حساب بالفعل؟",
  "auth.checkEmail":
    "تم إنشاء الحساب. افتح رابط التأكيد الذي أرسلناه إلى {email} ثم سجّل الدخول.",
  "auth.confirmPassword": "تأكيد كلمة المرور",
  "auth.showPassword": "إظهار كلمة المرور",
  "auth.hidePassword": "إخفاء كلمة المرور",
  "auth.google": "المتابعة عبر Google",
  "auth.forgotPassword": "نسيت كلمة المرور؟",
  "auth.forgot.title": "إعادة تعيين كلمة المرور",
  "auth.forgot.subtitle": "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
  "auth.forgot.submit": "إرسال رابط الاسترداد",
  "auth.forgot.checkEmail":
    "إذا كان هناك حساب بهذا البريد الإلكتروني، فقد أرسلنا رابطًا لإعادة تعيين كلمة المرور.",
  "auth.forgot.backToLogin": "العودة إلى تسجيل الدخول",
  "auth.reset.title": "اختر كلمة مرور جديدة",
  "auth.reset.subtitle": "أدخل كلمة مرورك الجديدة وأكدتها.",
  "auth.reset.newPassword": "كلمة مرور جديدة",
  "auth.reset.confirmPassword": "تأكيد كلمة المرور الجديدة",
  "auth.reset.submit": "إعادة تعيين كلمة المرور",
  "auth.reset.success":
    "تمت إعادة تعيين كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.",
  "auth.reset.invalidLink":
    "هذا الرابط غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا.",
  "auth.marketingTagline": "بيع عبر الإنترنت. استقبل الطلبات عبر WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "أدخل بريدك الإلكتروني وكلمة المرور.",
  "auth.error.invalidEmail": "أدخل عنوان بريد إلكتروني صالحًا.",
  "auth.error.weakPassword": "استخدم كلمة مرور من ٨ أحرف على الأقل.",
  "auth.error.invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth.error.emailNotConfirmed":
    "أكّد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد.",
  "auth.error.userAlreadyExists": "يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول.",
  "auth.error.rateLimited": "محاولات كثيرة جدًا. انتظر دقائق ثم حاول مجددًا.",
  "auth.error.loginFailed": "تعذّر تسجيل الدخول. حاول مجددًا.",
  "auth.error.signupFailed": "تعذّر إنشاء الحساب. حاول مجددًا.",
  "auth.error.emailRequired": "أدخل عنوان بريدك الإلكتروني.",
  "auth.error.passwordsMismatch": "كلمتا المرور غير متطابقتين.",
  "auth.error.oauth": "تعذّرت المتابعة عبر Google. حاول مجددًا.",
  "auth.error.passwordResetFailed":
    "تعذّر إرسال بريد الاسترداد. حاول مجددًا.",
  "auth.error.updatePasswordFailed":
    "تعذّر تحديث كلمة المرور. حاول مجددًا.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "أنشئ متجرك",
  "onboarding.subtitle":
    "اختر اسمًا وعنوانًا ويب. يمكنك تغييرهما لاحقًا من الإعدادات.",
  "onboarding.name": "اسم المتجر",
  "onboarding.namePlaceholder": "ماريا فاشن",
  "onboarding.slug": "عنوان المتجر",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "أحرف وأرقام وشرطات. الرابط المستقبلي: {url}",
  "onboarding.whatsapp": "رقم WhatsApp",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "سيرسل العملاء طلباتهم إلى هذا الرقم.",
  "onboarding.country": "الدولة",
  "onboarding.language": "اللغة",
  "onboarding.languageHelp": "لغة متجرك — مستقلة عن الدولة والعملة.",
  "onboarding.currency": "العملة",
  "onboarding.description": "الوصف",
  "onboarding.descriptionPlaceholder": "ماذا يبيع متجرك؟",
  "onboarding.timezone": "المنطقة الزمنية",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "رمز الدولة للهاتف",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "إنشاء المتجر",
  "onboarding.submitting": "جارٍ الإنشاء…",
  "onboarding.selectPlaceholder": "اختر…",
  "onboarding.none": "غير محدد",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "أدخل اسم المتجر (حرفان على الأقل).",
  "store.error.nameTooLong": "لا يمكن أن يتجاوز الاسم ٨٠ حرفًا.",
  "store.error.slugEmpty": "أدخل عنوان المتجر.",
  "store.error.slugTooShort": "استخدم {min} أحرف على الأقل.",
  "store.error.slugTooLong": "استخدم {max} حرفًا كحد أقصى.",
  "store.error.slugInvalid":
    "استخدم أحرفًا صغيرة وأرقامًا وشرطات فقط (بدون مسافات، وبدون شرطة في البداية أو النهاية).",
  "store.error.slugReserved": "هذا العنوان محجوز. اختر عنوانًا آخر.",
  "store.error.slugTaken": "هذا العنوان مستخدم بالفعل. اختر عنوانًا آخر.",
  "store.error.whatsappInvalid":
    "رقم WhatsApp غير صالح. استخدم أرقامًا فقط، مثل ‎+258841234567.",
  "store.error.phoneInvalid": "رقم الهاتف غير صالح.",
  "store.error.phoneCodeInvalid": "رمز الدولة غير صالح، مثل ‎+258.",
  "store.error.countryInvalid": "اختر دولة صالحة.",
  "store.error.languageInvalid": "اختر لغة صالحة.",
  "store.error.currencyInvalid": "اختر عملة صالحة.",
  "store.error.timezoneInvalid": "المنطقة الزمنية غير صالحة، مثل Africa/Maputo.",
  "store.error.descriptionTooLong": "لا يمكن أن يتجاوز الوصف ٥٠٠ حرف.",
  "store.error.primaryColorInvalid": "استخدم لونًا بصيغة hex مثل ‎#0f172a.",
  "store.sectionOptional": "تفاصيل اختيارية",
  "store.error.createFailed": "تعذّر إنشاء المتجر. حاول مجددًا.",
  "store.error.alreadyExists": "لديك متجر بالفعل.",
  "store.error.saveFailed": "تعذّر حفظ التغييرات. حاول مجددًا.",
  "store.error.sessionInvalid": "انتهت جلستك. سجّل الدخول مرة أخرى.",
  "store.error.lookupFailed": "تعذّر التحقق من العنوان. حاول مجددًا.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "لوحة التحكم",
  "dashboard.subtitle": "نظرة عامة على متجرك.",
  "dashboard.storeCard": "المتجر",
  "dashboard.summary": "الملخص",
  "dashboard.products": "المنتجات",
  "dashboard.orders": "الطلبات",
  "dashboard.customers": "العملاء",
  "dashboard.summaryPlaceholder": "متاح في مرحلة لاحقة",
  "dashboard.status": "الحالة",
  "dashboard.statusActive": "نشط",
  "dashboard.statusInactive": "غير نشط",
  "dashboard.storeName": "اسم المتجر",
  "dashboard.slug": "العنوان",
  "dashboard.currency": "العملة",
  "dashboard.language": "اللغة",
  "dashboard.country": "الدولة",
  "dashboard.timezone": "المنطقة الزمنية",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "الرابط العام",
  "dashboard.notSet": "غير محدد",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "الإعدادات",
  "settings.subtitle": "حدّث معلومات متجرك.",
  "settings.sectionStore": "تفاصيل المتجر",
  "settings.sectionLocalization": "اللغة والموقع",
  "settings.sectionContact": "التواصل",
  "settings.sectionAppearance": "المظهر",
  "settings.primaryColor": "اللون الأساسي",
  "settings.logo": "الشعار",
  "settings.logoPending":
    "رفع الشعار يصل في مرحلة لاحقة — مساحة التخزين جاهزة بالفعل.",
  "settings.save": "حفظ التغييرات",
  "settings.saving": "جارٍ الحفظ…",
  "settings.saved": "تم حفظ الإعدادات.",
  "settings.slugImmutable": "لا يمكن تغيير عنوان المتجر بعد.",
  "settings.currencyPreview": "مثال: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "قريبًا",
  "common.comingSoon": "قريبًا",
  "common.comingSoonBody":
    "{section} قيد البناء في مرحلة لاحقة. الأساس جاهز.",
  "common.loading": "جارٍ التحميل…",
  "common.optional": "اختياري",
  "common.backHome": "العودة إلى الصفحة الرئيسية",
  "common.backToDashboard": "العودة إلى لوحة التحكم",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "هذا المتجر قيد التحضير",
  "storefront.comingSoonBody":
    "المنتجات وسلة التسوق والدفع عبر WhatsApp تصل في المراحل القادمة.",
  "storefront.notFound": "المتجر غير موجود",
  "storefront.visitApp": "لوحة تحكم التاجر",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "حدث خطأ ما",
  "error.body": "حدث خطأ غير متوقع. حاول مجددًا.",
  "error.retry": "إعادة المحاولة",
  "notFound.title": "الصفحة غير موجودة",
  "notFound.body": "الصفحة التي تبحث عنها غير موجودة.",

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "المظهر",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "إلغاء",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "استخدم رابطًا كاملًا، مثل ‎https://…",
  "store.error.openingHoursTooLong": "لا يمكن أن يتجاوز مواعيد العمل ٣٠٠ حرف.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "معلومات المتجر",
  "settings.sectionStorefrontHelp":
    "ما يراه العملاء في متجرك العام. لا يُترجم محتوى التاجر تلقائيًا أبدًا.",
  "settings.bannerUrl": "رابط صورة الغلاف",
  "settings.openingHours": "مواعيد العمل",
  "settings.openingHoursPlaceholder": "الاثنين–الجمعة ٨:٠٠–١٨:٠٠\nالسبت ٨:٠٠–١٣:٠٠",
  "settings.instagramUrl": "رابط Instagram",
  "settings.facebookUrl": "رابط Facebook",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "المظهر",
  "appearance.subtitle":
    "اختر القالب والألوان وتنسيق الكتالوج لمتجرك.",
  "appearance.template": "القالب",
  "appearance.templateHelp":
    "القالب يغيّر العرض فقط — الشراء والسلة والإتمام تعمل بنفس الطريقة في الجميع.",
  "appearance.templateMinimal": "بسيط",
  "appearance.templateMinimalDesc": "نظيف وفسيح، صور منتجات كبيرة.",
  "appearance.templateMarket": "سوق",
  "appearance.templateMarketDesc": "شبكة كثيفة، أسعار بارزة، عملي.",
  "appearance.templateFashion": "أزياء",
  "appearance.templateFashionDesc": "طابع تحريري، مسافات أنيقة.",
  "appearance.templateRestaurant": "مطعم",
  "appearance.templateRestaurantDesc": "كتالوج مدمج يشبه قائمة الطعام.",
  "appearance.colors": "الألوان",
  "appearance.colorsHelp":
    "يظل النص مقروءًا تلقائيًا — نضبطه حسب خلفيتك.",
  "appearance.primaryColor": "اللون الأساسي",
  "appearance.buttonColor": "لون الأزرار",
  "appearance.accentColor": "لون التمييز",
  "appearance.backgroundColor": "لون الخلفية",
  "appearance.catalog": "الكتالوج",
  "appearance.productLayout": "تنسيق المنتجات",
  "appearance.layoutGrid": "شبكة",
  "appearance.layoutGridDesc": "بطاقات منتجات في شبكة متجاوبة.",
  "appearance.layoutList": "قائمة",
  "appearance.layoutListDesc": "صفوف مدمجة: الصورة والتفاصيل وزر الإضافة.",
  "appearance.imageRatio": "صور المنتجات",
  "appearance.imageSquare": "مربعة",
  "appearance.imagePortrait": "طولي",
  "appearance.imageLandscape": "عرضي",
  "appearance.buttonStyle": "نمط الأزرار",
  "appearance.buttonRounded": "دائري",
  "appearance.buttonSoft": "ناعم",
  "appearance.buttonCompact": "مدمج",
  "appearance.cardStyle": "نمط البطاقات",
  "appearance.cardSubtle": "خفيف",
  "appearance.cardRounded": "دائري",
  "appearance.cardMinimal": "بسيط",
  "appearance.preview": "معاينة مباشرة",
  "appearance.previewDevice": "جهاز المعاينة",
  "appearance.previewMobile": "جوال",
  "appearance.previewDesktop": "سطح المكتب",
  "appearance.previewHint":
    "تستخدم المعاينة منتجاتك الحقيقية. انشرها بحفظ الإعدادات.",
  "appearance.save": "حفظ المظهر",
  "appearance.saving": "جارٍ الحفظ…",
  "appearance.saved": "تم حفظ المظهر.",
  "appearance.viewStore": "عرض المتجر",
  "appearance.error.optionInvalid": "اختر خيارات صالحة.",
  "appearance.error.colorInvalid": "استخدم ألوانًا بصيغة hex مثل ‎#2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "البحث عن منتجات…",
  "storefront.categories": "الفئات",
  "storefront.allProducts": "كل المنتجات",
  "storefront.featured": "مميز",
  "storefront.addToCart": "أضف إلى السلة",
  "storefront.unavailable": "غير متوفر",
  "storefront.noProducts": "لا توجد منتجات بعد",
  "storefront.noProductsBody": "لم يضف المتجر منتجات بعد.",
  "storefront.noResults": "لم يتم العثور على منتجات",
  "storefront.noResultsBody": "جرّب بحثًا أو فئة أخرى.",
  "storefront.cart": "السلة",
  "storefront.cartEmpty": "سلتك فارغة",
  "storefront.cartEmptyBody": "أضف منتجات لإتمام الطلب.",
  "storefront.orderWhatsApp": "اطلب عبر WhatsApp",
  "storefront.subtotal": "المجموع الفرعي",
  "storefront.increaseQty": "زيادة الكمية",
  "storefront.decreaseQty": "تقليل الكمية",
  "storefront.removeItem": "إزالة العنصر",
  "storefront.itemQuantity": "الكمية",
  "storefront.storeInfo": "معلومات المتجر",
  "storefront.delivery": "التوصيل",
  "storefront.deliveryBody": "تُؤكد خيارات التوصيل عبر WhatsApp.",
  "storefront.contact": "التواصل",
  "storefront.openingHours": "مواعيد العمل",
  "storefront.followUs": "تابعنا",
  "storefront.openCartAria": "فتح السلة",
  "storefront.cartCountAria": "عدد عناصر السلة",
  "storefront.productImageAlt": "صورة المنتج",
  "storefront.noImageAlt": "منتج بدون صورة",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "أدر منتجات متجرك.",
  "products.new": "منتج جديد",
  "products.newSubtitle": "أضف منتجًا إلى كتالوجك.",
  "products.empty": "لا توجد منتجات بعد",
  "products.emptyBody": "أنشئ منتجك الأول لملء متجرك.",
  "products.edit": "تعديل المنتج",
  "products.name": "الاسم",
  "products.namePlaceholder": "قميص كتاني أزرق",
  "products.description": "الوصف",
  "products.descriptionPlaceholder": "الخامة والمقاسات والتفاصيل…",
  "products.price": "السعر",
  "products.promoPrice": "السعر الترويجي",
  "products.promoPriceHint": "يظهر بدل السعر عند تعيينه.",
  "products.category": "الفئة",
  "products.image": "رابط الصورة",
  "products.imageHint": "رابط صورة المنتج (‎https://…).",
  "products.imagePreview": "معاينة الصورة",
  "products.available": "متوفر",
  "products.unavailable": "غير متوفر",
  "products.featured": "مميز",
  "products.featuredHint":
    "تظهر المنتجات المميزة قبل الكتالوج الرئيسي.",
  "products.noCategory": "بدون فئة",
  "products.save": "حفظ التغييرات",
  "products.saved": "تم حفظ المنتج.",
  "products.create": "إنشاء المنتج",
  "products.delete": "حذف",
  "products.deleteConfirm": "هل تريد حذف المنتج “{name}”؟",
  "products.moveUp": "تحريك لأعلى",
  "products.moveDown": "تحريك لأسفل",
  "products.sectionDetails": "التفاصيل",
  "products.sectionPricing": "الأسعار",
  "products.sectionOrganization": "التنظيم",
  "products.error.nameRequired": "أدخل اسم المنتج.",
  "products.error.nameTooLong": "لا يمكن أن يتجاوز الاسم ١٢٠ حرفًا.",
  "products.error.descriptionTooLong": "لا يمكن أن يتجاوز الوصف ١٠٠٠ حرف.",
  "products.error.priceInvalid": "أدخل سعرًا صالحًا، مثل ‎1000‎ أو ‎999.99.",
  "products.error.promoPriceInvalid": "أدخل سعرًا ترويجيًا صالحًا.",
  "products.error.promoPriceNotBelow": "يجب أن يكون السعر الترويجي أقل من السعر.",
  "products.error.imageInvalid": "استخدم رابطًا كاملًا (‎https://…) أو مسارًا في الموقع (‎/…).",
  "products.error.categoryInvalid": "اختر فئة من متجرك.",
  "products.error.createFailed": "تعذّر إنشاء المنتج. حاول مجددًا.",
  "products.error.saveFailed": "تعذّر حفظ التغييرات. حاول مجددًا.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "الفئات",
  "categories.subtitle": "نظّم كتالوجك في فئات.",
  "categories.new": "فئة جديدة",
  "categories.newSubtitle": "تظهر الفئات كعوامل تصفية في المتجر.",
  "categories.name": "الاسم",
  "categories.namePlaceholder": "قمصان",
  "categories.add": "إضافة",
  "categories.save": "حفظ",
  "categories.saved": "تم حفظ الفئة.",
  "categories.created": "تم إنشاء الفئة.",
  "categories.empty": "لا توجد فئات بعد.",
  "categories.listHint":
    "أعد التسمية أو رتّب أو فعّل أو احذف. تُخفى الفئات غير النشطة عن المتجر.",
  "categories.active": "نشطة",
  "categories.delete": "حذف",
  "categories.deleteConfirm": "هل تريد حذف الفئة “{name}”؟ تُحتفظ بالمنتجات.",
  "categories.moveUp": "تحريك لأعلى",
  "categories.moveDown": "تحريك لأسفل",
  "categories.error.nameRequired": "أدخل اسم الفئة.",
  "categories.error.nameTooLong": "لا يمكن أن يتجاوز الاسم ٦٠ حرفًا.",
  "categories.error.createFailed": "تعذّر إنشاء الفئة. حاول مجددًا.",
  "categories.error.saveFailed": "تعذّر حفظ التغييرات. حاول مجددًا.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "اللغة",
  "locale.changeLanguage": "تغيير لغة الواجهة",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "لغة الواجهة",
  "settings.uiLanguageHelp":
    "لغة منصة إيكاني — مستقلة عن لغة وعملة متجرك.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "التنقل الرئيسي",
  "landing.footerNav": "روابط التذييل",
  "landing.navFeatures": "المزايا",
  "landing.navHow": "كيف يعمل",
  "landing.signIn": "تسجيل الدخول",
  "landing.createStore": "أنشئ متجرك",
  "landing.openMenu": "فتح القائمة",
  "landing.closeMenu": "إغلاق القائمة",

  "landing.heroTitle1": "بيع عبر الإنترنت.",
  "landing.heroTitle2": "استقبل الطلبات عبر WhatsApp.",
  "landing.heroSubtitle":
    "يمنحك إيكاني واجهة متجر إلكتروني حقيقية لنشاطك الصغير — اعرض منتجاتك واستقبل الطلبات وأدر عملاءك وبِع بأي عملة.",
  "landing.seeHow": "اعرف كيف يعمل",

  "landing.trust1": "متجرك الإلكتروني الخاص",
  "landing.trust2": "منتجات وفئات",
  "landing.trust3": "طلبات عبر WhatsApp",
  "landing.trust4": "أي عملة",
  "landing.trust5": "مصمم للأنشطة الصغيرة",

  "landing.featuresTitle": "متجرك على طريقتك",
  "landing.featuresSubtitle":
    "كل ما تحتاجه لفتح متجرك وبدء البيع — دون مهارات تقنية.",
  "landing.feature1Title": "متجرك الخاص",
  "landing.feature1Body":
    "أنشئ متجرًا إلكترونيًا حقيقيًا بهويتك ومنتجاتك وفئاتك.",
  "landing.feature2Title": "كتالوج بسيط",
  "landing.feature2Body":
    "أضف المنتجات والصور والفئات دون خبرة تقنية.",
  "landing.feature3Title": "طلبات بسيطة",
  "landing.feature3Body":
    "يتصفّح العملاء ويضيفون المنتجات إلى السلة ويرسلون طلبهم عبر WhatsApp.",
  "landing.feature4Title": "عملة مرنة",
  "landing.feature4Body":
    "ابِع بالدولار أو اليورو أو المتكال أو الريال أو أي عملة مدعومة.",
  "landing.feature5Title": "التوصيل",
  "landing.feature5Body":
    "اضبط مناطق وأسعار التوصيل لعملائك.",
  "landing.feature6Title": "أدر كل شيء",
  "landing.feature6Body":
    "المنتجات والطلبات والعملاء وإعدادات المتجر من لوحة تحكم واحدة.",

  "landing.howTitle": "كيف يعمل",
  "landing.howSubtitle": "من الفكرة إلى أول طلب في ثلاث خطوات.",
  "landing.step1Title": "أنشئ متجرك",
  "landing.step1Body": "اضبط معلومات نشاطك.",
  "landing.step2Title": "أضف منتجاتك",
  "landing.step2Body": "أضف الصور والأسعار والفئات.",
  "landing.step3Title": "استقبل الطلبات",
  "landing.step3Body":
    "يشتري العملاء ويرسلون طلبهم عبر WhatsApp.",

  "landing.previewStoreTitle": "متجر إلكتروني حقيقي، لا مجرد قائمة منتجات.",
  "landing.previewStoreBody":
    "يتضمن متجرك ترويسة وفئات وبطاقات منتجات وأسعارًا وبحثًا وسلة — جاهز للمشاركة بمجرد الحفظ.",
  "landing.previewDashTitle": "أدر كل شيء من لوحة واحدة",
  "landing.previewDashBody":
    "المنتجات والطلبات والعملاء والتوصيل وإعدادات المتجر — كلها منظمة في مكان واحد.",
  "landing.colOrder": "الطلب",
  "landing.colItems": "العناصر",
  "landing.colTotal": "الإجمالي",
  "landing.colStatus": "الحالة",
  "landing.statusNew": "جديد",
  "landing.statusConfirmed": "مؤكد",
  "landing.statusDelivered": "تم التسليم",

  "landing.ctaTitle": "هل أنت جاهز لعرض نشاطك عبر الإنترنت؟",
  "landing.ctaBody": "أنشئ متجر إيكاني وابدأ البيع.",

  "landing.footerTagline": "متاجر إلكترونية بطلبات عبر WhatsApp.",
  "landing.footerRights": "© {year} إيكاني. جميع الحقوق محفوظة.",

  "landing.pillOrder": "تم إرسال الطلب عبر WhatsApp",
  "landing.demoItemsOne": "{count} عنصر",
  "landing.demoItemsMany": "{count} عناصر",
};

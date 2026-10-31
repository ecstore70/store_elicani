/**
 * Catálogo em espanhol — cobre todas as chaves de `en.ts`.
 * O teste em `i18n.test.ts` garante essa completude.
 */
import type { Messages } from "./en.ts";

export const es: Messages = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "Panel",
  "nav.products": "Productos",
  "nav.orders": "Pedidos",
  "nav.customers": "Clientes",
  "nav.delivery": "Entrega",
  "nav.reports": "Informes",
  "nav.settings": "Ajustes",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "Abrir navegación",
  "shell.closeMenu": "Cerrar navegación",
  "shell.signOut": "Cerrar sesión",
  "shell.signedInAs": "Sesión iniciada como",
  "shell.store": "Tienda",
  "shell.phase": "Fase 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "Iniciar sesión en Elicani",
  "auth.loginSubtitle": "Gestiona tu tienda, productos y pedidos.",
  "auth.signupTitle": "Crea tu cuenta de Elicani",
  "auth.signupSubtitle": "Abre tu tienda online en pocos minutos.",
  "auth.email": "Correo electrónico",
  "auth.emailPlaceholder": "tu@ejemplo.com",
  "auth.password": "Contraseña",
  "auth.passwordHint": "Mínimo 8 caracteres",
  "auth.signIn": "Iniciar sesión",
  "auth.createAccount": "Crear cuenta",
  "auth.noAccount": "¿No tienes cuenta?",
  "auth.haveAccount": "¿Ya tienes una cuenta?",
  "auth.checkEmail":
    "Cuenta creada. Abre el enlace de confirmación que enviamos a {email} y luego inicia sesión.",
  "auth.confirmPassword": "Confirmar contraseña",
  "auth.showPassword": "Mostrar contraseña",
  "auth.hidePassword": "Ocultar contraseña",
  "auth.google": "Continuar con Google",
  "auth.forgotPassword": "¿Olvidaste tu contraseña?",
  "auth.forgot.title": "Restablecer tu contraseña",
  "auth.forgot.subtitle": "Introduce tu correo y te enviaremos un enlace de restablecimiento.",
  "auth.forgot.submit": "Enviar enlace de recuperación",
  "auth.forgot.checkEmail":
    "Si existe una cuenta con este correo, hemos enviado un enlace para restablecer tu contraseña.",
  "auth.forgot.backToLogin": "Volver a iniciar sesión",
  "auth.reset.title": "Elige una contraseña nueva",
  "auth.reset.subtitle": "Introduce y confirma tu contraseña nueva.",
  "auth.reset.newPassword": "Contraseña nueva",
  "auth.reset.confirmPassword": "Confirmar contraseña nueva",
  "auth.reset.submit": "Restablecer contraseña",
  "auth.reset.success":
    "Contraseña restablecida. Inicia sesión con tu contraseña nueva.",
  "auth.reset.invalidLink":
    "Este enlace no es válido o ha caducado. Solicita uno nuevo.",
  "auth.marketingTagline": "Vende online. Recibe pedidos por WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Introduce tu correo y tu contraseña.",
  "auth.error.invalidEmail": "Introduce un correo electrónico válido.",
  "auth.error.weakPassword": "Usa una contraseña de al menos 8 caracteres.",
  "auth.error.invalidCredentials": "Correo o contraseña incorrectos.",
  "auth.error.emailNotConfirmed":
    "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  "auth.error.userAlreadyExists": "Ya existe una cuenta con este correo. Inicia sesión.",
  "auth.error.rateLimited": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth.error.loginFailed": "No se pudo iniciar sesión. Inténtalo de nuevo.",
  "auth.error.signupFailed": "No se pudo crear la cuenta. Inténtalo de nuevo.",
  "auth.error.emailRequired": "Introduce tu correo electrónico.",
  "auth.error.passwordsMismatch": "Las contraseñas no coinciden.",
  "auth.error.oauth": "No se pudo continuar con Google. Inténtalo de nuevo.",
  "auth.error.passwordResetFailed":
    "No se pudo enviar el correo de recuperación. Inténtalo de nuevo.",
  "auth.error.updatePasswordFailed":
    "No se pudo actualizar la contraseña. Inténtalo de nuevo.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Crea tu tienda",
  "onboarding.subtitle":
    "Elige un nombre y una dirección web. Puedes cambiarlos más tarde en ajustes.",
  "onboarding.name": "Nombre de la tienda",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Dirección de la tienda",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Letras, números y guiones. URL futura: {url}",
  "onboarding.whatsapp": "Número de WhatsApp",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Los clientes enviarán los pedidos a este número.",
  "onboarding.country": "País",
  "onboarding.language": "Idioma",
  "onboarding.languageHelp": "Idioma de tu tienda — independiente del país y de la moneda.",
  "onboarding.currency": "Moneda",
  "onboarding.description": "Descripción",
  "onboarding.descriptionPlaceholder": "¿Qué vende tu tienda?",
  "onboarding.timezone": "Zona horaria",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Prefijo telefónico",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Crear tienda",
  "onboarding.submitting": "Creando…",
  "onboarding.selectPlaceholder": "Seleccionar…",
  "onboarding.none": "Sin definir",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Introduce el nombre de la tienda (mínimo 2 caracteres).",
  "store.error.nameTooLong": "El nombre puede tener como máximo 80 caracteres.",
  "store.error.slugEmpty": "Introduce la dirección de la tienda.",
  "store.error.slugTooShort": "Usa al menos {min} caracteres.",
  "store.error.slugTooLong": "Usa como máximo {max} caracteres.",
  "store.error.slugInvalid":
    "Usa solo letras minúsculas, números y guiones (sin espacios ni guiones al inicio o al final).",
  "store.error.slugReserved": "Esta dirección está reservada. Elige otra.",
  "store.error.slugTaken": "Esta dirección ya está en uso. Elige otra.",
  "store.error.whatsappInvalid":
    "Número de WhatsApp no válido. Usa solo dígitos, por ejemplo +258841234567.",
  "store.error.phoneInvalid": "Número de teléfono no válido.",
  "store.error.phoneCodeInvalid": "Prefijo de país no válido, por ejemplo +258.",
  "store.error.countryInvalid": "Selecciona un país válido.",
  "store.error.languageInvalid": "Selecciona un idioma válido.",
  "store.error.currencyInvalid": "Selecciona una moneda válida.",
  "store.error.timezoneInvalid": "Zona horaria no válida, por ejemplo Africa/Maputo.",
  "store.error.descriptionTooLong": "La descripción puede tener como máximo 500 caracteres.",
  "store.error.primaryColorInvalid": "Usa un color hex como #0f172a.",
  "store.sectionOptional": "Detalles opcionales",
  "store.error.createFailed": "No se pudo crear la tienda. Inténtalo de nuevo.",
  "store.error.alreadyExists": "Ya tienes una tienda.",
  "store.error.saveFailed": "No se pudieron guardar los cambios. Inténtalo de nuevo.",
  "store.error.sessionInvalid": "Tu sesión ha caducado. Inicia sesión de nuevo.",
  "store.error.lookupFailed": "No se pudo verificar la dirección. Inténtalo de nuevo.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Panel",
  "dashboard.subtitle": "Resumen de tu tienda.",
  "dashboard.storeCard": "Tienda",
  "dashboard.summary": "Resumen",
  "dashboard.products": "Productos",
  "dashboard.orders": "Pedidos",
  "dashboard.customers": "Clientes",
  "dashboard.summaryPlaceholder": "Disponible en una fase posterior",
  "dashboard.status": "Estado",
  "dashboard.statusActive": "Activa",
  "dashboard.statusInactive": "Inactiva",
  "dashboard.storeName": "Nombre de la tienda",
  "dashboard.slug": "Dirección",
  "dashboard.currency": "Moneda",
  "dashboard.language": "Idioma",
  "dashboard.country": "País",
  "dashboard.timezone": "Zona horaria",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "URL pública",
  "dashboard.notSet": "Sin definir",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Ajustes",
  "settings.subtitle": "Actualiza la información de tu tienda.",
  "settings.sectionStore": "Datos de la tienda",
  "settings.sectionLocalization": "Localización",
  "settings.sectionContact": "Contacto",
  "settings.sectionAppearance": "Apariencia",
  "settings.primaryColor": "Color principal",
  "settings.logo": "Logo",
  "settings.logoPending":
    "La subida del logo llega en una fase posterior — el almacenamiento ya está preparado.",
  "settings.save": "Guardar cambios",
  "settings.saving": "Guardando…",
  "settings.saved": "Ajustes guardados.",
  "settings.slugImmutable": "La dirección de la tienda todavía no se puede cambiar.",
  "settings.currencyPreview": "Ejemplo: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Pronto",
  "common.comingSoon": "Muy pronto",
  "common.comingSoonBody":
    "{section} se está construyendo en una fase posterior. La base ya está lista.",
  "common.loading": "Cargando…",
  "common.optional": "opcional",
  "common.backHome": "Volver al inicio",
  "common.backToDashboard": "Volver al panel",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "Esta tienda se está preparando",
  "storefront.comingSoonBody":
    "Los productos, el carrito y el pago por WhatsApp llegan en las próximas fases.",
  "storefront.notFound": "Tienda no encontrada",
  "storefront.visitApp": "Panel del comerciante",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "Algo salió mal",
  "error.body": "Ocurrió un error inesperado. Inténtalo de nuevo.",
  "error.retry": "Inténtalo de nuevo",
  "notFound.title": "Página no encontrada",
  "notFound.body": "La página que buscas no existe.",

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "Apariencia",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "Cancelar",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "Usa un enlace completo, por ejemplo https://…",
  "store.error.openingHoursTooLong": "El horario puede tener como máximo 300 caracteres.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Información de la tienda",
  "settings.sectionStorefrontHelp":
    "Lo que ven los clientes en tu tienda pública. El contenido del comerciante nunca se traduce automáticamente.",
  "settings.bannerUrl": "URL de la imagen de portada",
  "settings.openingHours": "Horario",
  "settings.openingHoursPlaceholder": "Lun–Vie 8:00–18:00\nSáb 8:00–13:00",
  "settings.instagramUrl": "Enlace de Instagram",
  "settings.facebookUrl": "Enlace de Facebook",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Apariencia",
  "appearance.subtitle":
    "Elige la plantilla, los colores y el diseño del catálogo de tu tienda.",
  "appearance.template": "Plantilla",
  "appearance.templateHelp":
    "La plantilla solo cambia la presentación — comprar, el carrito y pedir funcionan igual en todas.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Limpia y espaciosa, imágenes de producto grandes.",
  "appearance.templateMarket": "Mercado",
  "appearance.templateMarketDesc": "Cuadrícula densa, precios destacados, práctica.",
  "appearance.templateFashion": "Moda",
  "appearance.templateFashionDesc": "Estilo editorial, espaciado elegante.",
  "appearance.templateRestaurant": "Restaurante",
  "appearance.templateRestaurantDesc": "Catálogo compacto tipo menú.",
  "appearance.colors": "Colores",
  "appearance.colorsHelp":
    "El texto sigue siendo legible automáticamente — lo adaptamos a tu fondo.",
  "appearance.primaryColor": "Color principal",
  "appearance.buttonColor": "Color de los botones",
  "appearance.accentColor": "Color de acento",
  "appearance.backgroundColor": "Color de fondo",
  "appearance.catalog": "Catálogo",
  "appearance.productLayout": "Diseño de productos",
  "appearance.layoutGrid": "Cuadrícula",
  "appearance.layoutGridDesc": "Fichas de producto en una cuadrícula adaptable.",
  "appearance.layoutList": "Lista",
  "appearance.layoutListDesc": "Filas compactas: imagen, detalles y botón de añadir.",
  "appearance.imageRatio": "Imágenes de producto",
  "appearance.imageSquare": "Cuadrada",
  "appearance.imagePortrait": "Vertical",
  "appearance.imageLandscape": "Horizontal",
  "appearance.buttonStyle": "Estilo de botones",
  "appearance.buttonRounded": "Redondeado",
  "appearance.buttonSoft": "Suave",
  "appearance.buttonCompact": "Compacto",
  "appearance.cardStyle": "Estilo de fichas",
  "appearance.cardSubtle": "Sutil",
  "appearance.cardRounded": "Redondeado",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Vista previa en vivo",
  "appearance.previewDevice": "Dispositivo de vista previa",
  "appearance.previewMobile": "Móvil",
  "appearance.previewDesktop": "Escritorio",
  "appearance.previewHint":
    "La vista previa usa tus productos reales. Publica guardando.",
  "appearance.save": "Guardar apariencia",
  "appearance.saving": "Guardando…",
  "appearance.saved": "Apariencia guardada.",
  "appearance.viewStore": "Ver tienda",
  "appearance.error.optionInvalid": "Elige opciones válidas.",
  "appearance.error.colorInvalid": "Usa colores hex como #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Buscar productos…",
  "storefront.categories": "Categorías",
  "storefront.allProducts": "Todos los productos",
  "storefront.featured": "Destacados",
  "storefront.addToCart": "Añadir al carrito",
  "storefront.unavailable": "No disponible",
  "storefront.noProducts": "Aún no hay productos",
  "storefront.noProductsBody": "La tienda aún no ha añadido productos.",
  "storefront.noResults": "No se encontraron productos",
  "storefront.noResultsBody": "Prueba otra búsqueda o categoría.",
  "storefront.cart": "Carrito",
  "storefront.cartEmpty": "Tu carrito está vacío",
  "storefront.cartEmptyBody": "Añade productos para hacer un pedido.",
  "storefront.orderWhatsApp": "Pedir por WhatsApp",
  "storefront.subtotal": "Subtotal",
  "storefront.increaseQty": "Aumentar cantidad",
  "storefront.decreaseQty": "Reducir cantidad",
  "storefront.removeItem": "Quitar artículo",
  "storefront.itemQuantity": "Cantidad",
  "storefront.storeInfo": "Información de la tienda",
  "storefront.delivery": "Entrega",
  "storefront.deliveryBody": "Las opciones de entrega se confirman por WhatsApp.",
  "storefront.contact": "Contacto",
  "storefront.openingHours": "Horario",
  "storefront.followUs": "Síguenos",
  "storefront.openCartAria": "Abrir carrito",
  "storefront.cartCountAria": "Artículos en el carrito",
  "storefront.productImageAlt": "Imagen del producto",
  "storefront.noImageAlt": "Producto sin imagen",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Gestiona los productos de tu tienda.",
  "products.new": "Nuevo producto",
  "products.newSubtitle": "Añade un producto a tu catálogo.",
  "products.empty": "Aún no hay productos",
  "products.emptyBody": "Crea tu primer producto para llenar la tienda.",
  "products.edit": "Editar producto",
  "products.name": "Nombre",
  "products.namePlaceholder": "Camisa de lino azul",
  "products.description": "Descripción",
  "products.descriptionPlaceholder": "Materiales, tallas, detalles…",
  "products.price": "Precio",
  "products.promoPrice": "Precio promocional",
  "products.promoPriceHint": "Se muestra en lugar del precio cuando está definido.",
  "products.category": "Categoría",
  "products.image": "URL de la imagen",
  "products.imageHint": "Enlace a la foto del producto (https://…).",
  "products.imagePreview": "Vista previa de la imagen",
  "products.available": "Disponible",
  "products.unavailable": "No disponible",
  "products.featured": "Destacado",
  "products.featuredHint":
    "Los productos destacados aparecen antes del catálogo principal.",
  "products.noCategory": "Sin categoría",
  "products.save": "Guardar cambios",
  "products.saved": "Producto guardado.",
  "products.create": "Crear producto",
  "products.delete": "Eliminar",
  "products.deleteConfirm": "¿Eliminar el producto “{name}”?",
  "products.moveUp": "Subir",
  "products.moveDown": "Bajar",
  "products.sectionDetails": "Detalles",
  "products.sectionPricing": "Precios",
  "products.sectionOrganization": "Organización",
  "products.error.nameRequired": "Introduce el nombre del producto.",
  "products.error.nameTooLong": "El nombre puede tener como máximo 120 caracteres.",
  "products.error.descriptionTooLong": "La descripción puede tener como máximo 1000 caracteres.",
  "products.error.priceInvalid": "Introduce un precio válido, por ejemplo 1000 o 999.99.",
  "products.error.promoPriceInvalid": "Introduce un precio promocional válido.",
  "products.error.promoPriceNotBelow": "El precio promocional debe ser inferior al precio.",
  "products.error.imageInvalid": "Usa un enlace completo (https://…) o una ruta del sitio (/…).",
  "products.error.categoryInvalid": "Elige una categoría de tu tienda.",
  "products.error.createFailed": "No se pudo crear el producto. Inténtalo de nuevo.",
  "products.error.saveFailed": "No se pudieron guardar los cambios. Inténtalo de nuevo.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Categorías",
  "categories.subtitle": "Organiza tu catálogo en categorías.",
  "categories.new": "Nueva categoría",
  "categories.newSubtitle": "Las categorías aparecen como filtros en la tienda.",
  "categories.name": "Nombre",
  "categories.namePlaceholder": "Camisas",
  "categories.add": "Añadir",
  "categories.save": "Guardar",
  "categories.saved": "Categoría guardada.",
  "categories.created": "Categoría creada.",
  "categories.empty": "Aún no hay categorías.",
  "categories.listHint":
    "Renombra, reordena, activa o elimina. Las categorías inactivas se ocultan en la tienda.",
  "categories.active": "Activa",
  "categories.delete": "Eliminar",
  "categories.deleteConfirm": "¿Eliminar la categoría “{name}”? Los productos se conservan.",
  "categories.moveUp": "Subir",
  "categories.moveDown": "Bajar",
  "categories.error.nameRequired": "Introduce el nombre de la categoría.",
  "categories.error.nameTooLong": "El nombre puede tener como máximo 60 caracteres.",
  "categories.error.createFailed": "No se pudo crear la categoría. Inténtalo de nuevo.",
  "categories.error.saveFailed": "No se pudieron guardar los cambios. Inténtalo de nuevo.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Idioma",
  "locale.changeLanguage": "Cambiar el idioma de la interfaz",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Idioma de la interfaz",
  "settings.uiLanguageHelp":
    "Idioma de la plataforma Elicani — independiente del idioma y la moneda de tu tienda.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Navegación principal",
  "landing.footerNav": "Enlaces del pie de página",
  "landing.navFeatures": "Funciones",
  "landing.navHow": "Cómo funciona",
  "landing.signIn": "Iniciar sesión",
  "landing.createStore": "Crea tu tienda",
  "landing.openMenu": "Abrir menú",
  "landing.closeMenu": "Cerrar menú",

  "landing.heroTitle1": "Vende online.",
  "landing.heroTitle2": "Recibe pedidos por WhatsApp.",
  "landing.heroSubtitle":
    "Elicani ofrece a las pequeñas negocios una tienda online de verdad — muestra tus productos, recibe pedidos, gestiona clientes y vende en cualquier moneda.",
  "landing.seeHow": "Descubre cómo funciona",

  "landing.trust1": "Tu propia tienda online",
  "landing.trust2": "Productos y categorías",
  "landing.trust3": "Pedidos por WhatsApp",
  "landing.trust4": "Cualquier moneda",
  "landing.trust5": "Hecho para pequeños negocios",

  "landing.featuresTitle": "Tu tienda, a tu manera",
  "landing.featuresSubtitle":
    "Todo lo que necesitas para abrir tu tienda y empezar a vender — sin conocimientos técnicos.",
  "landing.feature1Title": "Tu propia tienda",
  "landing.feature1Body":
    "Crea una tienda online de verdad con tu propia identidad, productos y categorías.",
  "landing.feature2Title": "Catálogo sencillo",
  "landing.feature2Body":
    "Añade productos, imágenes, precios y categorías sin conocimientos técnicos.",
  "landing.feature3Title": "Pedidos sin complicaciones",
  "landing.feature3Body":
    "Los clientes exploran, añaden productos al carrito y envían su pedido por WhatsApp.",
  "landing.feature4Title": "Moneda flexible",
  "landing.feature4Body":
    "Vende en USD, EUR, MZN, BRL u otra moneda compatible.",
  "landing.feature5Title": "Entrega",
  "landing.feature5Body":
    "Configura zonas y tarifas de entrega para tus clientes.",
  "landing.feature6Title": "Gestiona todo",
  "landing.feature6Body":
    "Productos, pedidos, clientes y ajustes de la tienda desde un solo panel.",

  "landing.howTitle": "Cómo funciona",
  "landing.howSubtitle": "De la idea al primer pedido en tres pasos.",
  "landing.step1Title": "Crea tu tienda",
  "landing.step1Body": "Configura la información de tu negocio.",
  "landing.step2Title": "Añade tus productos",
  "landing.step2Body": "Añade fotos, precios y categorías.",
  "landing.step3Title": "Recibe pedidos",
  "landing.step3Body":
    "Los clientes compran y envían su pedido por WhatsApp.",

  "landing.previewStoreTitle": "Una tienda online de verdad, no solo una lista de productos.",
  "landing.previewStoreBody":
    "Tu tienda incluye cabecera, categorías, fichas de producto, precios, búsqueda y carrito — lista para compartir en cuanto guardes.",
  "landing.previewDashTitle": "Gestiona todo desde un panel",
  "landing.previewDashBody":
    "Productos, pedidos, clientes, entrega y ajustes de la tienda — organizados en un solo lugar.",
  "landing.colOrder": "Pedido",
  "landing.colItems": "Artículos",
  "landing.colTotal": "Total",
  "landing.colStatus": "Estado",
  "landing.statusNew": "Nuevo",
  "landing.statusConfirmed": "Confirmado",
  "landing.statusDelivered": "Entregado",

  "landing.ctaTitle": "¿Listo para poner tu negocio online?",
  "landing.ctaBody": "Crea tu tienda Elicani y empieza a vender.",

  "landing.footerTagline": "Tiendas online con pedidos por WhatsApp.",
  "landing.footerRights": "© {year} Elicani. Todos los derechos reservados.",

  "landing.pillOrder": "Pedido enviado por WhatsApp",
  "landing.demoItemsOne": "{count} artículo",
  "landing.demoItemsMany": "{count} artículos",
};

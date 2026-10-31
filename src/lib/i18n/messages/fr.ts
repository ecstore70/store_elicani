/**
 * Catálogo em francês — cobre todas as chaves de `en.ts`.
 * O teste em `i18n.test.ts` garante essa completude.
 */
import type { Messages } from "./en.ts";

export const fr: Messages = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "Tableau de bord",
  "nav.products": "Produits",
  "nav.orders": "Commandes",
  "nav.customers": "Clients",
  "nav.delivery": "Livraison",
  "nav.reports": "Rapports",
  "nav.settings": "Paramètres",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "Ouvrir la navigation",
  "shell.closeMenu": "Fermer la navigation",
  "shell.signOut": "Se déconnecter",
  "shell.signedInAs": "Connecté en tant que",
  "shell.store": "Boutique",
  "shell.phase": "Phase 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "Se connecter à Elicani",
  "auth.loginSubtitle": "Gérez votre boutique, vos produits et vos commandes.",
  "auth.signupTitle": "Créez votre compte Elicani",
  "auth.signupSubtitle": "Ouvrez votre boutique en ligne en quelques minutes.",
  "auth.email": "Adresse e-mail",
  "auth.emailPlaceholder": "vous@exemple.com",
  "auth.password": "Mot de passe",
  "auth.passwordHint": "8 caractères minimum",
  "auth.signIn": "Se connecter",
  "auth.createAccount": "Créer un compte",
  "auth.noAccount": "Vous n'avez pas de compte ?",
  "auth.haveAccount": "Vous avez déjà un compte ?",
  "auth.checkEmail":
    "Compte créé. Ouvrez le lien de confirmation envoyé à {email}, puis connectez-vous.",
  "auth.confirmPassword": "Confirmer le mot de passe",
  "auth.showPassword": "Afficher le mot de passe",
  "auth.hidePassword": "Masquer le mot de passe",
  "auth.google": "Continuer avec Google",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.forgot.title": "Réinitialiser votre mot de passe",
  "auth.forgot.subtitle": "Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.",
  "auth.forgot.submit": "Envoyer le lien de récupération",
  "auth.forgot.checkEmail":
    "Si un compte existe avec cet e-mail, nous avons envoyé un lien pour réinitialiser votre mot de passe.",
  "auth.forgot.backToLogin": "Retour à la connexion",
  "auth.reset.title": "Choisissez un nouveau mot de passe",
  "auth.reset.subtitle": "Saisissez et confirmez votre nouveau mot de passe.",
  "auth.reset.newPassword": "Nouveau mot de passe",
  "auth.reset.confirmPassword": "Confirmer le nouveau mot de passe",
  "auth.reset.submit": "Réinitialiser le mot de passe",
  "auth.reset.success":
    "Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.",
  "auth.reset.invalidLink":
    "Ce lien est invalide ou a expiré. Demandez-en un nouveau.",
  "auth.marketingTagline": "Vendez en ligne. Recevez les commandes sur WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Saisissez votre e-mail et votre mot de passe.",
  "auth.error.invalidEmail": "Saisissez une adresse e-mail valide.",
  "auth.error.weakPassword": "Utilisez un mot de passe d'au moins 8 caractères.",
  "auth.error.invalidCredentials": "E-mail ou mot de passe incorrects.",
  "auth.error.emailNotConfirmed":
    "Confirmez votre e-mail avant de vous connecter. Vérifiez votre boîte de réception.",
  "auth.error.userAlreadyExists": "Un compte existe déjà avec cet e-mail. Connectez-vous.",
  "auth.error.rateLimited": "Trop de tentatives. Attendez quelques minutes et réessayez.",
  "auth.error.loginFailed": "Impossible de se connecter. Veuillez réessayer.",
  "auth.error.signupFailed": "Impossible de créer le compte. Veuillez réessayer.",
  "auth.error.emailRequired": "Saisissez votre adresse e-mail.",
  "auth.error.passwordsMismatch": "Les mots de passe ne correspondent pas.",
  "auth.error.oauth": "Impossible de continuer avec Google. Veuillez réessayer.",
  "auth.error.passwordResetFailed":
    "Impossible d'envoyer l'e-mail de récupération. Veuillez réessayer.",
  "auth.error.updatePasswordFailed":
    "Impossible de mettre à jour le mot de passe. Veuillez réessayer.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Créez votre boutique",
  "onboarding.subtitle":
    "Choisissez un nom et une adresse web. Vous pourrez les modifier plus tard dans les paramètres.",
  "onboarding.name": "Nom de la boutique",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Adresse de la boutique",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Lettres, chiffres et tirets. URL future : {url}",
  "onboarding.whatsapp": "Numéro WhatsApp",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Les clients enverront leurs commandes à ce numéro.",
  "onboarding.country": "Pays",
  "onboarding.language": "Langue",
  "onboarding.languageHelp": "Langue de votre boutique — indépendante du pays et de la devise.",
  "onboarding.currency": "Devise",
  "onboarding.description": "Description",
  "onboarding.descriptionPlaceholder": "Que vend votre boutique ?",
  "onboarding.timezone": "Fuseau horaire",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Indicatif du pays",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Créer la boutique",
  "onboarding.submitting": "Création…",
  "onboarding.selectPlaceholder": "Sélectionner…",
  "onboarding.none": "Non défini",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Saisissez le nom de la boutique (2 caractères minimum).",
  "store.error.nameTooLong": "Le nom ne peut pas dépasser 80 caractères.",
  "store.error.slugEmpty": "Saisissez l'adresse de la boutique.",
  "store.error.slugTooShort": "Utilisez au moins {min} caractères.",
  "store.error.slugTooLong": "Utilisez au maximum {max} caractères.",
  "store.error.slugInvalid":
    "Utilisez uniquement des minuscules, des chiffres et des tirets (sans espaces, ni tiret en début ou fin).",
  "store.error.slugReserved": "Cette adresse est réservée. Choisissez-en une autre.",
  "store.error.slugTaken": "Cette adresse est déjà utilisée. Choisissez-en une autre.",
  "store.error.whatsappInvalid":
    "Numéro WhatsApp invalide. Utilisez uniquement des chiffres, ex. +258841234567.",
  "store.error.phoneInvalid": "Numéro de téléphone invalide.",
  "store.error.phoneCodeInvalid": "Indicatif de pays invalide, ex. +258.",
  "store.error.countryInvalid": "Sélectionnez un pays valide.",
  "store.error.languageInvalid": "Sélectionnez une langue valide.",
  "store.error.currencyInvalid": "Sélectionnez une devise valide.",
  "store.error.timezoneInvalid": "Fuseau horaire invalide, ex. Africa/Maputo.",
  "store.error.descriptionTooLong": "La description ne peut pas dépasser 500 caractères.",
  "store.error.primaryColorInvalid": "Utilisez une couleur hexadécimale comme #0f172a.",
  "store.sectionOptional": "Détails facultatifs",
  "store.error.createFailed": "Impossible de créer la boutique. Veuillez réessayer.",
  "store.error.alreadyExists": "Vous avez déjà une boutique.",
  "store.error.saveFailed": "Impossible d'enregistrer les modifications. Veuillez réessayer.",
  "store.error.sessionInvalid": "Votre session a expiré. Reconnectez-vous.",
  "store.error.lookupFailed": "Impossible de vérifier l'adresse. Veuillez réessayer.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Tableau de bord",
  "dashboard.subtitle": "Aperçu de votre boutique.",
  "dashboard.storeCard": "Boutique",
  "dashboard.summary": "Résumé",
  "dashboard.products": "Produits",
  "dashboard.orders": "Commandes",
  "dashboard.customers": "Clients",
  "dashboard.summaryPlaceholder": "Disponible dans une phase ultérieure",
  "dashboard.status": "Statut",
  "dashboard.statusActive": "Active",
  "dashboard.statusInactive": "Inactive",
  "dashboard.storeName": "Nom de la boutique",
  "dashboard.slug": "Adresse",
  "dashboard.currency": "Devise",
  "dashboard.language": "Langue",
  "dashboard.country": "Pays",
  "dashboard.timezone": "Fuseau horaire",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "URL publique",
  "dashboard.notSet": "Non défini",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Paramètres",
  "settings.subtitle": "Mettez à jour les informations de votre boutique.",
  "settings.sectionStore": "Détails de la boutique",
  "settings.sectionLocalization": "Localisation",
  "settings.sectionContact": "Contact",
  "settings.sectionAppearance": "Apparence",
  "settings.primaryColor": "Couleur principale",
  "settings.logo": "Logo",
  "settings.logoPending":
    "Le téléversement du logo arrive dans une phase ultérieure — le stockage est déjà provisionné.",
  "settings.save": "Enregistrer les modifications",
  "settings.saving": "Enregistrement…",
  "settings.saved": "Paramètres enregistrés.",
  "settings.slugImmutable": "L'adresse de la boutique ne peut pas encore être modifiée.",
  "settings.currencyPreview": "Exemple : {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Bientôt",
  "common.comingSoon": "Bientôt disponible",
  "common.comingSoonBody":
    "{section} est en cours de construction dans une phase ultérieure. Les fondations sont prêtes.",
  "common.loading": "Chargement…",
  "common.optional": "facultatif",
  "common.backHome": "Retour à l'accueil",
  "common.backToDashboard": "Retour au tableau de bord",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "Cette boutique est en préparation",
  "storefront.comingSoonBody":
    "Produits, panier et commandes par WhatsApp arrivent dans les prochaines phases.",
  "storefront.notFound": "Boutique introuvable",
  "storefront.visitApp": "Tableau de bord du marchand",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "Quelque chose s'est mal passé",
  "error.body": "Une erreur inattendue est survenue. Veuillez réessayer.",
  "error.retry": "Réessayer",
  "notFound.title": "Page introuvable",
  "notFound.body": "La page que vous recherchez n'existe pas.",

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "Apparence",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "Annuler",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "Utilisez un lien complet, ex. https://…",
  "store.error.openingHoursTooLong": "Les horaires ne peuvent pas dépasser 300 caractères.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Informations de la boutique",
  "settings.sectionStorefrontHelp":
    "Ce que vos clients voient sur votre boutique publique. Le contenu du marchand n'est jamais traduit automatiquement.",
  "settings.bannerUrl": "URL de l'image de couverture",
  "settings.openingHours": "Horaires d'ouverture",
  "settings.openingHoursPlaceholder": "Lun–Ven 8h00–18h00\nSam 8h00–13h00",
  "settings.instagramUrl": "Lien Instagram",
  "settings.facebookUrl": "Lien Facebook",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Apparence",
  "appearance.subtitle":
    "Choisissez le modèle, les couleurs et la mise en page du catalogue de votre boutique.",
  "appearance.template": "Modèle",
  "appearance.templateHelp":
    "Le modèle ne change que la présentation — l'achat, le panier et la commande fonctionnent partout pareil.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Épuré et aéré, grandes images de produits.",
  "appearance.templateMarket": "Marché",
  "appearance.templateMarketDesc": "Grille dense, prix bien visibles, pratique.",
  "appearance.templateFashion": "Mode",
  "appearance.templateFashionDesc": "Regard éditorial, espacement élégant.",
  "appearance.templateRestaurant": "Restaurant",
  "appearance.templateRestaurantDesc": "Catalogue compact façon menu.",
  "appearance.colors": "Couleurs",
  "appearance.colorsHelp":
    "Le texte reste automatiquement lisible — nous l'adaptons à votre arrière-plan.",
  "appearance.primaryColor": "Couleur principale",
  "appearance.buttonColor": "Couleur des boutons",
  "appearance.accentColor": "Couleur d'accent",
  "appearance.backgroundColor": "Couleur d'arrière-plan",
  "appearance.catalog": "Catalogue",
  "appearance.productLayout": "Disposition des produits",
  "appearance.layoutGrid": "Grille",
  "appearance.layoutGridDesc": "Fiches produit dans une grille responsive.",
  "appearance.layoutList": "Liste",
  "appearance.layoutListDesc": "Lignes compactes : image, détails et bouton d'ajout.",
  "appearance.imageRatio": "Images de produits",
  "appearance.imageSquare": "Carrée",
  "appearance.imagePortrait": "Portrait",
  "appearance.imageLandscape": "Paysage",
  "appearance.buttonStyle": "Style des boutons",
  "appearance.buttonRounded": "Arrondi",
  "appearance.buttonSoft": "Doux",
  "appearance.buttonCompact": "Compact",
  "appearance.cardStyle": "Style des fiches",
  "appearance.cardSubtle": "Subtil",
  "appearance.cardRounded": "Arrondi",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Aperçu en direct",
  "appearance.previewDevice": "Appareil d'aperçu",
  "appearance.previewMobile": "Mobile",
  "appearance.previewDesktop": "Bureau",
  "appearance.previewHint":
    "L'aperçu utilise vos vrais produits. Publiez en enregistrant.",
  "appearance.save": "Enregistrer l'apparence",
  "appearance.saving": "Enregistrement…",
  "appearance.saved": "Apparence enregistrée.",
  "appearance.viewStore": "Voir la boutique",
  "appearance.error.optionInvalid": "Choisissez des options valides.",
  "appearance.error.colorInvalid": "Utilisez des couleurs hex comme #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Rechercher des produits…",
  "storefront.categories": "Catégories",
  "storefront.allProducts": "Tous les produits",
  "storefront.featured": "En vedette",
  "storefront.addToCart": "Ajouter au panier",
  "storefront.unavailable": "Indisponible",
  "storefront.noProducts": "Aucun produit pour l'instant",
  "storefront.noProductsBody": "La boutique n'a pas encore ajouté de produits.",
  "storefront.noResults": "Aucun produit trouvé",
  "storefront.noResultsBody": "Essayez une autre recherche ou catégorie.",
  "storefront.cart": "Panier",
  "storefront.cartEmpty": "Votre panier est vide",
  "storefront.cartEmptyBody": "Ajoutez des produits pour passer une commande.",
  "storefront.orderWhatsApp": "Commander via WhatsApp",
  "storefront.subtotal": "Sous-total",
  "storefront.increaseQty": "Augmenter la quantité",
  "storefront.decreaseQty": "Diminuer la quantité",
  "storefront.removeItem": "Retirer l'article",
  "storefront.itemQuantity": "Quantité",
  "storefront.storeInfo": "Informations sur la boutique",
  "storefront.delivery": "Livraison",
  "storefront.deliveryBody": "Les options de livraison sont confirmées sur WhatsApp.",
  "storefront.contact": "Contact",
  "storefront.openingHours": "Horaires d'ouverture",
  "storefront.followUs": "Suivez-nous",
  "storefront.openCartAria": "Ouvrir le panier",
  "storefront.cartCountAria": "Articles dans le panier",
  "storefront.productImageAlt": "Image du produit",
  "storefront.noImageAlt": "Produit sans image",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Gérez les produits de votre boutique.",
  "products.new": "Nouveau produit",
  "products.newSubtitle": "Ajoutez un produit à votre catalogue.",
  "products.empty": "Aucun produit pour l'instant",
  "products.emptyBody": "Créez votre premier produit pour remplir la boutique.",
  "products.edit": "Modifier le produit",
  "products.name": "Nom",
  "products.namePlaceholder": "Chemise en lin bleue",
  "products.description": "Description",
  "products.descriptionPlaceholder": "Matières, tailles, détails…",
  "products.price": "Prix",
  "products.promoPrice": "Prix promotionnel",
  "products.promoPriceHint": "Affiché à la place du prix lorsqu'il est défini.",
  "products.category": "Catégorie",
  "products.image": "URL de l'image",
  "products.imageHint": "Lien vers la photo du produit (https://…).",
  "products.imagePreview": "Aperçu de l'image",
  "products.available": "Disponible",
  "products.unavailable": "Indisponible",
  "products.featured": "En vedette",
  "products.featuredHint":
    "Les produits en vedette apparaissent avant le catalogue principal.",
  "products.noCategory": "Sans catégorie",
  "products.save": "Enregistrer les modifications",
  "products.saved": "Produit enregistré.",
  "products.create": "Créer le produit",
  "products.delete": "Supprimer",
  "products.deleteConfirm": "Supprimer le produit « {name} » ?",
  "products.moveUp": "Monter",
  "products.moveDown": "Descendre",
  "products.sectionDetails": "Détails",
  "products.sectionPricing": "Prix",
  "products.sectionOrganization": "Organisation",
  "products.error.nameRequired": "Saisissez le nom du produit.",
  "products.error.nameTooLong": "Le nom ne peut pas dépasser 120 caractères.",
  "products.error.descriptionTooLong": "La description ne peut pas dépasser 1000 caractères.",
  "products.error.priceInvalid": "Saisissez un prix valide, ex. 1000 ou 999.99.",
  "products.error.promoPriceInvalid": "Saisissez un prix promotionnel valide.",
  "products.error.promoPriceNotBelow": "Le prix promotionnel doit être inférieur au prix.",
  "products.error.imageInvalid": "Utilisez un lien complet (https://…) ou un chemin du site (/…).",
  "products.error.categoryInvalid": "Choisissez une catégorie de votre boutique.",
  "products.error.createFailed": "Impossible de créer le produit. Veuillez réessayer.",
  "products.error.saveFailed": "Impossible d'enregistrer les modifications. Veuillez réessayer.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Catégories",
  "categories.subtitle": "Organisez votre catalogue en catégories.",
  "categories.new": "Nouvelle catégorie",
  "categories.newSubtitle": "Les catégories apparaissent comme filtres dans la boutique.",
  "categories.name": "Nom",
  "categories.namePlaceholder": "Chemises",
  "categories.add": "Ajouter",
  "categories.save": "Enregistrer",
  "categories.saved": "Catégorie enregistrée.",
  "categories.created": "Catégorie créée.",
  "categories.empty": "Aucune catégorie pour l'instant.",
  "categories.listHint":
    "Renommez, réorganisez, activez ou supprimez. Les catégories inactives sont masquées dans la boutique.",
  "categories.active": "Active",
  "categories.delete": "Supprimer",
  "categories.deleteConfirm": "Supprimer la catégorie « {name} » ? Les produits sont conservés.",
  "categories.moveUp": "Monter",
  "categories.moveDown": "Descendre",
  "categories.error.nameRequired": "Saisissez le nom de la catégorie.",
  "categories.error.nameTooLong": "Le nom ne peut pas dépasser 60 caractères.",
  "categories.error.createFailed": "Impossible de créer la catégorie. Veuillez réessayer.",
  "categories.error.saveFailed": "Impossible d'enregistrer les modifications. Veuillez réessayer.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Langue",
  "locale.changeLanguage": "Changer la langue de l'interface",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Langue de l'interface",
  "settings.uiLanguageHelp":
    "Langue de la plateforme Elicani — indépendante de la langue et de la devise de votre boutique.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Navigation principale",
  "landing.footerNav": "Liens de pied de page",
  "landing.navFeatures": "Fonctionnalités",
  "landing.navHow": "Comment ça marche",
  "landing.signIn": "Se connecter",
  "landing.createStore": "Créez votre boutique",
  "landing.openMenu": "Ouvrir le menu",
  "landing.closeMenu": "Fermer le menu",

  "landing.heroTitle1": "Vendez en ligne.",
  "landing.heroTitle2": "Recevez les commandes sur WhatsApp.",
  "landing.heroSubtitle":
    "Elicani donne aux petites entreprises une vraie boutique en ligne — présentez vos produits, recevez des commandes, gérez vos clients et vendez dans n'importe quelle devise.",
  "landing.seeHow": "Voir comment ça marche",

  "landing.trust1": "Votre propre boutique en ligne",
  "landing.trust2": "Produits et catégories",
  "landing.trust3": "Commandes par WhatsApp",
  "landing.trust4": "N'importe quelle devise",
  "landing.trust5": "Conçu pour les petites entreprises",

  "landing.featuresTitle": "Votre boutique, à votre façon",
  "landing.featuresSubtitle":
    "Tout ce qu'il faut pour ouvrir votre boutique et commencer à vendre — sans compétences techniques.",
  "landing.feature1Title": "Votre propre boutique",
  "landing.feature1Body":
    "Créez une vraie boutique en ligne avec votre identité, vos produits et vos catégories.",
  "landing.feature2Title": "Catalogue simple",
  "landing.feature2Body":
    "Ajoutez produits, images, prix et catégories sans connaissances techniques.",
  "landing.feature3Title": "Des commandes faciles",
  "landing.feature3Body":
    "Les clients parcouruent, ajoutent des produits au panier et envoient leur commande via WhatsApp.",
  "landing.feature4Title": "Devise flexible",
  "landing.feature4Body":
    "Vendez en USD, EUR, MZN, BRL ou dans une autre devise prise en charge.",
  "landing.feature5Title": "Livraison",
  "landing.feature5Body":
    "Configurez les zones et les frais de livraison pour vos clients.",
  "landing.feature6Title": "Gérez tout",
  "landing.feature6Body":
    "Produits, commandes, clients et paramètres de la boutique depuis un seul tableau de bord.",

  "landing.howTitle": "Comment ça marche",
  "landing.howSubtitle": "De l'idée à la première commande en trois étapes.",
  "landing.step1Title": "Créez votre boutique",
  "landing.step1Body": "Configurez les informations de votre entreprise.",
  "landing.step2Title": "Ajoutez vos produits",
  "landing.step2Body": "Ajoutez photos, prix et catégories.",
  "landing.step3Title": "Recevez des commandes",
  "landing.step3Body":
    "Les clients font leurs achats et envoient leur commande via WhatsApp.",

  "landing.previewStoreTitle": "Une vraie boutique en ligne, pas juste une liste de produits.",
  "landing.previewStoreBody":
    "Votre boutique inclut un en-tête, des catégories, des fiches produit, des prix, une recherche et un panier — prête à partager dès l'enregistrement.",
  "landing.previewDashTitle": "Gérez tout depuis un tableau de bord",
  "landing.previewDashBody":
    "Produits, commandes, clients, livraison et paramètres de la boutique — organisés en un seul endroit.",
  "landing.colOrder": "Commande",
  "landing.colItems": "Articles",
  "landing.colTotal": "Total",
  "landing.colStatus": "Statut",
  "landing.statusNew": "Nouvelle",
  "landing.statusConfirmed": "Confirmée",
  "landing.statusDelivered": "Livrée",

  "landing.ctaTitle": "Prêt à mettre votre entreprise en ligne ?",
  "landing.ctaBody": "Créez votre boutique Elicani et commencez à vendre.",

  "landing.footerTagline": "Boutiques en ligne avec commandes WhatsApp.",
  "landing.footerRights": "© {year} Elicani. Tous droits réservés.",

  "landing.pillOrder": "Commande envoyée sur WhatsApp",
  "landing.demoItemsOne": "{count} article",
  "landing.demoItemsMany": "{count} articles",
};

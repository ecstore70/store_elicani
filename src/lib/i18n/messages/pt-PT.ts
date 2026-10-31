/**
 * Catálogo em português europeu — cobre todas as chaves de `en.ts`.
 * Diferenças face ao pt-BR: "iniciar sessão", "guardar", "ficheiro",
 * "ecrã", "telemóvel", "contacto", "utilizador" — norma europeia.
 * O teste em `i18n.test.ts` garante essa completude.
 */
import type { Messages } from "./en.ts";

export const ptPT: Messages = {
  // ── navegação do painel ────────────────────────────────────────────────
  "nav.dashboard": "Painel",
  "nav.products": "Produtos",
  "nav.orders": "Encomendas",
  "nav.customers": "Clientes",
  "nav.delivery": "Entrega",
  "nav.reports": "Relatórios",
  "nav.settings": "Definições",

  // ── shell do painel ────────────────────────────────────────────────────
  "shell.openMenu": "Abrir navegação",
  "shell.closeMenu": "Fechar navegação",
  "shell.signOut": "Terminar sessão",
  "shell.signedInAs": "Sessão iniciada como",
  "shell.store": "Loja",
  "shell.phase": "Fase 1",

  // ── autenticação ───────────────────────────────────────────────────────
  "auth.loginTitle": "Iniciar sessão no Elicani",
  "auth.loginSubtitle": "Faça a gestão da sua loja, produtos e encomendas.",
  "auth.signupTitle": "Crie a sua conta Elicani",
  "auth.signupSubtitle": "Abra a sua loja online em poucos minutos.",
  "auth.email": "Correio eletrónico",
  "auth.emailPlaceholder": "voce@exemplo.pt",
  "auth.password": "Palavra-passe",
  "auth.passwordHint": "Mínimo de 8 caracteres",
  "auth.signIn": "Iniciar sessão",
  "auth.createAccount": "Criar conta",
  "auth.noAccount": "Ainda não tem conta?",
  "auth.haveAccount": "Já tem uma conta?",
  "auth.checkEmail":
    "Conta criada. Abra o link de confirmação que enviamos para {email} e inicie depois a sessão.",
  "auth.confirmPassword": "Confirmar palavra-passe",
  "auth.showPassword": "Mostrar palavra-passe",
  "auth.hidePassword": "Ocultar palavra-passe",
  "auth.google": "Continuar com o Google",
  "auth.forgotPassword": "Esqueceu-se da palavra-passe?",
  "auth.forgot.title": "Repor a palavra-passe",
  "auth.forgot.subtitle": "Introduza o seu correio e enviaremos um link de recuperação.",
  "auth.forgot.submit": "Enviar link de recuperação",
  "auth.forgot.checkEmail":
    "Se existir uma conta com este correio, enviámos um link para repor a sua palavra-passe.",
  "auth.forgot.backToLogin": "Voltar ao início de sessão",
  "auth.reset.title": "Escolha uma nova palavra-passe",
  "auth.reset.subtitle": "Introduza e confirme a sua nova palavra-passe.",
  "auth.reset.newPassword": "Nova palavra-passe",
  "auth.reset.confirmPassword": "Confirmar nova palavra-passe",
  "auth.reset.submit": "Repor palavra-passe",
  "auth.reset.success":
    "Palavra-passe reposta com sucesso. Inicie a sessão com a nova palavra-passe.",
  "auth.reset.invalidLink":
    "Este link é inválido ou expirou. Peça um novo.",
  "auth.marketingTagline": "Venda online. Receba encomendas pelo WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Introduza o seu correio e a sua palavra-passe.",
  "auth.error.invalidEmail": "Introduza um endereço de correio válido.",
  "auth.error.weakPassword": "Utilize uma palavra-passe com pelo menos 8 caracteres.",
  "auth.error.invalidCredentials": "Correio eletrónico ou palavra-passe incorretos.",
  "auth.error.emailNotConfirmed":
    "Confirme o seu correio antes de iniciar sessão. Veja a sua caixa de entrada.",
  "auth.error.userAlreadyExists": "Já existe uma conta com este correio. Inicie sessão.",
  "auth.error.rateLimited": "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth.error.loginFailed": "Não foi possível iniciar sessão. Tente novamente.",
  "auth.error.signupFailed": "Não foi possível criar a conta. Tente novamente.",
  "auth.error.emailRequired": "Introduza o seu endereço de correio eletrónico.",
  "auth.error.passwordsMismatch": "As palavras-passe não coincidem.",
  "auth.error.oauth": "Não foi possível continuar com o Google. Tente novamente.",
  "auth.error.passwordResetFailed":
    "Não foi possível enviar o correio de recuperação. Tente novamente.",
  "auth.error.updatePasswordFailed":
    "Não foi possível atualizar a palavra-passe. Tente novamente.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Crie a sua loja",
  "onboarding.subtitle":
    "Escolha um nome e um endereço web. Pode alterá-los mais tarde nas definições.",
  "onboarding.name": "Nome da loja",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Endereço da loja",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Letras, números e hífens. URL futura: {url}",
  "onboarding.whatsapp": "Número do WhatsApp",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Os clientes enviarão encomendas para este número.",
  "onboarding.country": "País",
  "onboarding.language": "Idioma",
  "onboarding.languageHelp": "Idioma da sua loja — independente do país e da moeda.",
  "onboarding.currency": "Moeda",
  "onboarding.description": "Descrição",
  "onboarding.descriptionPlaceholder": "O que é que a sua loja vende?",
  "onboarding.timezone": "Fuso horário",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Prefixo do país",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Criar loja",
  "onboarding.submitting": "A criar…",
  "onboarding.selectPlaceholder": "Selecionar…",
  "onboarding.none": "Por definir",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Introduza o nome da loja (pelo menos 2 caracteres).",
  "store.error.nameTooLong": "O nome pode ter no máximo 80 caracteres.",
  "store.error.slugEmpty": "Introduza o endereço da loja.",
  "store.error.slugTooShort": "Utilize pelo menos {min} caracteres.",
  "store.error.slugTooLong": "Utilize no máximo {max} caracteres.",
  "store.error.slugInvalid":
    "Utilize apenas minúsculas, números e hífens (sem espaços, sem hífen no início ou no fim).",
  "store.error.slugReserved": "Este endereço está reservado. Escolha outro.",
  "store.error.slugTaken": "Este endereço já está em uso. Escolha outro.",
  "store.error.whatsappInvalid":
    "Número do WhatsApp inválido. Utilize apenas dígitos, por exemplo +258841234567.",
  "store.error.phoneInvalid": "Número de telefone inválido.",
  "store.error.phoneCodeInvalid": "Prefixo de país inválido, por exemplo +258.",
  "store.error.countryInvalid": "Selecione um país válido.",
  "store.error.languageInvalid": "Selecione um idioma válido.",
  "store.error.currencyInvalid": "Selecione uma moeda válida.",
  "store.error.timezoneInvalid": "Fuso horário inválido, por exemplo Africa/Maputo.",
  "store.error.descriptionTooLong": "A descrição pode ter no máximo 500 caracteres.",
  "store.error.primaryColorInvalid": "Utilize uma cor hex como #0f172a.",
  "store.sectionOptional": "Detalhes opcionais",
  "store.error.createFailed": "Não foi possível criar a loja. Tente novamente.",
  "store.error.alreadyExists": "Já tem uma loja.",
  "store.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",
  "store.error.sessionInvalid": "A sua sessão expirou. Inicie sessão novamente.",
  "store.error.lookupFailed": "Não foi possível verificar o endereço. Tente novamente.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Painel",
  "dashboard.subtitle": "Resumo da sua loja.",
  "dashboard.storeCard": "Loja",
  "dashboard.summary": "Resumo",
  "dashboard.products": "Produtos",
  "dashboard.orders": "Encomendas",
  "dashboard.customers": "Clientes",
  "dashboard.summaryPlaceholder": "Disponível numa fase posterior",
  "dashboard.status": "Estado",
  "dashboard.statusActive": "Ativa",
  "dashboard.statusInactive": "Inativa",
  "dashboard.storeName": "Nome da loja",
  "dashboard.slug": "Endereço",
  "dashboard.currency": "Moeda",
  "dashboard.language": "Idioma",
  "dashboard.country": "País",
  "dashboard.timezone": "Fuso horário",
  "dashboard.whatsapp": "WhatsApp",
  "dashboard.publicUrl": "URL pública",
  "dashboard.notSet": "Por definir",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Definições",
  "settings.subtitle": "Atualize as informações da sua loja.",
  "settings.sectionStore": "Dados da loja",
  "settings.sectionLocalization": "Localização",
  "settings.sectionContact": "Contacto",
  "settings.sectionAppearance": "Aparência",
  "settings.primaryColor": "Cor principal",
  "settings.logo": "Logótipo",
  "settings.logoPending":
    "O carregamento do logótipo chega numa fase posterior — o armazenamento já está preparado.",
  "settings.save": "Guardar alterações",
  "settings.saving": "A guardar…",
  "settings.saved": "Definições guardadas.",
  "settings.slugImmutable": "O endereço da loja ainda não pode ser alterado.",
  "settings.currencyPreview": "Exemplo: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Em breve",
  "common.comingSoon": "Em breve",
  "common.comingSoonBody":
    "{section} está a ser construído numa fase posterior. A base está pronta.",
  "common.loading": "A carregar…",
  "common.optional": "opcional",
  "common.backHome": "Voltar ao início",
  "common.backToDashboard": "Voltar ao painel",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "Esta loja está a ser preparada",
  "storefront.comingSoonBody":
    "Produtos, carrinho e pagamento por WhatsApp chegam nas próximas fases.",
  "storefront.notFound": "Loja não encontrada",
  "storefront.visitApp": "Painel do comerciante",

  // ── erros de página ────────────────────────────────────────────────────
  "error.title": "Algo correu mal",
  "error.body": "Ocorreu um erro inesperado. Tente novamente.",
  "error.retry": "Tentar novamente",
  "notFound.title": "Página não encontrada",
  "notFound.body": "A página que procura não existe.",

  // ── navegação: aparência ───────────────────────────────────────────────
  "nav.appearance": "Aparência",

  // ── botões genéricos ───────────────────────────────────────────────────
  "common.cancel": "Cancelar",

  // ── validação de loja (novos campos de identidade) ─────────────────────
  "store.error.urlInvalid": "Utilize um link completo, por exemplo https://…",
  "store.error.openingHoursTooLong": "O horário pode ter no máximo 300 caracteres.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Informações da loja",
  "settings.sectionStorefrontHelp":
    "O que os clientes veem na sua loja pública. O conteúdo do comerciante nunca é traduzido automaticamente.",
  "settings.bannerUrl": "URL da imagem de capa",
  "settings.openingHours": "Horário",
  "settings.openingHoursPlaceholder": "Seg–Sex 8:00–18:00\nSáb 8:00–13:00",
  "settings.instagramUrl": "Link do Instagram",
  "settings.facebookUrl": "Link do Facebook",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Aparência",
  "appearance.subtitle":
    "Escolha o modelo, as cores e a disposição do catálogo da sua loja.",
  "appearance.template": "Modelo",
  "appearance.templateHelp":
    "O modelo altera apenas a apresentação — comprar, carrinho e encomendar funcionam igual em todos.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Limpo e espaçoso, imagens de produto grandes.",
  "appearance.templateMarket": "Mercado",
  "appearance.templateMarketDesc": "Grelha densa, preços em destaque, prático.",
  "appearance.templateFashion": "Moda",
  "appearance.templateFashionDesc": "Aspeto editorial, espaçamento elegante.",
  "appearance.templateRestaurant": "Restaurante",
  "appearance.templateRestaurantDesc": "Catálogo compacto tipo menu.",
  "appearance.colors": "Cores",
  "appearance.colorsHelp":
    "O texto continua legível automaticamente — ajustamo-lo ao seu fundo.",
  "appearance.primaryColor": "Cor principal",
  "appearance.buttonColor": "Cor dos botões",
  "appearance.accentColor": "Cor de destaque",
  "appearance.backgroundColor": "Cor de fundo",
  "appearance.catalog": "Catálogo",
  "appearance.productLayout": "Disposição dos produtos",
  "appearance.layoutGrid": "Grelha",
  "appearance.layoutGridDesc": "Fichas de produto numa grelha responsiva.",
  "appearance.layoutList": "Lista",
  "appearance.layoutListDesc": "Linhas compactas: imagem, detalhes e botão de adicionar.",
  "appearance.imageRatio": "Imagens de produto",
  "appearance.imageSquare": "Quadrada",
  "appearance.imagePortrait": "Vertical",
  "appearance.imageLandscape": "Horizontal",
  "appearance.buttonStyle": "Estilo dos botões",
  "appearance.buttonRounded": "Arredondado",
  "appearance.buttonSoft": "Suave",
  "appearance.buttonCompact": "Compacto",
  "appearance.cardStyle": "Estilo das fichas",
  "appearance.cardSubtle": "Subtil",
  "appearance.cardRounded": "Arredondado",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Pré-visualização ao vivo",
  "appearance.previewDevice": "Dispositivo de pré-visualização",
  "appearance.previewMobile": "Telemóvel",
  "appearance.previewDesktop": "Computador",
  "appearance.previewHint":
    "A pré-visualização usa os seus produtos reais. Publique ao guardar.",
  "appearance.save": "Guardar aparência",
  "appearance.saving": "A guardar…",
  "appearance.saved": "Aparência guardada.",
  "appearance.viewStore": "Ver loja",
  "appearance.error.optionInvalid": "Escolha opções válidas.",
  "appearance.error.colorInvalid": "Utilize cores hex como #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Pesquisar produtos…",
  "storefront.categories": "Categorias",
  "storefront.allProducts": "Todos os produtos",
  "storefront.featured": "Destaque",
  "storefront.addToCart": "Adicionar ao carrinho",
  "storefront.unavailable": "Indisponível",
  "storefront.noProducts": "Ainda sem produtos",
  "storefront.noProductsBody": "A loja ainda não adicionou produtos.",
  "storefront.noResults": "Nenhum produto encontrado",
  "storefront.noResultsBody": "Experimente outra pesquisa ou categoria.",
  "storefront.cart": "Carrinho",
  "storefront.cartEmpty": "O seu carrinho está vazio",
  "storefront.cartEmptyBody": "Adicione produtos para fazer uma encomenda.",
  "storefront.orderWhatsApp": "Encomendar pelo WhatsApp",
  "storefront.subtotal": "Subtotal",
  "storefront.increaseQty": "Aumentar quantidade",
  "storefront.decreaseQty": "Diminuir quantidade",
  "storefront.removeItem": "Remover artigo",
  "storefront.itemQuantity": "Quantidade",
  "storefront.storeInfo": "Informações da loja",
  "storefront.delivery": "Entrega",
  "storefront.deliveryBody": "As opções de entrega são confirmadas pelo WhatsApp.",
  "storefront.contact": "Contacto",
  "storefront.openingHours": "Horário",
  "storefront.followUs": "Siga-nos",
  "storefront.openCartAria": "Abrir carrinho",
  "storefront.cartCountAria": "Artigos no carrinho",
  "storefront.productImageAlt": "Imagem do produto",
  "storefront.noImageAlt": "Produto sem imagem",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Faça a gestão dos produtos da sua loja.",
  "products.new": "Novo produto",
  "products.newSubtitle": "Adicione um produto ao seu catálogo.",
  "products.empty": "Ainda sem produtos",
  "products.emptyBody": "Crie o seu primeiro produto para preencher a loja.",
  "products.edit": "Editar produto",
  "products.name": "Nome",
  "products.namePlaceholder": "Camisa de linho azul",
  "products.description": "Descrição",
  "products.descriptionPlaceholder": "Materiais, tamanhos, detalhes…",
  "products.price": "Preço",
  "products.promoPrice": "Preço promocional",
  "products.promoPriceHint": "Mostrado em vez do preço quando definido.",
  "products.category": "Categoria",
  "products.image": "URL da imagem",
  "products.imageHint": "Link para a fotografia do produto (https://…).",
  "products.imagePreview": "Pré-visualização da imagem",
  "products.available": "Disponível",
  "products.unavailable": "Indisponível",
  "products.featured": "Em destaque",
  "products.featuredHint":
    "Os produtos em destaque aparecem antes do catálogo principal.",
  "products.noCategory": "Sem categoria",
  "products.save": "Guardar alterações",
  "products.saved": "Produto guardado.",
  "products.create": "Criar produto",
  "products.delete": "Eliminar",
  "products.deleteConfirm": "Eliminar o produto “{name}”?",
  "products.moveUp": "Subir",
  "products.moveDown": "Descer",
  "products.sectionDetails": "Detalhes",
  "products.sectionPricing": "Preços",
  "products.sectionOrganization": "Organização",
  "products.error.nameRequired": "Introduza o nome do produto.",
  "products.error.nameTooLong": "O nome pode ter no máximo 120 caracteres.",
  "products.error.descriptionTooLong": "A descrição pode ter no máximo 1000 caracteres.",
  "products.error.priceInvalid": "Introduza um preço válido, por exemplo 1000 ou 999.99.",
  "products.error.promoPriceInvalid": "Introduza um preço promocional válido.",
  "products.error.promoPriceNotBelow": "O preço promocional deve ser inferior ao preço.",
  "products.error.imageInvalid": "Utilize um link completo (https://…) ou um caminho do site (/…).",
  "products.error.categoryInvalid": "Escolha uma categoria da sua loja.",
  "products.error.createFailed": "Não foi possível criar o produto. Tente novamente.",
  "products.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Categorias",
  "categories.subtitle": "Organize o seu catálogo em categorias.",
  "categories.new": "Nova categoria",
  "categories.newSubtitle": "As categorias aparecem como filtros na loja.",
  "categories.name": "Nome",
  "categories.namePlaceholder": "Camisas",
  "categories.add": "Adicionar",
  "categories.save": "Guardar",
  "categories.saved": "Categoria guardada.",
  "categories.created": "Categoria criada.",
  "categories.empty": "Ainda sem categorias.",
  "categories.listHint":
    "Renomear, reordenar, ativar ou eliminar. As categorias inativas ficam ocultas na loja.",
  "categories.active": "Ativa",
  "categories.delete": "Eliminar",
  "categories.deleteConfirm": "Eliminar a categoria “{name}”? Os produtos são mantidos.",
  "categories.moveUp": "Subir",
  "categories.moveDown": "Descer",
  "categories.error.nameRequired": "Introduza o nome da categoria.",
  "categories.error.nameTooLong": "O nome pode ter no máximo 60 caracteres.",
  "categories.error.createFailed": "Não foi possível criar a categoria. Tente novamente.",
  "categories.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Idioma",
  "locale.changeLanguage": "Alterar o idioma da interface",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Idioma da interface",
  "settings.uiLanguageHelp":
    "Idioma da plataforma Elicani — independente do idioma e da moeda da sua loja.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Navegação principal",
  "landing.footerNav": "Links de rodapé",
  "landing.navFeatures": "Funcionalidades",
  "landing.navHow": "Como funciona",
  "landing.signIn": "Iniciar sessão",
  "landing.createStore": "Criar a sua loja",
  "landing.openMenu": "Abrir menu",
  "landing.closeMenu": "Fechar menu",

  "landing.heroTitle1": "Venda online.",
  "landing.heroTitle2": "Receba encomendas pelo WhatsApp.",
  "landing.heroSubtitle":
    "O Elicani dá às pequenas empresas uma verdadeira loja online — mostre produtos, receba encomendas, faça a gestão de clientes e venda em qualquer moeda.",
  "landing.seeHow": "Ver como funciona",

  "landing.trust1": "A sua própria loja online",
  "landing.trust2": "Produtos e categorias",
  "landing.trust3": "Encomendas pelo WhatsApp",
  "landing.trust4": "Qualquer moeda",
  "landing.trust5": "Feito para pequenas empresas",

  "landing.featuresTitle": "A sua loja, à sua maneira",
  "landing.featuresSubtitle":
    "Tudo o que precisa para abrir a sua loja e começar a vender — sem conhecimentos técnicos.",
  "landing.feature1Title": "A sua própria loja",
  "landing.feature1Body":
    "Crie uma verdadeira loja online com a sua própria identidade, produtos e categorias.",
  "landing.feature2Title": "Catálogo simples",
  "landing.feature2Body":
    "Adicione produtos, imagens, preços e categorias sem conhecimentos técnicos.",
  "landing.feature3Title": "Encomendas simples",
  "landing.feature3Body":
    "Os clientes navegam, adicionam produtos ao carrinho e enviam a encomenda pelo WhatsApp.",
  "landing.feature4Title": "Moeda flexível",
  "landing.feature4Body":
    "Venda em USD, EUR, MZN, BRL ou outra moeda suportada.",
  "landing.feature5Title": "Entrega",
  "landing.feature5Body":
    "Configure zonas e valores de entrega para os seus clientes.",
  "landing.feature6Title": "Tudo sob controlo",
  "landing.feature6Body":
    "Produtos, encomendas, clientes e definições da loja a partir de um único painel.",

  "landing.howTitle": "Como funciona",
  "landing.howSubtitle": "Da ideia à primeira encomenda em três passos.",
  "landing.step1Title": "Crie a sua loja",
  "landing.step1Body": "Configure as informações do seu negócio.",
  "landing.step2Title": "Adicione os seus produtos",
  "landing.step2Body": "Adicione fotos, preços e categorias.",
  "landing.step3Title": "Receba encomendas",
  "landing.step3Body":
    "Os clientes compram e enviam a encomenda pelo WhatsApp.",

  "landing.previewStoreTitle": "Uma verdadeira loja online, não apenas uma lista de produtos.",
  "landing.previewStoreBody":
    "A sua loja inclui cabeçalho, categorias, fichas de produto, preços, pesquisa e carrinho — pronta para partilhar assim que guardar.",
  "landing.previewDashTitle": "Tudo a partir de um painel",
  "landing.previewDashBody":
    "Produtos, encomendas, clientes, entrega e definições da loja — organizados num só lugar.",
  "landing.colOrder": "Encomenda",
  "landing.colItems": "Artigos",
  "landing.colTotal": "Total",
  "landing.colStatus": "Estado",
  "landing.statusNew": "Nova",
  "landing.statusConfirmed": "Confirmada",
  "landing.statusDelivered": "Entregue",

  "landing.ctaTitle": "Pronto para colocar o seu negócio online?",
  "landing.ctaBody": "Crie a sua loja Elicani e comece a vender.",

  "landing.footerTagline": "Lojas online com encomendas pelo WhatsApp.",
  "landing.footerRights": "© {year} Elicani. Todos os direitos reservados.",

  "landing.pillOrder": "Encomenda enviada pelo WhatsApp",
  "landing.demoItemsOne": "{count} artigo",
  "landing.demoItemsMany": "{count} artigos",
};

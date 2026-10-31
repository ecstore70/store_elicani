/**
 * Catálogo em português do Brasil — idioma PADRÃO da aplicação.
 *
 * Ao contrário dos demais idiomas (parciais, com fallback para o inglês),
 * este catálogo é COMPLETO: cobre todas as chaves de `en.ts`.
 * O teste em `i18n.test.ts` garante essa completude.
 */
import type { Messages } from "./en.ts";

export const ptBR: Messages = {
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
  "auth.loginTitle": "Entrar no Elicani",
  "auth.loginSubtitle": "Gerencie a sua loja, produtos e encomendas.",
  "auth.signupTitle": "Crie a sua conta Elicani",
  "auth.signupSubtitle": "Abra a sua loja online em poucos minutos.",
  "auth.email": "Email",
  "auth.emailPlaceholder": "voce@exemplo.com",
  "auth.password": "Senha",
  "auth.passwordHint": "No mínimo 8 caracteres",
  "auth.signIn": "Entrar",
  "auth.createAccount": "Criar conta",
  "auth.noAccount": "Ainda não tem conta?",
  "auth.haveAccount": "Já tem uma conta?",
  "auth.confirmPassword": "Confirmar senha",
  "auth.showPassword": "Mostrar senha",
  "auth.hidePassword": "Ocultar senha",
  "auth.google": "Continuar com Google",
  "auth.checkEmail":
    "Conta criada. Abra o link de confirmação que enviamos para {email} e depois entre.",
  "auth.forgotPassword": "Esqueci minha senha",
  "auth.forgot.title": "Recuperar senha",
  "auth.forgot.subtitle": "Digite o seu email e enviaremos um link de recuperação.",
  "auth.forgot.submit": "Enviar link de recuperação",
  "auth.forgot.checkEmail":
    "Se existir uma conta com este email, enviaremos um link para redefinir a sua senha.",
  "auth.forgot.backToLogin": "Voltar para entrar",
  "auth.reset.title": "Escolha uma nova senha",
  "auth.reset.subtitle": "Digite e confirme a sua nova senha.",
  "auth.reset.newPassword": "Nova senha",
  "auth.reset.confirmPassword": "Confirmar nova senha",
  "auth.reset.submit": "Redefinir senha",
  "auth.reset.success":
    "Senha redefinida com sucesso. Entre com a nova senha.",
  "auth.reset.invalidLink":
    "Este link é inválido ou expirou. Peça um novo.",
  "auth.marketingTagline": "Venda online. Receba encomendas no WhatsApp.",

  // ── mensagens de erro de autenticação ──────────────────────────────────
  "auth.error.required": "Digite o seu email e a sua senha.",
  "auth.error.invalidEmail": "Digite um email válido.",
  "auth.error.weakPassword": "Use uma senha com no mínimo 8 caracteres.",
  "auth.error.invalidCredentials": "Email ou senha incorretos.",
  "auth.error.emailNotConfirmed":
    "Confirme o seu email antes de entrar. Verifique a sua caixa de entrada.",
  "auth.error.userAlreadyExists": "Já existe uma conta com este email. Entre.",
  "auth.error.rateLimited":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth.error.loginFailed": "Não foi possível entrar. Tente novamente.",
  "auth.error.signupFailed": "Não foi possível criar a conta. Tente novamente.",
  "auth.error.emailRequired": "Digite o seu email.",
  "auth.error.passwordsMismatch": "As senhas não coincidem.",
  "auth.error.oauth": "Não foi possível continuar com o Google. Tente novamente.",
  "auth.error.passwordResetFailed":
    "Não foi possível enviar o email de recuperação. Tente novamente.",
  "auth.error.updatePasswordFailed":
    "Não foi possível atualizar a senha. Tente novamente.",

  // ── onboarding / criação de loja ───────────────────────────────────────
  "onboarding.title": "Crie a sua loja",
  "onboarding.subtitle":
    "Escolha um nome e um endereço web. Pode alterar depois nas definições.",
  "onboarding.name": "Nome da loja",
  "onboarding.namePlaceholder": "Maria Fashion",
  "onboarding.slug": "Endereço da loja",
  "onboarding.slugPlaceholder": "maria-fashion",
  "onboarding.slugHelp": "Letras, números e hífens. Futura URL: {url}",
  "onboarding.whatsapp": "Número do WhatsApp",
  "onboarding.whatsappPlaceholder": "+258841234567",
  "onboarding.whatsappHelp": "Os clientes enviarão encomendas para este número.",
  "onboarding.country": "País",
  "onboarding.language": "Idioma",
  "onboarding.languageHelp":
    "Idioma da sua vitrine — independente do país e da moeda.",
  "onboarding.currency": "Moeda",
  "onboarding.description": "Descrição",
  "onboarding.descriptionPlaceholder": "O que a sua loja vende?",
  "onboarding.timezone": "Fuso horário",
  "onboarding.timezonePlaceholder": "Africa/Maputo",
  "onboarding.phoneCountryCode": "Código telefónico do país",
  "onboarding.phoneCountryCodePlaceholder": "+258",
  "onboarding.submit": "Criar loja",
  "onboarding.submitting": "A criar…",
  "onboarding.selectPlaceholder": "Selecionar…",
  "onboarding.none": "Não definido",

  // ── validação de loja (onboarding + definições) ────────────────────────
  "store.error.nameRequired": "Digite o nome da loja (mínimo 2 caracteres).",
  "store.error.nameTooLong": "O nome pode ter no máximo 80 caracteres.",
  "store.error.slugEmpty": "Digite o endereço da loja.",
  "store.error.slugTooShort": "Use no mínimo {min} caracteres.",
  "store.error.slugTooLong": "Use no máximo {max} caracteres.",
  "store.error.slugInvalid":
    "Use apenas letras minúsculas, números e hífens (sem espaços, sem hífen no início ou fim).",
  "store.error.slugReserved": "Este endereço é reservado. Escolha outro.",
  "store.error.slugTaken": "Este endereço já está em uso. Escolha outro.",
  "store.error.whatsappInvalid":
    "Número de WhatsApp inválido. Use apenas dígitos, ex.: +258841234567.",
  "store.error.phoneInvalid": "Número de telefone inválido.",
  "store.error.phoneCodeInvalid": "Código de país inválido, ex.: +258.",
  "store.error.countryInvalid": "Selecione um país válido.",
  "store.error.languageInvalid": "Selecione um idioma válido.",
  "store.error.currencyInvalid": "Selecione uma moeda válida.",
  "store.error.timezoneInvalid": "Fuso horário inválido, ex.: Africa/Maputo.",
  "store.error.descriptionTooLong": "A descrição pode ter no máximo 500 caracteres.",
  "store.error.primaryColorInvalid": "Use uma cor hex como #0f172a.",
  "store.sectionOptional": "Detalhes opcionais",
  "store.error.createFailed": "Não foi possível criar a loja. Tente novamente.",
  "store.error.alreadyExists": "Você já tem uma loja.",
  "store.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",
  "store.error.sessionInvalid": "A sua sessão expirou. Entre novamente.",
  "store.error.lookupFailed": "Não foi possível verificar o endereço. Tente novamente.",

  // ── dashboard ──────────────────────────────────────────────────────────
  "dashboard.title": "Painel",
  "dashboard.subtitle": "Visão geral da sua loja.",
  "dashboard.storeCard": "Loja",
  "dashboard.summary": "Resumo",
  "dashboard.products": "Produtos",
  "dashboard.orders": "Encomendas",
  "dashboard.customers": "Clientes",
  "dashboard.summaryPlaceholder": "Disponível numa fase seguinte",
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
  "dashboard.notSet": "Não definido",

  // ── definições ─────────────────────────────────────────────────────────
  "settings.title": "Definições",
  "settings.subtitle": "Atualize as informações da sua loja.",
  "settings.sectionStore": "Detalhes da loja",
  "settings.sectionLocalization": "Localização",
  "settings.sectionContact": "Contacto",
  "settings.sectionAppearance": "Aparência",
  "settings.primaryColor": "Cor principal",
  "settings.logo": "Logótipo",
  "settings.logoPending":
    "O carregamento do logótipo chega numa fase seguinte — o bucket já está preparado.",
  "settings.save": "Guardar alterações",
  "settings.saving": "A guardar…",
  "settings.saved": "Definições guardadas.",
  "settings.slugImmutable": "O endereço da loja ainda não pode ser alterado.",
  "settings.currencyPreview": "Exemplo: {value}",

  // ── estados genéricos ──────────────────────────────────────────────────
  "common.soon": "Em breve",
  "common.comingSoon": "Em breve",
  "common.comingSoonBody":
    "A secção {section} está a ser construída numa fase seguinte. A base já está pronta.",
  "common.loading": "A carregar…",
  "common.optional": "opcional",
  "common.backHome": "Voltar ao início",
  "common.backToDashboard": "Voltar ao painel",

  // ── vitrine pública (placeholder) ──────────────────────────────────────
  "storefront.comingSoon": "Esta vitrine está a ser preparada",
  "storefront.comingSoonBody":
    "Produtos, carrinho e checkout pelo WhatsApp chegam nas próximas fases.",
  "storefront.notFound": "Loja não encontrada",
  "storefront.visitApp": "Painel do lojista",

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
  "store.error.urlInvalid": "Use um link completo, ex.: https://…",
  "store.error.openingHoursTooLong": "O horário pode ter no máximo 300 caracteres.",

  // ── definições: identidade da vitrine ──────────────────────────────────
  "settings.sectionStorefront": "Informações da vitrine",
  "settings.sectionStorefrontHelp":
    "O que os clientes veem na sua loja pública. O conteúdo do comerciante nunca é traduzido automaticamente.",
  "settings.bannerUrl": "URL da imagem de capa",
  "settings.openingHours": "Horário de atendimento",
  "settings.openingHoursPlaceholder": "Seg–Sex 8:00–18:00\nSáb 8:00–13:00",
  "settings.instagramUrl": "Link do Instagram",
  "settings.facebookUrl": "Link do Facebook",

  // ── aparência da vitrine ───────────────────────────────────────────────
  "appearance.title": "Aparência",
  "appearance.subtitle":
    "Escolha o template, as cores e o layout do catálogo da sua vitrine.",
  "appearance.template": "Template",
  "appearance.templateHelp":
    "O template muda apenas a apresentação — compras, carrinho e encomendas funcionam igual em todos.",
  "appearance.templateMinimal": "Minimal",
  "appearance.templateMinimalDesc": "Limpo e espaçoso, imagens grandes.",
  "appearance.templateMarket": "Market",
  "appearance.templateMarketDesc": "Grelha densa, preços em destaque, prático.",
  "appearance.templateFashion": "Fashion",
  "appearance.templateFashionDesc": "Aspeto editorial, espaçamento elegante.",
  "appearance.templateRestaurant": "Restaurant",
  "appearance.templateRestaurantDesc": "Catálogo compacto, estilo menu.",
  "appearance.colors": "Cores",
  "appearance.colorsHelp":
    "O texto mantém-se legível — ajustamo-lo ao fundo escolhido.",
  "appearance.primaryColor": "Cor principal",
  "appearance.buttonColor": "Cor dos botões",
  "appearance.accentColor": "Cor de destaque",
  "appearance.backgroundColor": "Cor de fundo",
  "appearance.catalog": "Catálogo",
  "appearance.productLayout": "Layout dos produtos",
  "appearance.layoutGrid": "Grelha",
  "appearance.layoutGridDesc": "Cards de produto numa grelha responsiva.",
  "appearance.layoutList": "Lista",
  "appearance.layoutListDesc": "Linhas compactas: imagem, detalhes e botão.",
  "appearance.imageRatio": "Imagens de produto",
  "appearance.imageSquare": "Quadrada",
  "appearance.imagePortrait": "Retrato",
  "appearance.imageLandscape": "Paisagem",
  "appearance.buttonStyle": "Estilo dos botões",
  "appearance.buttonRounded": "Arredondado",
  "appearance.buttonSoft": "Suave",
  "appearance.buttonCompact": "Compacto",
  "appearance.cardStyle": "Estilo dos cards",
  "appearance.cardSubtle": "Subtil",
  "appearance.cardRounded": "Arredondado",
  "appearance.cardMinimal": "Minimal",
  "appearance.preview": "Pré-visualização",
  "appearance.previewDevice": "Dispositivo da pré-visualização",
  "appearance.previewMobile": "Mobile",
  "appearance.previewDesktop": "Desktop",
  "appearance.previewHint":
    "A pré-visualização usa os seus produtos reais. Publique ao guardar.",
  "appearance.save": "Guardar aparência",
  "appearance.saving": "A guardar…",
  "appearance.saved": "Aparência guardada.",
  "appearance.viewStore": "Ver vitrine",
  "appearance.error.optionInvalid": "Escolha opções válidas.",
  "appearance.error.colorInvalid": "Use cores hex como #2563eb.",

  // ── vitrine pública ────────────────────────────────────────────────────
  "storefront.searchPlaceholder": "Procurar produtos…",
  "storefront.categories": "Categorias",
  "storefront.allProducts": "Todos os produtos",
  "storefront.featured": "Destaques",
  "storefront.addToCart": "Adicionar ao carrinho",
  "storefront.unavailable": "Indisponível",
  "storefront.noProducts": "Ainda sem produtos",
  "storefront.noProductsBody": "A loja ainda não adicionou produtos.",
  "storefront.noResults": "Nenhum produto encontrado",
  "storefront.noResultsBody": "Tente outra pesquisa ou categoria.",
  "storefront.cart": "Carrinho",
  "storefront.cartEmpty": "O seu carrinho está vazio",
  "storefront.cartEmptyBody": "Adicione produtos para fazer uma encomenda.",
  "storefront.orderWhatsApp": "Encomendar por WhatsApp",
  "storefront.subtotal": "Subtotal",
  "storefront.increaseQty": "Aumentar quantidade",
  "storefront.decreaseQty": "Diminuir quantidade",
  "storefront.removeItem": "Remover item",
  "storefront.itemQuantity": "Quantidade",
  "storefront.storeInfo": "Informações da loja",
  "storefront.delivery": "Entrega",
  "storefront.deliveryBody": "As opções de entrega são confirmadas no WhatsApp.",
  "storefront.contact": "Contacto",
  "storefront.openingHours": "Horário",
  "storefront.followUs": "Siga-nos",
  "storefront.openCartAria": "Abrir carrinho",
  "storefront.cartCountAria": "Itens no carrinho",
  "storefront.productImageAlt": "Imagem do produto",
  "storefront.noImageAlt": "Produto sem imagem",

  // ── gestão de produtos ─────────────────────────────────────────────────
  "products.subtitle": "Gerencie os produtos da sua loja.",
  "products.new": "Novo produto",
  "products.newSubtitle": "Adicione um produto ao seu catálogo.",
  "products.empty": "Ainda sem produtos",
  "products.emptyBody": "Crie o seu primeiro produto para preencher a vitrine.",
  "products.edit": "Editar produto",
  "products.name": "Nome",
  "products.namePlaceholder": "Camisa de linho azul",
  "products.description": "Descrição",
  "products.descriptionPlaceholder": "Materiais, tamanhos, detalhes…",
  "products.price": "Preço",
  "products.promoPrice": "Preço promocional",
  "products.promoPriceHint": "Substitui o preço quando definido.",
  "products.category": "Categoria",
  "products.image": "URL da imagem",
  "products.imageHint": "Link para a foto do produto (https://…).",
  "products.imagePreview": "Pré-visualização da imagem",
  "products.available": "Disponível",
  "products.unavailable": "Indisponível",
  "products.featured": "Destaque",
  "products.featuredHint":
    "Produtos em destaque aparecem antes do catálogo principal.",
  "products.noCategory": "Sem categoria",
  "products.save": "Guardar alterações",
  "products.saved": "Produto guardado.",
  "products.create": "Criar produto",
  "products.delete": "Eliminar",
  "products.deleteConfirm": "Eliminar o produto “{name}”?",
  "products.moveUp": "Mover para cima",
  "products.moveDown": "Mover para baixo",
  "products.sectionDetails": "Detalhes",
  "products.sectionPricing": "Preços",
  "products.sectionOrganization": "Organização",
  "products.error.nameRequired": "Informe o nome do produto.",
  "products.error.nameTooLong": "O nome pode ter no máximo 120 caracteres.",
  "products.error.descriptionTooLong": "A descrição pode ter no máximo 1000 caracteres.",
  "products.error.priceInvalid": "Informe um preço válido, ex.: 1000 ou 999,99.",
  "products.error.promoPriceInvalid": "Informe um preço promocional válido.",
  "products.error.promoPriceNotBelow": "O preço promocional deve ser menor que o preço.",
  "products.error.imageInvalid": "Use um link completo (https://…) ou um caminho (/…).",
  "products.error.categoryInvalid": "Escolha uma categoria da sua loja.",
  "products.error.createFailed": "Não foi possível criar o produto. Tente novamente.",
  "products.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",

  // ── gestão de categorias ───────────────────────────────────────────────
  "categories.title": "Categorias",
  "categories.subtitle": "Organize o seu catálogo em categorias.",
  "categories.new": "Nova categoria",
  "categories.newSubtitle": "As categorias aparecem como filtros na vitrine.",
  "categories.name": "Nome",
  "categories.namePlaceholder": "Camisas",
  "categories.add": "Adicionar",
  "categories.save": "Guardar",
  "categories.saved": "Categoria guardada.",
  "categories.created": "Categoria criada.",
  "categories.empty": "Ainda sem categorias.",
  "categories.listHint":
    "Renomeie, reordene, ative ou elimine. Categorias inativas ficam ocultas da vitrine.",
  "categories.active": "Ativa",
  "categories.delete": "Eliminar",
  "categories.deleteConfirm": "Eliminar a categoria “{name}”? Os produtos são mantidos.",
  "categories.moveUp": "Mover para cima",
  "categories.moveDown": "Mover para baixo",
  "categories.error.nameRequired": "Informe o nome da categoria.",
  "categories.error.nameTooLong": "O nome pode ter no máximo 60 caracteres.",
  "categories.error.createFailed": "Não foi possível criar a categoria. Tente novamente.",
  "categories.error.saveFailed": "Não foi possível guardar as alterações. Tente novamente.",

  // ── seletor de idioma da UI ────────────────────────────────────────────
  "locale.selectorLabel": "Idioma",
  "locale.changeLanguage": "Alterar idioma da interface",

  // ── definições: idioma da interface (painel) ───────────────────────────
  "settings.uiLanguage": "Idioma da interface",
  "settings.uiLanguageHelp":
    "Idioma da plataforma Elicani — independente do idioma e da moeda da sua loja.",

  // ── landing / marketing ────────────────────────────────────────────────
  "landing.mainNav": "Navegação principal",
  "landing.footerNav": "Links do rodapé",
  "landing.navFeatures": "Recursos",
  "landing.navHow": "Como funciona",
  "landing.signIn": "Entrar",
  "landing.createStore": "Criar sua loja",
  "landing.openMenu": "Abrir menu",
  "landing.closeMenu": "Fechar menu",

  "landing.heroTitle1": "Venda online.",
  "landing.heroTitle2": "Receba encomendas no WhatsApp.",
  "landing.heroSubtitle":
    "A Elicani dá às pequenas empresas uma loja online de verdade — mostre produtos, receba encomendas, gerencie clientes e venda em qualquer moeda.",
  "landing.seeHow": "Veja como funciona",

  "landing.trust1": "Sua própria loja online",
  "landing.trust2": "Produtos e categorias",
  "landing.trust3": "Encomendas pelo WhatsApp",
  "landing.trust4": "Qualquer moeda",
  "landing.trust5": "Feito para pequenos negócios",

  "landing.featuresTitle": "Sua loja, do seu jeito",
  "landing.featuresSubtitle":
    "Tudo o que você precisa para abrir sua loja e começar a vender — sem conhecimentos técnicos.",
  "landing.feature1Title": "Sua própria loja online",
  "landing.feature1Body":
    "Crie uma loja de verdade com sua identidade, produtos e categorias.",
  "landing.feature2Title": "Catálogo simples",
  "landing.feature2Body":
    "Adicione produtos, imagens, preços e categorias sem conhecimento técnico.",
  "landing.feature3Title": "Encomendas sem complicação",
  "landing.feature3Body":
    "Os clientes navegam, adicionam ao carrinho e enviam a encomenda pelo WhatsApp.",
  "landing.feature4Title": "Moeda flexível",
  "landing.feature4Body":
    "Venda em USD, EUR, MZN, BRL ou outra moeda suportada.",
  "landing.feature5Title": "Entrega",
  "landing.feature5Body":
    "Configure áreas de entrega e taxas para seus clientes.",
  "landing.feature6Title": "Gerencie tudo",
  "landing.feature6Body":
    "Produtos, encomendas, clientes e definições da loja em um só painel.",

  "landing.howTitle": "Como funciona",
  "landing.howSubtitle": "Da ideia à primeira encomenda em três passos.",
  "landing.step1Title": "Crie sua loja",
  "landing.step1Body": "Configure as informações do seu negócio.",
  "landing.step2Title": "Adicione seus produtos",
  "landing.step2Body": "Coloque fotos, preços e categorias.",
  "landing.step3Title": "Receba encomendas",
  "landing.step3Body":
    "Os clientes compram e enviam a encomenda pelo WhatsApp.",

  "landing.previewStoreTitle": "Uma loja online de verdade, não só uma lista de produtos.",
  "landing.previewStoreBody":
    "Sua vitrine vem com cabeçalho, categorias, cards de produto, preços, busca e carrinho — pronta para compartilhar assim que você salvar.",
  "landing.previewDashTitle": "Gerencie tudo em um só painel",
  "landing.previewDashBody":
    "Produtos, encomendas, clientes, entrega e definições da loja — organizados em um só lugar.",
  "landing.colOrder": "Encomenda",
  "landing.colItems": "Itens",
  "landing.colTotal": "Total",
  "landing.colStatus": "Status",
  "landing.statusNew": "Nova",
  "landing.statusConfirmed": "Confirmada",
  "landing.statusDelivered": "Entregue",

  "landing.ctaTitle": "Pronto para colocar seu negócio online?",
  "landing.ctaBody": "Crie sua loja Elicani e comece a vender.",

  "landing.footerTagline": "Lojas online com encomendas pelo WhatsApp.",
  "landing.footerRights": "© {year} Elicani. Todos os direitos reservados.",

  "landing.pillOrder": "Encomenda enviada pelo WhatsApp",
  "landing.demoItemsOne": "{count} item",
  "landing.demoItemsMany": "{count} itens",
};

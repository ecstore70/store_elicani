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
};

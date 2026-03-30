import type en from "./en";

const es: Record<keyof typeof en, string> = {
  // Common
  "common.appName": "SHOGUN",
  "common.tagline": "La única IA que conoce tu trabajo.",
  "common.subtitle": "Recuerda todo. Hace todo.",
  "common.cta.earlyAccess": "Obtener acceso anticipado",
  "common.cta.howItWorks": "Ver cómo funciona",
  "common.loading": "Cargando...",
  "common.error": "Algo salió mal",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.delete": "Eliminar",
  "common.confirm": "Confirmar",

  // Auth
  "auth.login": "Iniciar sesión",
  "auth.signup": "Registrarse",
  "auth.logout": "Cerrar sesión",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.googleLogin": "Continuar con Google",
  "auth.noAccount": "¿No tienes una cuenta?",
  "auth.hasAccount": "¿Ya tienes una cuenta?",

  // Onboarding
  "onboarding.chooseHandle": "Elige tu handle",
  "onboarding.handleHint": "Esto se convierte en tu.syogun.com",
  "onboarding.handleTaken": "Este handle ya está en uso",
  "onboarding.provisioning": "Configurando tu servidor...",
  "onboarding.personalization": "¿Cómo debería hablarte SHOGUN?",
  "onboarding.smsSetup": "Configurar notificaciones SMS (opcional)",
  "onboarding.lineSetup": "Conectar LINE (opcional)",
  "onboarding.ready": "Tu SHOGUN está listo.",

  // Chat
  "chat.newConversation": "Nueva conversación",
  "chat.placeholder": "Pregunta lo que sea...",
  "chat.selectModel": "Seleccionar modelo",
  "chat.noConversations": "Aún no hay conversaciones",

  // Machine
  "machine.status.provisioning": "Aprovisionando...",
  "machine.status.running": "En ejecución",
  "machine.status.sleeping": "Durmiendo",
  "machine.status.stopped": "Detenido",
  "machine.status.error": "Error",
  "machine.wake": "Despertar",
  "machine.stop": "Detener",

  // Files
  "files.title": "Archivos",
  "files.upload": "Subir",
  "files.newFolder": "Nueva carpeta",
  "files.empty": "No hay archivos aquí",

  // Terminal
  "terminal.title": "Terminal",
  "terminal.connecting": "Conectando...",
  "terminal.disconnected": "Desconectado",

  // Memory
  "memory.title": "Memoria",
  "memory.search": "Buscar en tu memoria de trabajo...",
  "memory.noEntries": "Aún no hay entradas de memoria",
  "memory.screenCapture": "Captura de pantalla",
  "memory.transcript": "Transcripción de reunión",
  "memory.settings": "Configuración de memoria",
  "memory.pause": "Pausar captura",
  "memory.resume": "Reanudar captura",
  "memory.deleteEntry": "Eliminar esta entrada",
  "memory.excludeApp": "Excluir esta app",

  // Billing
  "billing.title": "Facturación",
  "billing.currentPlan": "Plan actual",
  "billing.upgrade": "Mejorar plan",
  "billing.manage": "Gestionar facturación",
  "billing.credits": "Créditos IA",
  "billing.creditsRemaining": "restantes este mes",
  "billing.byok": "Usa tu propia clave API",
  "billing.byokHint": "Usa tu propia clave API — sin cargo de créditos",

  // Tiers
  "tier.free": "Gratis",
  "tier.basic": "Básico",
  "tier.pro": "Pro",
  "tier.ultra": "Ultra",

  // Services
  "services.title": "Servicios",
  "services.deploy": "Desplegar",
  "services.noServices": "No hay servicios desplegados",

  // Automations
  "automations.title": "Automatizaciones",
  "automations.create": "Crear automatización",
  "automations.noAutomations": "No hay automatizaciones configuradas",

  // Settings
  "settings.title": "Configuración",
  "settings.profile": "Perfil",
  "settings.language": "Idioma",
  "settings.theme": "Tema",
  "settings.theme.light": "Claro",
  "settings.theme.dark": "Oscuro",
  "settings.notifications": "Notificaciones",
  "settings.apiKeys": "Claves API",
  "settings.danger": "Zona de peligro",
  "settings.deleteAccount": "Eliminar cuenta",

  // Privacy
  "privacy.title": "Privado por diseño. No por promesa.",
  "privacy.textOnly": "Solo texto — nunca tomamos capturas de pantalla",
  "privacy.encrypted": "Cifrado en reposo y en tránsito",
  "privacy.noTraining": "Nunca entrenamos con tus datos",
  "privacy.deleteAnytime": "Elimina lo que sea, cuando sea",
  "privacy.excludeApps": "Excluye cualquier app de la captura",
  "privacy.youOwnIt": "Tus datos son tuyos. Siempre.",
};

export default es;

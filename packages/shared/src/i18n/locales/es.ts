import type en from "./en";

const es: Record<keyof typeof en, string> = {
  // Common
  "common.appName": "SHOGUN",
  "common.tagline": "La única IA que conoce tu trabajo.",
  "common.subtitle": "Recuerda todo. Hace todo.",
  "common.cta.earlyAccess": "Iniciar prueba gratis",
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
  "billing.byokHint": "Conecta tu propia clave API — Claude, GPT o Gemini. Pagas directamente al proveedor.",

  // Tiers
  "tier.shogun": "SHOGUN",
  "tier.team": "Equipo",

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
  "privacy.body": "Tu memoria de trabajo es tuya. Construimos SHOGUN para que la privacidad no sea un ajuste — es la arquitectura.",

  // LP Hero
  "lp.hero.eyebrow": "Computadora IA en la Nube · Memoria de Trabajo · Automatización",
  "lp.hero.tagline": "Una IA para gobernarlos a todos.",
  "lp.hero.subtitle": "Cada herramienta. Cada pestaña. Cada tarea. Un centro de comando.",
  "lp.hero.bottomNote": "syogun.com · Desarrollado por Select KK, Tokio",

  // LP Pain
  "lp.pain.title": "Le has explicado lo mismo a la IA mil veces. Eso termina aquí.",
  "lp.pain.quote1": "El contexto es...",
  "lp.pain.quote2": "La semana pasada decidimos...",
  "lp.pain.quote3": "La razón por la que estamos construyendo esto...",
  "lp.pain.body": "Cada sesión empieza de cero. Cada herramienta te olvida. Eso termina aquí.",

  // LP Features
  "lp.features.sectionTitle": "Tres pilares. Un sistema.",
  "lp.features.memory.tag": "Memoria",
  "lp.features.memory.title": "La IA que recuerda",
  "lp.features.memory.body": "SHOGUN captura el contexto de tu trabajo — reuniones, investigación, decisiones — y construye una capa de memoria persistente. Pregúntale cualquier cosa sobre tu trabajo pasado y obtén una respuesta real.",
  "lp.features.computer.tag": "Computadora",
  "lp.features.computer.title": "Tu servidor en la nube",
  "lp.features.computer.body": "Cada usuario obtiene una máquina Linux completa — tu propia computadora en la nube. Despliega apps, ejecuta scripts, gestiona archivos. Siempre activa, siempre tuya.",
  "lp.features.command.tag": "Comando",
  "lp.features.command.title": "Todos los modelos. Un solo lugar.",
  "lp.features.command.body": "Claude, GPT-4o, Gemini — enruta al mejor modelo para la tarea. Trae tus propias claves API o usa créditos incluidos. Una interfaz, control total.",

  // LP How It Works
  "lp.howItWorks.title": "Cómo funciona",
  "lp.howItWorks.step1.title": "Instala la app de escritorio",
  "lp.howItWorks.step1.body": "Un agente ligero que observa tu flujo de trabajo — solo texto, nunca capturas de pantalla.",
  "lp.howItWorks.step2.title": "Aprende tu trabajo",
  "lp.howItWorks.step2.body": "Con el tiempo, SHOGUN construye una memoria de tus proyectos, decisiones y contexto.",
  "lp.howItWorks.step3.title": "Pregunta lo que sea",
  "lp.howItWorks.step3.body": "\"¿Qué decidimos sobre la API el martes pasado?\" — y obtén una respuesta real.",
  "lp.howItWorks.step4.title": "Hace las cosas",
  "lp.howItWorks.step4.body": "Ejecuta código, despliega servicios, automatiza tareas — todo desde una sola conversación.",

  // LP Pricing
  "lp.pricing.title": "Un plan. Todo incluido.",
  "lp.pricing.subtitle": "Sin niveles que comparar. Sin funciones bloqueadas. Solo SHOGUN.",
  "lp.pricing.monthly": "/mes",
  "lp.pricing.plan.name": "SHOGUN",
  "lp.pricing.plan.description": "Tu computadora IA en la nube. Potencia total. Sin límites.",
  "lp.pricing.plan.annualNote": "por mes, facturado anualmente ($588/año)",
  "lp.pricing.plan.monthlyNote": "por mes, facturado mensualmente",
  "lp.pricing.plan.annualSave": "Ahorra $156/año con facturación anual",
  "lp.pricing.plan.cta": "Iniciar prueba gratis de 14 días",
  "lp.pricing.plan.feature1": "Computadora dedicada en la nube (8 núcleos, 64GB RAM)",
  "lp.pricing.plan.feature2": "Memoria de trabajo — captura de pantalla, transcripción, búsqueda semántica",
  "lp.pricing.plan.feature3": "Todos los modelos IA — trae tus claves API (Claude, GPT, Gemini)",
  "lp.pricing.plan.feature4": "Dominio personalizado, servidor siempre activo, 100GB almacenamiento",
  "lp.pricing.plan.feature5": "$5 en créditos demo incluidos para probar antes de conectar tus claves",
  "lp.pricing.plan.byokNote": "Trae tus propias claves API. Nunca cobramos por uso de IA.",
  "lp.pricing.team.title": "Equipo",
  "lp.pricing.team.description": "Espacios compartidos, memoria de equipo, registros de auditoría.",
  "lp.pricing.team.cta": "Próximamente",

  // LP Waitlist
  "lp.waitlist.placeholder": "Ingresa tu email",
  "lp.waitlist.cta": "Unirse a la lista",
  "lp.waitlist.success": "Estás en la lista. Te contactaremos pronto.",

  // LP Bottom CTA
  "lp.bottomCta.title": "Deja de explicarte a la IA.",
  "lp.bottomCta.subtitle": "SHOGUN ya lo sabe.",
  "lp.bottomCta.note": "14 días de prueba gratis · $5 créditos demo · Sin recargo IA · syogun.com",

  // LP Footer
  "lp.footer.copyright": "© 2026 Select KK. Todos los derechos reservados.",
  "lp.footer.privacy": "Privacidad",
  "lp.footer.terms": "Términos",

  // Team
  "team.title": "Equipo",
  "team.create": "Crear equipo",
  "team.members": "Miembros",
  "team.shared": "Compartido",
  "team.audit": "Registro de auditoría",
  "team.settings": "Configuración",
  "team.invite": "Invitar",
  "team.remove": "Eliminar",
  "team.leave": "Salir del equipo",
  "team.role.owner": "Propietario",
  "team.role.admin": "Administrador",
  "team.role.member": "Miembro",
  "team.role.viewer": "Observador",
  "team.sso.title": "SSO / SAML",
  "team.sso.configure": "Configurar SSO",
  "team.sso.entityId": "ID de entidad SAML",
  "team.sso.ssoUrl": "URL de SSO",
  "team.sso.certificate": "Certificado",
  "team.audit.action.created": "Creado",
  "team.audit.action.updated": "Actualizado",
  "team.audit.action.deleted": "Eliminado",
  "team.audit.action.shared": "Compartido",
  "team.audit.action.invited": "Invitado",
  "team.audit.action.removed": "Eliminado",
};

export default es;

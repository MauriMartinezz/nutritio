// App shell texts: navigation, role names and the language picker.
import { defineMessages } from "@/lib/i18n/messages";

export const navMessages = defineMessages({
  en: {
    appDescription: "Nutrition plans and progress tracking for nutritionists and their clients",
    mainNav: "Main",
    home: "Home",
    signIn: "Sign in",
    createAccount: "Create an account",
    myPlans: "My meal plans",
    checkIns: "Check-ins",
    activities: "Activities",
    meetings: "Meetings",
    findNutritionist: "Find a nutritionist",
    myClients: "My clients",
    planTemplates: "Plan templates",
    nutritionists: "Nutritionists",
    users: "Users",
    requests: "Requests",
    contact: "Contact",
    profile: "Profile",
    profileOf: (name: string) => `Profile (${name})`,
  },
  es: {
    appDescription: "Planes de alimentación y seguimiento del progreso para nutricionistas y sus pacientes",
    mainNav: "Principal",
    home: "Inicio",
    signIn: "Iniciar sesión",
    createAccount: "Crear una cuenta",
    myPlans: "Mis planes",
    checkIns: "Controles",
    activities: "Actividades",
    meetings: "Reuniones",
    findNutritionist: "Buscar nutricionista",
    myClients: "Mis pacientes",
    planTemplates: "Plantillas de planes",
    nutritionists: "Nutricionistas",
    users: "Usuarios",
    requests: "Pedidos",
    contact: "Contacto",
    profile: "Perfil",
    profileOf: (name: string) => `Perfil (${name})`,
  },
});

/** Role names, shared by the nav, the profile and the home page. */
export const roleMessages = defineMessages({
  en: { ADMIN: "Administrator", NUTRITIONIST: "Nutritionist", CLIENT: "Client" },
  es: { ADMIN: "Administrador", NUTRITIONIST: "Nutricionista", CLIENT: "Paciente" },
});

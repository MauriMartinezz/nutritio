import { defineMessages } from "@/lib/i18n/messages";

export const uiMessages = defineMessages({
  en: {
    close: "Close",
    dismiss: "Dismiss",
    yes: "Yes",
    no: "No",
    breadcrumbs: "Breadcrumb",
    // One-time notices (keys of FLASH_MESSAGES in ../flash.ts).
    flash: {
      "check-in-sent": "Check-in sent. Your nutritionist will see it.",
      "access-renewed": "Access renewed.",
      "client-accepted": "Client accepted. They can now see your plans.",
      "client-declined": "Request declined.",
      "meeting-accepted": "Meeting scheduled. The client will see the date.",
      "meeting-declined": "Meeting request declined.",
    },
  },
  es: {
    close: "Cerrar",
    dismiss: "Descartar",
    yes: "Sí",
    no: "No",
    breadcrumbs: "Ruta de navegación",
    flash: {
      "check-in-sent": "Check-in enviado. Tu nutricionista lo va a ver.",
      "access-renewed": "Acceso renovado.",
      "client-accepted": "Paciente aceptado. Ya puede ver tus planes.",
      "client-declined": "Solicitud rechazada.",
      "meeting-accepted": "Reunión agendada. El paciente va a ver la fecha.",
      "meeting-declined": "Pedido de reunión rechazado.",
    },
  },
});

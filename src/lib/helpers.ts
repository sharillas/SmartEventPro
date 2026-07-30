export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export const STATUS_COLORS: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  ALUGADO: "bg-blue-100 text-blue-800",
  EM_REPARACAO: "bg-yellow-100 text-yellow-800",
  ABATIDO: "bg-red-100 text-red-800",
  EXTRAVIADO: "bg-red-100 text-red-800",
  EM_TRANSITO: "bg-purple-100 text-purple-800",
  RASCUNHO: "bg-gray-100 text-gray-800",
  ORCAMENTADO: "bg-blue-100 text-blue-800",
  CONFIRMADO: "bg-green-100 text-green-800",
  EM_CURSO: "bg-indigo-100 text-indigo-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
  ENVIADO: "bg-blue-100 text-blue-800",
  ACEITE: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  EXPIRADO: "bg-gray-100 text-gray-800",
  PENDENTE: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-green-100 text-green-800",
  VENCIDO: "bg-red-100 text-red-800",
  DEVOLVIDO: "bg-gray-100 text-gray-800",
  EM_MANUTENCAO: "bg-orange-100 text-orange-800",
};

export const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: "Disponível",
  ALUGADO: "Alugado",
  EM_REPARACAO: "Em Reparação",
  ABATIDO: "Abatido",
  EXTRAVIADO: "Extraviado",
  EM_TRANSITO: "Em Trânsito",
  RASCUNHO: "Rascunho",
  ORCAMENTADO: "Orçamentado",
  CONFIRMADO: "Confirmado",
  EM_CURSO: "Em Curso",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  ENVIADO: "Enviado",
  ACEITE: "Aceite",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  DEVOLVIDO: "Devolvido",
  EM_MANUTENCAO: "Em Manutenção",
};

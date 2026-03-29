import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte qualquer formato de data vindo da API para um Date válido.
 * Aceita: "2025-01-15", "2025-01-15T00:00:00.000Z", Date, etc.
 */
export function parseMatchDate(raw) {
  if (!raw) return null;

  // Já é um Date
  if (raw instanceof Date) return isValid(raw) ? raw : null;

  const str = String(raw);

  // Formato ISO com timezone: "2025-01-15T00:00:00.000Z"
  // Usa apenas a parte da data para evitar problemas de fuso
  const dateOnly = str.slice(0, 10); // "2025-01-15"
  const parsed = parseISO(dateOnly);
  return isValid(parsed) ? parsed : null;
}

export function formatMatchDate(raw, pattern = "dd 'de' MMM 'de' yyyy") {
  const date = parseMatchDate(raw);
  if (!date) return '—';
  return format(date, pattern, { locale: ptBR });
}
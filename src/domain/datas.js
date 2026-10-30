// Utilitários de data (aceitam Timestamp do Firestore, Date ou string)
import { Timestamp } from "firebase/firestore";

export const paraDate = (v) => (!v ? null : v.toDate ? v.toDate() : new Date(v));

/** Soma meses preservando o fim de mês (31/08 + 6 meses = 28/02, não 03/03) */
export function addMeses(data, meses) {
  const r = new Date(data);
  const dia = r.getDate();
  r.setMonth(r.getMonth() + meses);
  if (r.getDate() !== dia) r.setDate(0);
  return r;
}

/** Diferença em dias inteiros (a - b). Negativo = a está no passado em relação a b */
export function diffDias(a, b) {
  const z = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((z(a) - z(b)) / 86400000);
}

export const fmt = (v) => {
  const d = paraDate(v);
  return d ? d.toLocaleDateString("pt-BR") : "—";
};

/** Converte Date/Timestamp para o formato do <input type="date"> (yyyy-mm-dd) */
export const paraInput = (v) => {
  const d = paraDate(v);
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** yyyy-mm-dd -> Timestamp (ao meio-dia, evita virar o dia por fuso horário) */
export const deInput = (s) => Timestamp.fromDate(new Date(`${s}T12:00:00`));
export const hojeInput = () => paraInput(new Date());

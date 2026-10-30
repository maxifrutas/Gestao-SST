// REGRA CENTRAL DO MÓDULO 4: o vencimento é DERIVADO, nunca digitado.
//   data-base  = último ASO (ou data de admissão, se ainda não houver ASO)
//   vencimento = data-base + periodicidade (em meses) de cada exame exigido pelo GHE
//   cor        = vermelho (vencido) | amarelo (vence em até N dias) | verde (em dia)
import { addMeses, diffDias, paraDate } from "./datas";

const ORDEM = { verde: 0, amarelo: 1, vermelho: 2 };

export function calcularStatusFuncionario(func, ghe, config, hoje = new Date()) {
  const base = paraDate(func.ultimoAsoData) ?? paraDate(func.dataAdmissao);
  const exigidos = ghe?.examesExigidos ?? [];

  const exames = exigidos.map((ex) => {
    const vencimento = addMeses(base, ex.periodicidadeMeses);
    const diasRestantes = diffDias(vencimento, hoje); // negativo = vencido
    let cor = "verde";
    if (diasRestantes < 0) cor = "vermelho";
    else if (diasRestantes <= config.alertaAmareloDias) cor = "amarelo";
    return { ...ex, vencimento, diasRestantes, cor };
  });

  // Ordena do mais urgente para o menos urgente
  exames.sort((a, b) => a.diasRestantes - b.diasRestantes);
  const status = exames.reduce((pior, e) => (ORDEM[e.cor] > ORDEM[pior] ? e.cor : pior), "verde");
  return { exames, status, critico: exames[0] ?? null };
}

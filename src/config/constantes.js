// Constantes globais do sistema

// Valores usados se o documento config/sistema ainda não existir
export const CONFIG_PADRAO = {
  alertaAmareloDias: 60, // amarelo: vence em até 60 dias
  alertaCriticoDias: 30, // destaque extra: vence em até 30 dias
};

export const PERIODICIDADES = [6, 12, 24]; // meses
export const MOTIVOS_ENTREGA = [
  { valor: "novo", rotulo: "Primeira entrega" },
  { valor: "reposicao", rotulo: "Reposição (desgaste)" },
  { valor: "troca", rotulo: "Troca (dano/extravio)" },
];
export const TIPOS_ASO = [
  { valor: "admissional", rotulo: "Admissional" },
  { valor: "periodico", rotulo: "Periódico" },
  { valor: "retorno", rotulo: "Retorno ao trabalho" },
  { valor: "mudanca", rotulo: "Mudança de função" },
  { valor: "demissional", rotulo: "Demissional" },
];
export const RESULTADOS_ASO = [
  { valor: "apto", rotulo: "Apto" },
  { valor: "apto_com_restricao", rotulo: "Apto com restrição" },
  { valor: "inapto", rotulo: "Inapto" },
];

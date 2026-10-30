// Popula o catálogo de exames, uma empresa de exemplo, setores, GHEs e a config inicial.
// Uso: baixe a chave de serviço (Console Firebase > Contas de serviço) como serviceAccount.json
// (já está no .gitignore) e rode:  npm run seed
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: cert(JSON.parse(readFileSync("./serviceAccount.json", "utf8"))) });
const db = getFirestore();

// 1) Catálogo de exames
const nomesExames = ["Exame Clínico", "Audiometria", "Hemograma", "Ácido Hipúrico", "Acuidade Visual", "Glicemia", "Colinesterase"];
const exames = {};
for (const nome of nomesExames) {
  const ref = await db.collection("examesCatalogo").add({ nome, ativo: true, criadoEm: FieldValue.serverTimestamp() });
  exames[nome] = ref.id;
}
const ex = (nome, meses) => ({ exameId: exames[nome], nome, periodicidadeMeses: meses });

// 2) Empresa de exemplo (troque pelos dados reais no sistema; o CNPJ abaixo é fictício)
const emp = await db.collection("empresas").add({
  razaoSocial: "Empresa Exemplo de Fruticultura Ltda", nomeFantasia: "Pomar Exemplo", cnpj: "11222333000181", ativa: true, ativo: true,
  criadoEm: FieldValue.serverTimestamp(),
});

// 3) Setores
const setores = {};
for (const nome of ["Administrativo", "Pomar", "Classificação", "Embalagem", "Oficina"]) {
  setores[nome] = (await db.collection("setores").add({ empresaId: emp.id, nome, ativo: true, criadoEm: FieldValue.serverTimestamp() })).id;
}

// 4) GHEs / Cargos com exames vinculados (ajustar com o médico coordenador do PCMSO)
const ghes = [
  { nome: "Trabalhador de Pomar", codigoGhe: "GHE-01", setor: "Pomar", exames: [ex("Exame Clínico", 12)] },
  { nome: "Classificador de Frutas", codigoGhe: "GHE-02", setor: "Classificação", exames: [ex("Exame Clínico", 12)] },
  { nome: "Mecânico Agrícola", codigoGhe: "GHE-03", setor: "Oficina",
    exames: [ex("Exame Clínico", 12), ex("Audiometria", 6), ex("Hemograma", 6), ex("Ácido Hipúrico", 6)] },
  { nome: "Auxiliar Administrativo", codigoGhe: "GHE-04", setor: "Administrativo", exames: [ex("Exame Clínico", 24)] },
];
for (const g of ghes) {
  await db.collection("ghes").add({
    empresaId: emp.id, setorId: setores[g.setor], nome: g.nome, codigoGhe: g.codigoGhe, riscos: [],
    examesExigidos: g.exames, episSugeridos: [], ativo: true, criadoEm: FieldValue.serverTimestamp(),
  });
}

// 5) Configuração do sistema
await db.doc("config/sistema").set({ alertaAmareloDias: 60, alertaCriticoDias: 30 });

console.log("Seed concluído.");

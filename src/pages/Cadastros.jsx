// Módulo 1: Empresas, Setores, Cargos/GHE, Catálogo de Exames e Catálogo de EPIs
import CrudPage, { nomeDe } from "../components/CrudPage";
import { fmt, paraDate } from "../domain/datas";
import { mascaraCnpj, validarCnpj } from "../domain/validadores";

const ativoCol = { titulo: "Situação", render: (i) => (i.ativo === false ? "Inativo" : "Ativo") };
const ativoCampo = { nome: "ativo", label: "Ativo", tipo: "checkbox" };

export function Empresas() {
  return (
    <CrudPage
      titulo="Empresas"
      colecao="empresas"
      ordenarPor="razaoSocial"
      campos={[
        { nome: "razaoSocial", label: "Razão social", obrigatorio: true },
        { nome: "nomeFantasia", label: "Nome fantasia" },
        { nome: "cnpj", label: "CNPJ", obrigatorio: true, apenasDigitos: true, placeholder: "somente números" },
        ativoCampo,
      ]}
      colunas={[
        { titulo: "Razão social", render: (i) => i.razaoSocial },
        { titulo: "CNPJ", render: (i) => mascaraCnpj(i.cnpj) },
        ativoCol,
      ]}
      validar={(d) => (validarCnpj(d.cnpj) ? null : "CNPJ inválido.")}
    />
  );
}

export function Setores() {
  return (
    <CrudPage
      titulo="Setores"
      colecao="setores"
      campos={[
        { nome: "empresaId", label: "Empresa", tipo: "select", fonte: "empresas", rotuloFonte: "razaoSocial", obrigatorio: true },
        { nome: "nome", label: "Nome do setor (ex.: Pomar, Classificação, Embalagem)", obrigatorio: true },
        ativoCampo,
      ]}
      colunas={[
        { titulo: "Setor", render: (i) => i.nome },
        { titulo: "Empresa", render: (i, l) => nomeDe(l.empresas, i.empresaId, "razaoSocial") },
        ativoCol,
      ]}
    />
  );
}

export function ExamesCatalogo() {
  return (
    <CrudPage
      titulo="Catálogo de exames"
      colecao="examesCatalogo"
      campos={[
        { nome: "nome", label: "Nome do exame", obrigatorio: true },
        { nome: "codigoEsocial", label: "Código eSocial (Tabela 27) — opcional" },
        ativoCampo,
      ]}
      colunas={[{ titulo: "Exame", render: (i) => i.nome }, { titulo: "eSocial", render: (i) => i.codigoEsocial || "—" }, ativoCol]}
    />
  );
}

export function Ghes() {
  return (
    <CrudPage
      titulo="Cargos / Funções / GHE"
      colecao="ghes"
      campos={[
        { nome: "empresaId", label: "Empresa", tipo: "select", fonte: "empresas", rotuloFonte: "razaoSocial", obrigatorio: true },
        { nome: "setorId", label: "Setor", tipo: "select", fonte: "setores", filtroPor: "empresaId", obrigatorio: true },
        { nome: "nome", label: "Cargo / Função", obrigatorio: true },
        { nome: "codigoGhe", label: "Código do GHE (ex.: GHE-03)" },
        { nome: "cbo", label: "CBO" },
        { nome: "riscos", label: "Riscos (separe por vírgula)", tipo: "lista" },
        { nome: "examesExigidos", label: "Exames exigidos e periodicidade", tipo: "exames", fonte: "examesCatalogo" },
        { nome: "episSugeridos", label: "EPIs sugeridos (pré-selecionados na entrega)", tipo: "multi", fonte: "epis", rotuloFonte: "descricao" },
        ativoCampo,
      ]}
      colunas={[
        { titulo: "Cargo", render: (i) => i.nome },
        { titulo: "GHE", render: (i) => i.codigoGhe || "—" },
        { titulo: "Setor", render: (i, l) => nomeDe(l.setores, i.setorId) },
        { titulo: "Exames", render: (i) => (i.examesExigidos ?? []).map((e) => `${e.nome} (${e.periodicidadeMeses}m)`).join(", ") || "—" },
        ativoCol,
      ]}
    />
  );
}

export function Epis() {
  return (
    <CrudPage
      titulo="Catálogo de EPIs"
      colecao="epis"
      ordenarPor="descricao"
      campos={[
        { nome: "descricao", label: "Descrição", obrigatorio: true },
        { nome: "marca", label: "Marca" },
        { nome: "modelo", label: "Modelo" },
        { nome: "ca", label: "CA (Certificado de Aprovação)", obrigatorio: true, apenasDigitos: true },
        { nome: "validadeCa", label: "Validade do CA", tipo: "data", obrigatorio: true },
        ativoCampo,
      ]}
      colunas={[
        { titulo: "EPI", render: (i) => i.descricao },
        { titulo: "Marca / Modelo", render: (i) => [i.marca, i.modelo].filter(Boolean).join(" / ") || "—" },
        { titulo: "CA", render: (i) => i.ca },
        {
          titulo: "Validade CA",
          render: (i) => {
            const vencido = paraDate(i.validadeCa) < new Date();
            return <span className={vencido ? "text-red-700 font-semibold" : ""}>{fmt(i.validadeCa)}{vencido && " (vencido)"}</span>;
          },
        },
        ativoCol,
      ]}
    />
  );
}

// Módulo 2: Gestão de funcionários (sazonalidade — inativa em vez de excluir)
import CrudPage, { nomeDe } from "../components/CrudPage";
import { fmt } from "../domain/datas";
import { mascaraCpf, validarCpf } from "../domain/validadores";

export default function Funcionarios() {
  return (
    <CrudPage
      titulo="Funcionários"
      colecao="funcionarios"
      campos={[
        { nome: "matricula", label: "Código de contrato (matrícula)", obrigatorio: true },
        { nome: "nome", label: "Nome completo", obrigatorio: true },
        { nome: "cpf", label: "CPF", obrigatorio: true, apenasDigitos: true, placeholder: "somente números" },
        { nome: "dataAdmissao", label: "Data de admissão", tipo: "data", obrigatorio: true },
        { nome: "empresaId", label: "Empresa", tipo: "select", fonte: "empresas", rotuloFonte: "razaoSocial", obrigatorio: true },
        { nome: "setorId", label: "Setor", tipo: "select", fonte: "setores", filtroPor: "empresaId", obrigatorio: true },
        { nome: "gheId", label: "Cargo / GHE", tipo: "select", fonte: "ghes", filtroPor: "setorId", obrigatorio: true },
        {
          nome: "status", label: "Status", tipo: "select", obrigatorio: true, padrao: "ativo",
          opcoes: [{ valor: "ativo", rotulo: "Ativo" }, { valor: "inativo", rotulo: "Inativo" }],
        },
        { nome: "dataDesligamento", label: "Data de desligamento (se inativo)", tipo: "data" },
      ]}
      colunas={[
        { titulo: "Matrícula", render: (i) => i.matricula },
        { titulo: "Nome", render: (i) => i.nome },
        { titulo: "CPF", render: (i) => mascaraCpf(i.cpf) },
        { titulo: "Cargo / GHE", render: (i) => i.gheNome || "—" },
        { titulo: "Setor", render: (i, l) => nomeDe(l.setores, i.setorId) },
        { titulo: "Admissão", render: (i) => fmt(i.dataAdmissao) },
        {
          titulo: "Status",
          render: (i) => <span className={i.status === "ativo" ? "text-green-700" : "text-stone-500"}>{i.status === "ativo" ? "Ativo" : "Inativo"}</span>,
        },
      ]}
      validar={(d, itens, id) => {
        if (!validarCpf(d.cpf)) return "CPF inválido.";
        if (itens.some((f) => f.id !== id && f.matricula === d.matricula)) return "Já existe um funcionário com esta matrícula.";
        const outro = itens.find((f) => f.id !== id && f.cpf === d.cpf && f.status === "ativo");
        if (d.status === "ativo" && outro) return `Este CPF já tem um contrato ativo (matrícula ${outro.matricula}). Inative-o antes.`;
        return null;
      }}
      // Guarda o nome do cargo no próprio funcionário (evita leituras extras no painel)
      transformar={(d, listas) => ({ ...d, gheNome: nomeDe(listas.ghes, d.gheId) })}
    />
  );
}

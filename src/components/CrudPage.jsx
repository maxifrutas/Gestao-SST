// Página de cadastro genérica, guiada por configuração (campos + colunas).
// Usada em: Empresas, Setores, Cargos/GHE, Catálogo de Exames, Catálogo de EPIs e Funcionários.
import { useEffect, useMemo, useState } from "react";
import { criarService } from "../services/crud";
import { useAuth } from "../contexts/AuthContext";
import { Botao, Campo, Erro, Modal, Titulo, inputCls } from "./ui";
import { deInput, paraInput } from "../domain/datas";
import { PERIODICIDADES } from "../config/constantes";

export const nomeDe = (lista = [], id, campo = "nome") => lista.find((i) => i.id === id)?.[campo] ?? "—";

const valorInicial = (c) => c.padrao ?? (["exames", "multi"].includes(c.tipo) ? [] : c.tipo === "checkbox" ? true : "");

export default function CrudPage({ titulo, colecao, campos, colunas, validar, transformar, ordenarPor = "nome" }) {
  const svc = useMemo(() => criarService(colecao), [colecao]);
  const { podeEscrever } = useAuth();
  const [itens, setItens] = useState([]);
  const [listas, setListas] = useState({}); // coleções usadas em selects/multi/exames
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState("");
  const [erroPagina, setErroPagina] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const fontes = [...new Set(campos.map((c) => c.fonte).filter(Boolean))];
    const [lista, ...outras] = await Promise.all([svc.listar(), ...fontes.map((f) => criarService(f).listar())]);
    setItens(lista);
    setListas(Object.fromEntries(fontes.map((f, i) => [f, outras[i]])));
  }
  useEffect(() => {
    carregar().catch((e) => setErroPagina(e.message));
  }, [colecao]);

  const abrirNovo = () => {
    setEditId(null);
    setErro("");
    setForm(Object.fromEntries(campos.map((c) => [c.nome, valorInicial(c)])));
  };
  const abrirEditar = (item) => {
    setEditId(item.id);
    setErro("");
    setForm(
      Object.fromEntries(
        campos.map((c) => {
          const v = item[c.nome];
          if (c.tipo === "data") return [c.nome, paraInput(v)];
          if (c.tipo === "lista") return [c.nome, (v ?? []).join(", ")];
          return [c.nome, v ?? valorInicial(c)];
        })
      )
    );
  };

  // Ao mudar um campo, limpa os campos dependentes (ex.: mudou a empresa -> limpa o setor)
  const alterar = (nome, valor) =>
    setForm((f) => {
      const novo = { ...f, [nome]: valor };
      campos.filter((c) => c.filtroPor === nome).forEach((c) => (novo[c.nome] = ""));
      return novo;
    });

  async function salvar() {
    setErro("");
    const dados = { ...form };
    for (const c of campos) {
      const v = dados[c.nome];
      if (c.obrigatorio && (v === "" || v == null)) return setErro(`Preencha o campo "${c.label}".`);
      if (typeof v === "string") dados[c.nome] = v.trim();
      if (c.apenasDigitos) dados[c.nome] = String(v ?? "").replace(/\D/g, "");
      if (c.tipo === "data") dados[c.nome] = v ? deInput(v) : null;
      if (c.tipo === "lista") dados[c.nome] = String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    }
    const msg = validar?.(dados, itens, editId);
    if (msg) return setErro(msg);
    try {
      setSalvando(true);
      await svc.salvar(transformar ? transformar(dados, listas) : dados, editId);
      setForm(null);
      await carregar();
    } catch (e) {
      setErro(e.code === "permission-denied" ? "Sem permissão para salvar. Verifique seu perfil de acesso." : e.message);
    } finally {
      setSalvando(false);
    }
  }

  const filtrados = itens
    .filter((i) => !busca || JSON.stringify(i).toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => String(a[ordenarPor] ?? "").localeCompare(String(b[ordenarPor] ?? ""), "pt-BR"));

  function renderCampo(c) {
    const v = form[c.nome];
    const lista = (listas[c.fonte] ?? []).filter(
      (i) => (!c.filtroPor || i[c.filtroPor] === form[c.filtroPor]) && i.ativo !== false
    );
    const rotuloFonte = (i) => i[c.rotuloFonte ?? "nome"];

    switch (c.tipo) {
      case "select": {
        const opcoes = c.opcoes ?? lista.map((i) => ({ valor: i.id, rotulo: rotuloFonte(i) }));
        return (
          <select className={inputCls} value={v} onChange={(e) => alterar(c.nome, e.target.value)}>
            <option value="">Selecione…</option>
            {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        );
      }
      case "checkbox":
        return <input type="checkbox" checked={!!v} onChange={(e) => alterar(c.nome, e.target.checked)} className="h-4 w-4" />;
      case "data":
        return <input type="date" className={inputCls} value={v} onChange={(e) => alterar(c.nome, e.target.value)} />;
      case "multi":
        return (
          <div className="border rounded p-2 max-h-40 overflow-auto space-y-1">
            {lista.map((i) => (
              <label key={i.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={v.includes(i.id)}
                  onChange={(e) => alterar(c.nome, e.target.checked ? [...v, i.id] : v.filter((x) => x !== i.id))}
                />
                {rotuloFonte(i)}
              </label>
            ))}
          </div>
        );
      case "exames":
        return <ExamesEditor valor={v} catalogo={lista} aoMudar={(x) => alterar(c.nome, x)} />;
      default:
        return <input className={inputCls} value={v} placeholder={c.placeholder} onChange={(e) => alterar(c.nome, e.target.value)} />;
    }
  }

  return (
    <div>
      <Titulo>{titulo}</Titulo>
      <Erro>{erroPagina}</Erro>
      <div className="flex gap-2 mb-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        {podeEscrever && <Botao onClick={abrirNovo}>Novo cadastro</Botao>}
      </div>

      <div className="bg-white border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left">
            <tr>
              {colunas.map((c) => <th key={c.titulo} className="px-3 py-2">{c.titulo}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((i) => (
              <tr key={i.id} className="border-t">
                {colunas.map((c) => <td key={c.titulo} className="px-3 py-2">{c.render(i, listas)}</td>)}
                <td className="px-3 py-2 text-right">
                  {podeEscrever && <button className="text-emerald-800 underline" onClick={() => abrirEditar(i)}>Editar</button>}
                </td>
              </tr>
            ))}
            {!filtrados.length && (
              <tr><td className="px-3 py-6 text-center text-stone-500" colSpan={colunas.length + 1}>Nenhum registro. Use "Novo cadastro" para começar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={editId ? "Editar cadastro" : "Novo cadastro"} aoFechar={() => setForm(null)}>
          <div className="grid gap-3">
            {campos.map((c) => <Campo key={c.nome} label={c.label}>{renderCampo(c)}</Campo>)}
          </div>
          <Erro>{erro}</Erro>
          <div className="flex justify-end gap-2 mt-4">
            <Botao variante="sec" onClick={() => setForm(null)}>Cancelar</Botao>
            <Botao onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Botao>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Editor dos exames exigidos pelo Cargo/GHE: escolhe o exame do catálogo + periodicidade
function ExamesEditor({ valor, catalogo, aoMudar }) {
  const [exameId, setExameId] = useState("");
  const [meses, setMeses] = useState(12);

  const adicionar = () => {
    const ex = catalogo.find((e) => e.id === exameId);
    if (!ex || valor.some((v) => v.exameId === exameId)) return;
    aoMudar([...valor, { exameId, nome: ex.nome, periodicidadeMeses: Number(meses) }]); // nome denormalizado
    setExameId("");
  };

  return (
    <div className="border rounded p-2 space-y-2">
      {valor.map((v) => (
        <div key={v.exameId} className="flex justify-between text-sm bg-stone-50 rounded px-2 py-1">
          <span>{v.nome} — a cada {v.periodicidadeMeses} meses</span>
          <button type="button" className="text-red-700" onClick={() => aoMudar(valor.filter((x) => x.exameId !== v.exameId))}>remover</button>
        </div>
      ))}
      <div className="flex gap-2">
        <select className={inputCls} value={exameId} onChange={(e) => setExameId(e.target.value)}>
          <option value="">Adicionar exame…</option>
          {catalogo.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className={`${inputCls} w-32`} value={meses} onChange={(e) => setMeses(e.target.value)}>
          {PERIODICIDADES.map((m) => <option key={m} value={m}>{m} meses</option>)}
        </select>
        <Botao type="button" variante="sec" onClick={adicionar}>Incluir</Botao>
      </div>
    </div>
  );
}

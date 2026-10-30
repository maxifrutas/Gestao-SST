// Módulo 3: registra a entrega de EPIs e gera a Ficha em PDF
import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Aviso, Botao, Campo, Erro, Titulo, inputCls } from "../components/ui";
import { deInput, fmt, hojeInput, paraDate } from "../domain/datas";
import { MOTIVOS_ENTREGA } from "../config/constantes";
import { gerarFichaEpi } from "../pdf/gerarFichaEpi";

const lerTudo = async (nome) => (await getDocs(collection(db, nome))).docs.map((d) => ({ id: d.id, ...d.data() }));

export default function EntregaEpi() {
  const { podeEscrever } = useAuth();
  const [dados, setDados] = useState({ funcs: [], epis: [], ghes: [], empresas: [], setores: [] });
  const [funcId, setFuncId] = useState("");
  const [data, setData] = useState(hojeInput());
  const [sel, setSel] = useState({}); // epiId -> { marcado, quantidade, motivo }
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all(["funcionarios", "epis", "ghes", "empresas", "setores"].map(lerTudo))
      .then(([funcs, epis, ghes, empresas, setores]) =>
        setDados({ funcs: funcs.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), epis: epis.filter((e) => e.ativo !== false), ghes, empresas, setores })
      )
      .catch((e) => setErro(e.message));
  }, []);

  const func = dados.funcs.find((f) => f.id === funcId);

  async function carregarHistorico(id) {
    const q = query(collection(db, "entregasEpi"), where("funcionarioId", "==", id), orderBy("dataEntrega", "desc"));
    setHistorico((await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function escolherFuncionario(id) {
    setFuncId(id); setMsg(""); setErro("");
    const f = dados.funcs.find((x) => x.id === id);
    const sugeridos = dados.ghes.find((g) => g.id === f?.gheId)?.episSugeridos ?? [];
    // Pré-seleciona os EPIs sugeridos para o cargo
    setSel(Object.fromEntries(sugeridos.map((e) => [e, { marcado: true, quantidade: 1, motivo: "novo" }])));
    setHistorico([]);
    if (id) try { await carregarHistorico(id); } catch (e) { setErro(e.message); }
  }

  const atualizar = (id, campo, valor) =>
    setSel((s) => ({ ...s, [id]: { marcado: false, quantidade: 1, motivo: "novo", ...s[id], [campo]: valor } }));

  // Dados do documento para o PDF / snapshot
  const contexto = () => {
    const emp = dados.empresas.find((e) => e.id === func.empresaId) ?? {};
    return {
      empresa: { razaoSocial: emp.razaoSocial, cnpj: emp.cnpj },
      funcionario: {
        nome: func.nome, cpf: func.cpf, matricula: func.matricula, gheNome: func.gheNome,
        setorNome: dados.setores.find((s) => s.id === func.setorId)?.nome, dataAdmissao: func.dataAdmissao,
      },
    };
  };

  async function registrar() {
    setErro(""); setMsg("");
    const itens = dados.epis
      .filter((e) => sel[e.id]?.marcado)
      .map((e) => ({ epiId: e.id, descricao: e.descricao, marca: e.marca ?? "", modelo: e.modelo ?? "", ca: e.ca, validadeCa: e.validadeCa, quantidade: Number(sel[e.id].quantidade) || 1, motivo: sel[e.id].motivo }));
    if (!func) return setErro("Selecione o funcionário.");
    if (!itens.length) return setErro("Marque ao menos um EPI.");
    const dataEntrega = deInput(data);
    const vencido = itens.find((i) => paraDate(i.validadeCa) < paraDate(dataEntrega));
    if (vencido) return setErro(`O CA ${vencido.ca} (${vencido.descricao}) está vencido. Atualize o catálogo antes de entregar.`);

    try {
      const { empresa, funcionario } = contexto();
      const nova = {
        funcionarioId: func.id, funcionarioSnapshot: funcionario, empresaSnapshot: empresa, // snapshot imutável
        dataEntrega, itens: itens.map(({ validadeCa, ...resto }) => resto),
        registradoPor: auth.currentUser.uid, criadoEm: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "entregasEpi"), nova);
      await carregarHistorico(func.id);
      setMsg("Entrega registrada. Gerando PDF…");
      await gerarFichaEpi({ empresa, funcionario, entregas: [...historico, { ...nova, id: ref.id }] });
      setMsg("Entrega registrada e ficha gerada. Imprima e colha a assinatura do colaborador.");
    } catch (e) {
      setErro(e.code === "permission-denied" ? "Sem permissão para registrar entrega." : e.message);
    }
  }

  return (
    <div className="max-w-4xl">
      <Titulo>Entrega de EPI</Titulo>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Campo label="Funcionário">
          <select className={inputCls} value={funcId} onChange={(e) => escolherFuncionario(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.funcs.filter((f) => f.status === "ativo").map((f) => <option key={f.id} value={f.id}>{f.nome} — {f.matricula} ({f.gheNome})</option>)}
          </select>
        </Campo>
        <Campo label="Data da entrega"><input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></Campo>
      </div>

      {func && (
        <>
          <div className="bg-white border rounded overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left"><tr><th className="px-3 py-2" /><th className="px-3 py-2">EPI</th><th className="px-3 py-2">CA</th><th className="px-3 py-2">Qtd</th><th className="px-3 py-2">Motivo</th></tr></thead>
              <tbody>
                {dados.epis.map((e) => {
                  const s = sel[e.id] ?? {};
                  const vencido = paraDate(e.validadeCa) < new Date();
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-3 py-2"><input type="checkbox" checked={!!s.marcado} onChange={(ev) => atualizar(e.id, "marcado", ev.target.checked)} /></td>
                      <td className="px-3 py-2">{e.descricao}<div className="text-xs text-stone-500">{[e.marca, e.modelo].filter(Boolean).join(" / ")}</div></td>
                      <td className="px-3 py-2">{e.ca}{vencido && <div className="text-xs text-red-700">CA vencido</div>}</td>
                      <td className="px-3 py-2"><input type="number" min="1" className={`${inputCls} w-16`} value={s.quantidade ?? 1} onChange={(ev) => atualizar(e.id, "quantidade", ev.target.value)} /></td>
                      <td className="px-3 py-2"><select className={inputCls} value={s.motivo ?? "novo"} onChange={(ev) => atualizar(e.id, "motivo", ev.target.value)}>{MOTIVOS_ENTREGA.map((m) => <option key={m.valor} value={m.valor}>{m.rotulo}</option>)}</select></td>
                    </tr>
                  );
                })}
                {!dados.epis.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-stone-500">Cadastre os EPIs no catálogo primeiro.</td></tr>}
              </tbody>
            </table>
          </div>
          <Erro>{erro}</Erro><Aviso>{msg}</Aviso>
          <div className="flex gap-2 mt-3">
            <Botao onClick={registrar} disabled={!podeEscrever}>Registrar entrega e gerar PDF</Botao>
            <Botao variante="sec" disabled={!historico.length} onClick={() => gerarFichaEpi({ ...contexto(), entregas: historico })}>Gerar ficha completa (histórico)</Botao>
          </div>

          <h2 className="font-semibold mt-6 mb-2">Entregas anteriores</h2>
          <ul className="text-sm bg-white border rounded divide-y">
            {historico.map((h) => <li key={h.id} className="px-3 py-2"><b>{fmt(h.dataEntrega)}</b> — {h.itens.map((i) => `${i.descricao} (CA ${i.ca}) x${i.quantidade}`).join("; ")}</li>)}
            {!historico.length && <li className="px-3 py-3 text-stone-500">Nenhuma entrega registrada.</li>}
          </ul>
        </>
      )}
      {!func && <Erro>{erro}</Erro>}
    </div>
  );
}

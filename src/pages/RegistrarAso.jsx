// Registra um ASO. Isso REINICIA os prazos dos exames do GHE (última data-base = data do ASO).
// Regra a validar com o médico coordenador do PCMSO: aqui um ASO renova todos os exames do GHE.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Aviso, Botao, Campo, Erro, Titulo, inputCls } from "../components/ui";
import { deInput, hojeInput, paraDate } from "../domain/datas";
import { RESULTADOS_ASO, TIPOS_ASO } from "../config/constantes";

export default function RegistrarAso() {
  const { podeEscrever } = useAuth();
  const [params] = useSearchParams();
  const [funcs, setFuncs] = useState([]);
  const [form, setForm] = useState({ funcionarioId: params.get("func") ?? "", tipo: "periodico", data: hojeInput(), resultado: "apto", medico: "", observacao: "" });
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "funcionarios"), where("status", "==", "ativo")))
      .then((s) => setFuncs(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))))
      .catch((e) => setErro(e.message));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function salvar() {
    setErro(""); setMsg("");
    if (!form.funcionarioId || !form.data || !form.medico.trim()) return setErro("Informe funcionário, data e médico responsável.");
    const func = funcs.find((f) => f.id === form.funcionarioId);
    const data = deInput(form.data);
    try {
      const batch = writeBatch(db);
      batch.set(doc(collection(db, "asos")), {
        funcionarioId: func.id, tipo: form.tipo, dataRealizacao: data, resultado: form.resultado,
        medico: form.medico.trim(), observacao: form.observacao.trim(),
        registradoPor: auth.currentUser.uid, criadoEm: serverTimestamp(),
      });
      // Atualiza a data-base do funcionário somente se este ASO for o mais recente
      const atual = paraDate(func.ultimoAsoData);
      if (form.tipo !== "demissional" && (!atual || paraDate(data) > atual)) {
        batch.update(doc(db, "funcionarios", func.id), { ultimoAsoData: data, atualizadoEm: serverTimestamp() });
        func.ultimoAsoData = data;
      }
      await batch.commit();
      setMsg(`ASO de ${func.nome} registrado. Os vencimentos foram recalculados.`);
      setForm({ ...form, funcionarioId: "", medico: "", observacao: "" });
    } catch (e) {
      setErro(e.code === "permission-denied" ? "Sem permissão para registrar ASO." : e.message);
    }
  }

  return (
    <div className="max-w-xl">
      <Titulo>Registrar ASO</Titulo>
      <div className="grid gap-3 bg-white border rounded p-4">
        <Campo label="Funcionário (ativos)">
          <select className={inputCls} value={form.funcionarioId} onChange={set("funcionarioId")}>
            <option value="">Selecione…</option>
            {funcs.map((f) => <option key={f.id} value={f.id}>{f.nome} — {f.matricula}</option>)}
          </select>
        </Campo>
        <Campo label="Tipo de ASO"><select className={inputCls} value={form.tipo} onChange={set("tipo")}>{TIPOS_ASO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></Campo>
        <Campo label="Data de realização"><input type="date" className={inputCls} value={form.data} onChange={set("data")} /></Campo>
        <Campo label="Resultado"><select className={inputCls} value={form.resultado} onChange={set("resultado")}>{RESULTADOS_ASO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></Campo>
        <Campo label="Médico responsável (nome e CRM)"><input className={inputCls} value={form.medico} onChange={set("medico")} /></Campo>
        <Campo label="Observação"><input className={inputCls} value={form.observacao} onChange={set("observacao")} /></Campo>
        <Erro>{erro}</Erro><Aviso>{msg}</Aviso>
        <div><Botao onClick={salvar} disabled={!podeEscrever}>Registrar ASO</Botao></div>
      </div>
    </div>
  );
}

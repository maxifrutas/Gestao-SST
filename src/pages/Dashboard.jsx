// Módulo 4: Painel de alertas de exames (verde / amarelo / vermelho), calculado automaticamente
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDadosExames } from "../hooks/useDadosExames";
import { calcularStatusFuncionario } from "../domain/statusExame";
import { fmt } from "../domain/datas";
import { Badge, Erro, Titulo, inputCls } from "../components/ui";

const TXT = { verde: "text-green-700", amarelo: "text-yellow-700", vermelho: "text-red-700" };

export default function Dashboard() {
  const { carregando, funcs, ghes, config, erro } = useDadosExames();
  const [janela, setJanela] = useState(60); // amarelo: 30 ou 60 dias
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const linhas = useMemo(
    () =>
      funcs
        .map((f) => ({ f, ...calcularStatusFuncionario(f, ghes[f.gheId], { ...config, alertaAmareloDias: janela }) }))
        .sort((a, b) => (a.critico?.diasRestantes ?? 9999) - (b.critico?.diasRestantes ?? 9999)),
    [funcs, ghes, config, janela]
  );

  const total = (cor) => linhas.filter((l) => l.status === cor).length;
  const visiveis = linhas.filter(
    (l) =>
      (filtro === "todos" || l.status === filtro) &&
      (!busca || `${l.f.nome} ${l.f.matricula} ${l.f.gheNome}`.toLowerCase().includes(busca.toLowerCase()))
  );

  if (carregando) return <p>Carregando painel…</p>;

  const cards = [
    ["vermelho", "Vencidos", "border-red-500 bg-red-50"],
    ["amarelo", `A vencer em ${janela} dias`, "border-yellow-500 bg-yellow-50"],
    ["verde", "Em dia", "border-green-600 bg-green-50"],
  ];

  return (
    <div>
      <Titulo>Painel de exames periódicos</Titulo>
      <Erro>{erro}</Erro>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {cards.map(([cor, rotulo, cls]) => (
          <button
            key={cor}
            onClick={() => setFiltro(filtro === cor ? "todos" : cor)}
            className={`text-left border-l-4 rounded p-4 ${cls} ${filtro === cor ? "ring-2 ring-stone-700" : ""}`}
          >
            <div className="text-3xl font-bold">{total(cor)}</div>
            <div className="text-sm">{rotulo}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3 items-center">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar nome, matrícula ou cargo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${inputCls} w-48`} value={janela} onChange={(e) => setJanela(Number(e.target.value))}>
          <option value={30}>Alertar com 30 dias</option>
          <option value={60}>Alertar com 60 dias</option>
        </select>
        <span className="text-sm text-stone-500">{visiveis.length} funcionário(s) ativo(s)</span>
      </div>

      <div className="bg-white border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left">
            <tr>
              <th className="px-3 py-2">Funcionário</th><th className="px-3 py-2">Cargo / GHE</th>
              <th className="px-3 py-2">Exame mais urgente</th><th className="px-3 py-2">Vencimento</th>
              <th className="px-3 py-2">Situação</th><th />
            </tr>
          </thead>
          <tbody>
            {visiveis.map(({ f, exames, status, critico }) => (
              <tr key={f.id} className="border-t align-top">
                <td className="px-3 py-2"><div className="font-medium">{f.nome}</div><div className="text-xs text-stone-500">{f.matricula}</div></td>
                <td className="px-3 py-2">{f.gheNome}</td>
                <td className="px-3 py-2">
                  {critico ? critico.nome : <span className="text-stone-400">GHE sem exames vinculados</span>}
                  <div className="text-xs mt-1 space-x-2">
                    {exames.slice(1).map((e) => <span key={e.exameId} className={TXT[e.cor]}>{e.nome} ({e.diasRestantes}d)</span>)}
                  </div>
                </td>
                <td className="px-3 py-2">{critico ? <>{fmt(critico.vencimento)}<div className={`text-xs ${TXT[critico.cor]}`}>{critico.diasRestantes < 0 ? `${-critico.diasRestantes} dias em atraso` : `faltam ${critico.diasRestantes} dias`}</div></> : "—"}</td>
                <td className="px-3 py-2"><Badge cor={status} /></td>
                <td className="px-3 py-2"><Link className="text-emerald-800 underline" to={`/aso?func=${f.id}`}>Registrar ASO</Link></td>
              </tr>
            ))}
            {!visiveis.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-stone-500">Nenhum funcionário nesta situação.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

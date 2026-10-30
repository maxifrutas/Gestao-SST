// Componentes visuais reutilizáveis
export const inputCls =
  "w-full border border-stone-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600";

export function Botao({ variante = "primario", className = "", ...props }) {
  const estilos = {
    primario: "bg-emerald-800 text-white hover:bg-emerald-900",
    sec: "bg-white border border-stone-300 hover:bg-stone-100",
  }[variante];
  return <button className={`px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 ${estilos} ${className}`} {...props} />;
}

export function Campo({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ titulo, aoFechar, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-auto p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mt-8">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={aoFechar} className="text-stone-500 hover:text-stone-900 text-xl leading-none" aria-label="Fechar">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const CORES = {
  verde: ["Em dia", "bg-green-100 text-green-800"],
  amarelo: ["A vencer", "bg-yellow-100 text-yellow-800"],
  vermelho: ["Vencido", "bg-red-100 text-red-800"],
};
export function Badge({ cor }) {
  const [texto, cls] = CORES[cor];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{texto}</span>;
}

export const Titulo = ({ children }) => <h1 className="text-xl font-semibold mb-4">{children}</h1>;
export const Erro = ({ children }) => (children ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 my-2">{children}</p> : null);
export const Aviso = ({ children }) => (children ? <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 my-2">{children}</p> : null);

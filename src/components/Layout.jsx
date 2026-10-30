// Estrutura da aplicação: menu lateral + área de conteúdo + proteção de rota
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Botao } from "./ui";

const MENU = [
  ["/", "Painel de exames"],
  ["/aso", "Registrar ASO"],
  ["/entrega-epi", "Entrega de EPI"],
  ["/funcionarios", "Funcionários"],
  ["/empresas", "Empresas"],
  ["/setores", "Setores"],
  ["/ghes", "Cargos / GHE"],
  ["/exames-catalogo", "Catálogo de exames"],
  ["/epis", "Catálogo de EPIs"],
];

export default function Layout() {
  const { usuario, perfil, role, carregando, sair } = useAuth();

  if (carregando) return <p className="p-6">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!role)
    return (
      <div className="p-6 max-w-md">
        <p className="mb-3">Seu usuário ainda não tem perfil de acesso ativo. Peça ao administrador para liberar.</p>
        <Botao onClick={sair}>Sair</Botao>
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-56 bg-emerald-950 text-emerald-50 p-3 shrink-0">
        <div className="font-bold px-2 py-3">SST Fruticultura</div>
        <nav className="space-y-1">
          {MENU.map(([to, rotulo]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `block px-2 py-1.5 rounded text-sm ${isActive ? "bg-emerald-700" : "hover:bg-emerald-900"}`
              }
            >
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 px-2 text-xs text-emerald-200">
          {perfil?.nome || usuario.email}
          <br />
          Perfil: {role}
          <button onClick={sair} className="block mt-2 underline">Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Rotas da aplicação
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Empresas, Setores, Ghes, ExamesCatalogo, Epis } from "./pages/Cadastros";
import Funcionarios from "./pages/Funcionarios";
import EntregaEpi from "./pages/EntregaEpi";
import RegistrarAso from "./pages/RegistrarAso";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/aso" element={<RegistrarAso />} />
        <Route path="/entrega-epi" element={<EntregaEpi />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/setores" element={<Setores />} />
        <Route path="/ghes" element={<Ghes />} />
        <Route path="/exames-catalogo" element={<ExamesCatalogo />} />
        <Route path="/epis" element={<Epis />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

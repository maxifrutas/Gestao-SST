import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Botao, Campo, Erro, inputCls } from "../components/ui";

export default function Login() {
  const { usuario, entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    try {
      await entrar(email, senha);
    } catch {
      setErro("E-mail ou senha incorretos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={enviar} className="bg-white border rounded-lg p-6 w-full max-w-sm space-y-3 shadow-sm">
        <h1 className="text-lg font-semibold">SST Fruticultura</h1>
        <Campo label="E-mail"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></Campo>
        <Campo label="Senha"><input type="password" className={inputCls} value={senha} onChange={(e) => setSenha(e.target.value)} required /></Campo>
        <Erro>{erro}</Erro>
        <Botao type="submit" className="w-full">Entrar</Botao>
      </form>
    </div>
  );
}

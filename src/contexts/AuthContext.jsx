// Controla o usuário logado e seu perfil (admin | sst | rh | consulta) guardado em usuarios/{uid}
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUsuario(u);
        if (u) {
          try {
            const snap = await getDoc(doc(db, "usuarios", u.uid));
            setPerfil(snap.exists() ? snap.data() : null);
          } catch {
            setPerfil(null);
          }
        } else {
          setPerfil(null);
        }
        setCarregando(false);
      }),
    []
  );

  const role = perfil?.ativo ? perfil.role : null;
  const valor = {
    usuario,
    perfil,
    role,
    podeEscrever: ["admin", "sst"].includes(role),
    carregando,
    entrar: (email, senha) => signInWithEmailAndPassword(auth, email, senha),
    sair: () => signOut(auth),
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

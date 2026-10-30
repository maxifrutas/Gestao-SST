// Carrega funcionários ativos, GHEs e configuração (1 vez) para o painel de exames
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { CONFIG_PADRAO } from "../config/constantes";

export function useDadosExames() {
  const [estado, setEstado] = useState({ carregando: true, funcs: [], ghes: {}, config: CONFIG_PADRAO, erro: "" });

  useEffect(() => {
    (async () => {
      try {
        const [funcs, ghes, cfg] = await Promise.all([
          getDocs(query(collection(db, "funcionarios"), where("status", "==", "ativo"))),
          getDocs(collection(db, "ghes")),
          getDoc(doc(db, "config", "sistema")),
        ]);
        setEstado({
          carregando: false,
          erro: "",
          funcs: funcs.docs.map((d) => ({ id: d.id, ...d.data() })),
          ghes: Object.fromEntries(ghes.docs.map((d) => [d.id, { id: d.id, ...d.data() }])),
          config: { ...CONFIG_PADRAO, ...(cfg.exists() ? cfg.data() : {}) },
        });
      } catch (e) {
        setEstado((s) => ({ ...s, carregando: false, erro: e.message }));
      }
    })();
  }, []);

  return estado;
}

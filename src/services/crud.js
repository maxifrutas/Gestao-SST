// Serviço genérico de acesso ao Firestore: uma fábrica para qualquer collection.
// Não existe exclusão física — registros são inativados (exigência legal de guarda).
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export function criarService(nomeColecao) {
  const col = collection(db, nomeColecao);
  return {
    async listar() {
      const snap = await getDocs(col);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async salvar(dados, id) {
      if (id) {
        await updateDoc(doc(db, nomeColecao, id), { ...dados, atualizadoEm: serverTimestamp() });
        return id;
      }
      const ref = await addDoc(col, {
        ...dados,
        criadoEm: serverTimestamp(),
        criadoPor: auth.currentUser?.uid ?? null,
      });
      return ref.id;
    },
  };
}

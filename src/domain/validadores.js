// Validadores e máscaras de documentos brasileiros
export const apenasDigitos = (s) => String(s ?? "").replace(/\D/g, "");

export function validarCpf(v) {
  const c = apenasDigitos(v);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

export function validarCnpj(v) {
  const c = apenasDigitos(v);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const dv = (n) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * pesos[i];
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

export const mascaraCpf = (v) => apenasDigitos(v).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
export const mascaraCnpj = (v) => apenasDigitos(v).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

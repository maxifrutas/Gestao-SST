// Gera a Ficha de Controle de Entrega de EPI em PDF (A4, retrato).
// Mostra o histórico cumulativo de entregas do funcionário, com coluna em branco para assinatura manual.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TERMO_EPI } from "./termoResponsabilidade";
import { fmt, paraDate } from "../domain/datas";
import { mascaraCnpj, mascaraCpf } from "../domain/validadores";
import { MOTIVOS_ENTREGA } from "../config/constantes";

// Logo opcional em /public/logo-empresa.png (se não existir, o cabeçalho sai só com texto)
async function carregarLogo() {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}logo-empresa.png`);
    const b = await r.blob();
    if (!r.ok || !b.type.startsWith("image/")) return null;
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

/**
 * @param empresa     { razaoSocial, cnpj }
 * @param funcionario { nome, cpf, matricula, gheNome, setorNome, dataAdmissao }
 * @param entregas    lista de documentos de entregasEpi do funcionário
 */
export async function gerarFichaEpi({ empresa, funcionario, entregas }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 10;
  const logo = await carregarLogo();

  // ---- Rodapé com termo legal (desenhado em TODAS as páginas) ----
  doc.setFontSize(7.5);
  const linhasTermo = doc.splitTextToSize(TERMO_EPI, W - 2 * M);
  const alturaRodape = linhasTermo.length * 3.1 + 20;
  const desenharRodape = () => {
    const y0 = H - alturaRodape - 4;
    doc.setDrawColor(120).rect(M, y0, W - 2 * M, alturaRodape);
    doc.setFont("helvetica", "bold").setFontSize(8).text("TERMO DE RESPONSABILIDADE", M + 2, y0 + 4);
    doc.setFont("helvetica", "normal").setFontSize(7.5).text(linhasTermo, M + 2, y0 + 8);
    const yl = H - 10;
    doc.line(M + 4, yl, M + 90, yl).line(W - M - 90, yl, W - M - 4, yl);
    doc.setFontSize(7).text("Assinatura do colaborador", M + 4, yl + 3);
    doc.text("Responsável pela entrega (SST / RH)", W - M - 90, yl + 3);
  };

  // ---- Cabeçalho ----
  if (logo) doc.addImage(logo, "PNG", M, 8, 22, 16);
  const x0 = logo ? M + 26 : M;
  doc.setFont("helvetica", "bold").setFontSize(12).text(empresa.razaoSocial ?? "", x0, 13);
  doc.setFont("helvetica", "normal").setFontSize(9).text(`CNPJ: ${mascaraCnpj(empresa.cnpj)}`, x0, 18);
  doc.setFont("helvetica", "bold").setFontSize(13).text("FICHA DE CONTROLE DE ENTREGA DE EPI", W / 2, 30, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8).text("Equipamento de Proteção Individual — NR-6", W / 2, 34, { align: "center" });

  // ---- Dados do colaborador ----
  autoTable(doc, {
    startY: 38,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5, lineColor: 150 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 240, 235], cellWidth: 28 }, 2: { fontStyle: "bold", fillColor: [240, 240, 235], cellWidth: 28 } },
    body: [
      ["Colaborador", { content: funcionario.nome, colSpan: 3 }],
      ["CPF", mascaraCpf(funcionario.cpf), "Matrícula", funcionario.matricula],
      ["Cargo / GHE", funcionario.gheNome ?? "—", "Setor", funcionario.setorNome ?? "—"],
      ["Admissão", fmt(funcionario.dataAdmissao), "Emitida em", fmt(new Date())],
    ],
    margin: { left: M, right: M },
  });

  // ---- Itens entregues (um por linha, em ordem cronológica) ----
  const motivo = (v) => MOTIVOS_ENTREGA.find((m) => m.valor === v)?.rotulo ?? "";
  const linhas = [...entregas]
    .sort((a, b) => paraDate(a.dataEntrega) - paraDate(b.dataEntrega))
    .flatMap((e) =>
      e.itens.map((i) => [
        fmt(e.dataEntrega),
        [i.descricao, [i.marca, i.modelo].filter(Boolean).join(" / ")].filter(Boolean).join("\n"),
        i.ca,
        String(i.quantidade),
        motivo(i.motivo),
        "", // assinatura manual
      ])
    );
  while (linhas.length < 10) linhas.push(["", "", "", "", "", ""]); // linhas em branco para entregas futuras

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    head: [["Data", "EPI (descrição / marca / modelo)", "CA", "Qtd", "Motivo", "Assinatura do colaborador"]],
    body: linhas,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.5, minCellHeight: 10, valign: "middle", lineColor: 150 },
    headStyles: { fillColor: [6, 78, 59], halign: "center" },
    columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 18 }, 3: { cellWidth: 10, halign: "center" }, 4: { cellWidth: 28 }, 5: { cellWidth: 48 } },
    margin: { left: M, right: M, bottom: alturaRodape + 8 },
    didDrawPage: desenharRodape,
  });

  doc.save(`ficha-epi-${funcionario.matricula}.pdf`);
}

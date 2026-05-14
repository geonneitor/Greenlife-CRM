/**
 * quotePDF.js — Generador de PDF de Cotización Profesional
 * Usa jsPDF + jspdf-autotable
 * No depende del DOM, funciona en cualquier dispositivo
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colores de la marca
const BRAND_GREEN = [0, 208, 132];   // #00D084
const DARK_BG     = [10, 26, 15];    // #0A1A0F
const GRAY_LIGHT  = [240, 244, 241];
const GRAY_MED    = [180, 190, 184];
const WHITE       = [255, 255, 255];
const TEXT_DARK   = [20, 30, 22];

/**
 * Genera y descarga el PDF de una cotización
 * @param {Object} project    - Objeto proyecto con client, items, etc.
 * @param {number} exchangeRate - Tipo de cambio USD→MXN actual
 * @param {Object} options    - Opciones adicionales { companyName, companyPhone, companyEmail }
 */
export function generateQuotePDF(project, exchangeRate = 17.5, options = {}) {
  const {
    companyName  = 'Greenlife Enterprise',
    companyPhone = '',
    companyEmail = '',
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ─── CABECERA ────────────────────────────────────────────────────────────────
  // Franja verde superior
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageW, 38, 'F');

  // Franja oscura debajo
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 38, pageW, 8, 'F');

  // Nombre de la empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text(companyName.toUpperCase(), 14, 18);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255, 180);
  doc.text('LANDSCAPING & MAINTENANCE SERVICES', 14, 25);

  if (companyPhone || companyEmail) {
    doc.setFontSize(7);
    const contactLine = [companyPhone, companyEmail].filter(Boolean).join('  ·  ');
    doc.text(contactLine, 14, 31);
  }

  // Número de cotización (lado derecho)
  const quoteNum = `#${String(project.id).padStart(4, '0')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text(quoteNum, pageW - 14, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('COTIZACIÓN', pageW - 14, 28, { align: 'right' });

  // Fecha en la franja oscura
  const dateStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text(`Fecha: ${dateStr}`, 14, 43.5);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  const expiryStr = expiryDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Válida hasta: ${expiryStr}`, pageW - 14, 43.5, { align: 'right' });

  // ─── BLOQUE CLIENTE + PROYECTO ───────────────────────────────────────────────
  const client = project.client;
  const clientName = client
    ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
    : 'Cliente';

  let y = 58;

  // Panel cliente (izquierda)
  doc.setFillColor(...GRAY_LIGHT);
  doc.roundedRect(14, y, (pageW - 28) / 2 - 4, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_GREEN);
  doc.text('CLIENTE', 18, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text(clientName, 18, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 84);
  if (client?.phone) doc.text(`Tel: ${client.phone}`, 18, y + 22);
  if (client?.email) doc.text(`Email: ${client.email}`, 18, y + 28);
  if (client?.address) {
    const addrLines = doc.splitTextToSize(`Dir: ${client.address}`, (pageW - 28) / 2 - 10);
    doc.text(addrLines, 18, client?.email ? y + 34 : y + 22);
  }

  // Panel proyecto (derecha)
  const midX = 14 + (pageW - 28) / 2 + 4;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(midX, y, (pageW - 28) / 2 - 4, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_GREEN);
  doc.text('PROYECTO', midX + 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(project.title || 'Sin título', (pageW - 28) / 2 - 10);
  doc.text(titleLines, midX + 4, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_MED);
  doc.text(`Estado: ${project.status || 'Estimate'}`, midX + 4, y + 28);
  if (project.start_date) {
    doc.text(`Inicio: ${new Date(project.start_date).toLocaleDateString('es-MX')}`, midX + 4, y + 34);
  }

  y += 46;

  // Descripción
  if (project.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 120, 108);
    const descLines = doc.splitTextToSize(`"${project.description}"`, pageW - 28);
    doc.text(descLines, 14, y);
    y += descLines.length * 4 + 4;
  }

  // ─── TABLA DE SERVICIOS ──────────────────────────────────────────────────────
  y += 4;

  const items = project.items || [];
  const tableBody = items.map(item => {
    const usdUnit = parseFloat(item.price_at_quote_usd || 0);
    const qty     = parseFloat(item.quantity || 1);
    const totalUSD = usdUnit * qty;
    const totalMXN = totalUSD * exchangeRate;
    return [
      item.service?.name || item.service?.category || 'Servicio',
      item.service?.category || '',
      qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2),
      `$${usdUnit.toFixed(2)}`,
      `$${totalUSD.toFixed(2)}`,
      `$${totalMXN.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Servicio', 'Categoría', 'Cant.', 'Precio Unit. USD', 'Total USD', 'Total MXN']],
    body: tableBody.length > 0 ? tableBody : [['Sin servicios registrados', '', '', '', '', '']],
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: [230, 235, 232],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: DARK_BG,
      textColor: BRAND_GREEN,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 26, halign: 'right', textColor: [100, 140, 115] },
    },
    alternateRowStyles: { fillColor: [248, 251, 249] },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.fillColor = DARK_BG;
      }
    },
  });

  // ─── TOTALES ─────────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;

  const totalUSD = parseFloat(project.total_quoted_usd || 0);
  const totalMXN = totalUSD * exchangeRate;

  // Caja de totales
  const boxW = 90;
  const boxX = pageW - 14 - boxW;

  doc.setFillColor(...GRAY_LIGHT);
  doc.roundedRect(boxX, finalY, boxW, 30, 3, 3, 'F');

  // Fila USD
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 95, 85);
  doc.text('TOTAL USD', boxX + 6, finalY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`$${totalUSD.toFixed(2)} USD`, boxX + boxW - 6, finalY + 10, { align: 'right' });

  // Divisor
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(0.4);
  doc.line(boxX + 6, finalY + 13, boxX + boxW - 6, finalY + 13);

  // Fila MXN
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 120, 108);
  doc.text('EQUIVALENTE MXN', boxX + 6, finalY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 150, 100);
  doc.text(`$${totalMXN.toFixed(2)} MXN`, boxX + boxW - 6, finalY + 22, { align: 'right' });

  // Nota tipo de cambio
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY_MED);
  doc.text(`*T.C. referencial: 1 USD = ${exchangeRate.toFixed(4)} MXN`, boxX + 6, finalY + 28);

  // ─── TÉRMINOS Y CONDICIONES ──────────────────────────────────────────────────
  const termsY = Math.max(finalY + 42, pageH - 70);

  doc.setFillColor(...DARK_BG);
  doc.rect(0, termsY - 2, pageW, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND_GREEN);
  doc.text('TÉRMINOS Y CONDICIONES', 14, termsY + 6);

  const terms = [
    '• Esta cotización es válida por 30 días a partir de la fecha de emisión.',
    '• Los precios están sujetos a cambio sin previo aviso después del período de validez.',
    '• Se requiere un depósito del 50% para iniciar los trabajos.',
    '• El saldo restante se liquida al completar satisfactoriamente el servicio.',
    '• Los precios en MXN son referenciales y pueden variar según el tipo de cambio al momento del pago.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 120, 108);
  terms.forEach((line, i) => {
    doc.text(line, 14, termsY + 13 + i * 5);
  });

  // ─── LÍNEA DE FIRMA ──────────────────────────────────────────────────────────
  const sigY = termsY + 44;
  doc.setDrawColor(...GRAY_MED);
  doc.setLineWidth(0.3);
  doc.line(14, sigY, 80, sigY);
  doc.line(pageW - 80, sigY, pageW - 14, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_MED);
  doc.text('Firma del Cliente', 14, sigY + 5);
  doc.text('Autorizado por ' + companyName, pageW - 14, sigY + 5, { align: 'right' });

  // ─── PIE DE PÁGINA ───────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, pageH - 8, pageW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DARK_BG);
  doc.text(companyName.toUpperCase() + '  ·  LANDSCAPING & MAINTENANCE', pageW / 2, pageH - 3, { align: 'center' });

  // ─── DESCARGAR ───────────────────────────────────────────────────────────────
  const filename = `Cotizacion_GLE_${quoteNum}_${clientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);

  return filename;
}

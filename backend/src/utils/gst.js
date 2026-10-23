/** Indian state codes used for GSTIN (first 2 digits) and place-of-supply checks */
export const STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export function stateCodeFromGstin(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return gstin.slice(0, 2);
}

/**
 * Split GST into CGST+SGST (intra-state) or IGST (inter-state).
 * Each line: { description, hsn, quantity, rate, gstRate }
 */
export function calculateLineTaxes(items, sellerStateCode, buyerStateCode) {
  const intraState = sellerStateCode && buyerStateCode && sellerStateCode === buyerStateCode;

  return items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gstRate) || 0;
    const taxable = Math.round(qty * rate * 100) / 100;
    const taxAmount = Math.round(taxable * (gstRate / 100) * 100) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (intraState) {
      cgst = Math.round((taxAmount / 2) * 100) / 100;
      sgst = Math.round((taxAmount / 2) * 100) / 100;
    } else {
      igst = taxAmount;
    }

    return {
      ...item,
      quantity: qty,
      rate,
      gstRate,
      taxableValue: taxable,
      cgst,
      sgst,
      igst,
      lineTotal: Math.round((taxable + taxAmount) * 100) / 100,
    };
  });
}

export function summarizeInvoice(lines) {
  const taxableValue = lines.reduce((s, l) => s + l.taxableValue, 0);
  const cgst = lines.reduce((s, l) => s + l.cgst, 0);
  const sgst = lines.reduce((s, l) => s + l.sgst, 0);
  const igst = lines.reduce((s, l) => s + l.igst, 0);
  const grandTotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  const round = (n) => Math.round(n * 100) / 100;
  return {
    taxableValue: round(taxableValue),
    cgst: round(cgst),
    sgst: round(sgst),
    igst: round(igst),
    grandTotal: round(grandTotal),
  };
}

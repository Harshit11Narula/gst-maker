import { forwardRef } from 'react';
import { getFormat } from '../invoiceFormats';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PartyBlock({ title, party, showEmail }) {
  if (!party) return null;
  return (
    <div className="inv-party">
      <h3 className="inv-party-label">{title}</h3>
      <strong className="inv-party-name">{party.name}</strong>
      <div className="inv-party-meta">
        {party.gstin ? (
          <>
            GSTIN: {party.gstin}
            <br />
          </>
        ) : null}
        {party.pan ? (
          <>
            PAN: {party.pan}
            <br />
          </>
        ) : null}
        {party.address}
        {(party.address || party.city || party.state) && <br />}
        {[party.city, party.state, party.pincode].filter(Boolean).join(', ')}
        {party.phone ? (
          <>
            <br />
            Phone: {party.phone}
          </>
        ) : null}
        {showEmail && party.email ? (
          <>
            <br />
            {party.email}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ItemsTable({ invoice, intra, dense }) {
  return (
    <div className={`table-wrap inv-items${dense ? ' inv-items-dense' : ''}`}>
      <table className="data">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>GST%</th>
            <th>Taxable</th>
            {intra ? (
              <>
                <th>CGST</th>
                <th>SGST</th>
              </>
            ) : (
              <th>IGST</th>
            )}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.description}</td>
              <td>{item.hsn || '—'}</td>
              <td>{item.quantity}</td>
              <td>{money(item.rate)}</td>
              <td>{item.gstRate}%</td>
              <td>{money(item.taxableValue)}</td>
              {intra ? (
                <>
                  <td>{money(item.cgst)}</td>
                  <td>{money(item.sgst)}</td>
                </>
              ) : (
                <td>{money(item.igst)}</td>
              )}
              <td>{money(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalsBlock({ invoice, intra }) {
  return (
    <div className="inv-totals">
      <div>
        Taxable value: <strong>{money(invoice.totals.taxableValue)}</strong>
      </div>
      {intra ? (
        <>
          <div>
            CGST: <strong>{money(invoice.totals.cgst)}</strong>
          </div>
          <div>
            SGST: <strong>{money(invoice.totals.sgst)}</strong>
          </div>
        </>
      ) : (
        <div>
          IGST: <strong>{money(invoice.totals.igst)}</strong>
        </div>
      )}
      <div className="inv-grand">
        Grand total: <strong>{money(invoice.totals.grandTotal)}</strong>
      </div>
    </div>
  );
}

function MetaBlock({ invoice, intra }) {
  return (
    <div className="inv-meta">
      <div>
        <strong>Date:</strong> {invoice.invoiceDate}
      </div>
      {invoice.dueDate ? (
        <div>
          <strong>Due:</strong> {invoice.dueDate}
        </div>
      ) : null}
      <div className="inv-tax-type">{intra ? 'CGST + SGST' : 'IGST'}</div>
    </div>
  );
}

const InvoiceDocument = forwardRef(function InvoiceDocument({ invoice, formatId }, ref) {
  const format = getFormat(formatId || invoice.formatId);
  const intra = invoice.taxType === 'CGST_SGST';
  const logo = invoice.seller?.logo;

  return (
    <div
      ref={ref}
      className={`panel invoice-print inv-doc inv-format-${format.id}`}
      data-format={format.id}
    >
      {/* —— Classic —— */}
      {format.id === 'classic' && (
        <>
          <div className="invoice-header">
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
              <div>
                <h1 className="panel-title">Tax Invoice</h1>
                <p className="muted inv-number">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <MetaBlock invoice={invoice} intra={intra} />
          </div>
          <div className="grid-2 inv-parties">
            <PartyBlock title="Seller" party={invoice.seller} showEmail />
            <PartyBlock title="Buyer" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <TotalsBlock invoice={invoice} intra={intra} />
        </>
      )}

      {/* —— Teal Banner —— */}
      {format.id === 'teal-banner' && (
        <>
          <div className="inv-banner">
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo inv-logo-on-dark" src={logo} alt="" /> : null}
              <div>
                <div className="inv-banner-kicker">GST Tax Invoice</div>
                <h1 className="panel-title">{invoice.seller?.name}</h1>
              </div>
            </div>
            <div className="inv-banner-right">
              <div className="inv-number-lg">{invoice.invoiceNumber}</div>
              <MetaBlock invoice={invoice} intra={intra} />
            </div>
          </div>
          <div className="grid-2 inv-parties">
            <PartyBlock title="From (Seller)" party={invoice.seller} showEmail />
            <PartyBlock title="Bill To (Buyer)" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <TotalsBlock invoice={invoice} intra={intra} />
        </>
      )}

      {/* —— Formal —— */}
      {format.id === 'formal' && (
        <>
          <div className="inv-formal-title">
            {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
            <div>
              <div className="inv-formal-tag">Original for Recipient</div>
              <h1 className="panel-title">TAX INVOICE</h1>
              <p className="inv-number">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="inv-formal-meta-row">
            <MetaBlock invoice={invoice} intra={intra} />
            <div className="inv-formal-gstin">
              Supplier GSTIN: <strong>{invoice.seller?.gstin || '—'}</strong>
            </div>
          </div>
          <div className="grid-2 inv-parties inv-parties-bordered">
            <PartyBlock title="Details of Supplier" party={invoice.seller} showEmail />
            <PartyBlock title="Details of Receiver" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <TotalsBlock invoice={invoice} intra={intra} />
          <div className="inv-formal-footer">
            This is a computer-generated tax invoice under GST.
          </div>
        </>
      )}

      {/* —— Slate —— */}
      {format.id === 'slate' && (
        <>
          <div className="inv-slate-head">
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo inv-logo-on-dark" src={logo} alt="" /> : null}
              <div>
                <h1 className="panel-title">Tax Invoice</h1>
                <p className="inv-number">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <MetaBlock invoice={invoice} intra={intra} />
          </div>
          <div className="grid-2 inv-parties">
            <PartyBlock title="Seller" party={invoice.seller} showEmail />
            <PartyBlock title="Buyer / Place of Supply" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <div className="inv-slate-totals">
            <TotalsBlock invoice={invoice} intra={intra} />
          </div>
        </>
      )}

      {/* —— Boxed —— */}
      {format.id === 'boxed' && (
        <>
          <div className="invoice-header">
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
              <div>
                <h1 className="panel-title">Tax Invoice</h1>
                <p className="muted inv-number">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <MetaBlock invoice={invoice} intra={intra} />
          </div>
          <div className="grid-2 inv-parties">
            <div className="inv-box">
              <PartyBlock title="Seller" party={invoice.seller} showEmail />
            </div>
            <div className="inv-box">
              <PartyBlock title="Buyer" party={invoice.buyer} />
            </div>
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <div className="inv-box inv-totals-box">
            <TotalsBlock invoice={invoice} intra={intra} />
          </div>
        </>
      )}

      {/* —— Emerald —— */}
      {format.id === 'emerald' && (
        <>
          <div className="inv-emerald-inner">
            <div className="invoice-header">
              <div className="invoice-header-brand">
                {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
                <div>
                  <div className="inv-emerald-kicker">GST Compliant</div>
                  <h1 className="panel-title">Tax Invoice</h1>
                  <p className="muted inv-number">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <MetaBlock invoice={invoice} intra={intra} />
            </div>
            <div className="grid-2 inv-parties">
              <PartyBlock title="Seller" party={invoice.seller} showEmail />
              <PartyBlock title="Buyer" party={invoice.buyer} />
            </div>
            <ItemsTable invoice={invoice} intra={intra} />
            <TotalsBlock invoice={invoice} intra={intra} />
          </div>
        </>
      )}

      {/* —— Compact —— */}
      {format.id === 'compact' && (
        <>
          <div className="inv-compact-top">
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo inv-logo-sm" src={logo} alt="" /> : null}
              <div>
                <h1 className="panel-title">Tax Invoice · {invoice.invoiceNumber}</h1>
                <div className="inv-compact-seller">{invoice.seller?.name}</div>
              </div>
            </div>
            <MetaBlock invoice={invoice} intra={intra} />
          </div>
          <div className="inv-compact-parties">
            <span>
              <strong>Seller GSTIN:</strong> {invoice.seller?.gstin || '—'}
            </span>
            <span>
              <strong>Buyer:</strong> {invoice.buyer?.name}
              {invoice.buyer?.gstin ? ` · ${invoice.buyer.gstin}` : ''}
            </span>
            <span>
              <strong>POS:</strong> {invoice.buyer?.state || invoice.buyer?.stateCode || '—'}
            </span>
          </div>
          <ItemsTable invoice={invoice} intra={intra} dense />
          <TotalsBlock invoice={invoice} intra={intra} />
        </>
      )}

      {/* —— Navy Ribbon —— */}
      {format.id === 'navy-ribbon' && (
        <>
          <div className="inv-ribbon">
            <span>TAX INVOICE</span>
            <span>{invoice.invoiceNumber}</span>
          </div>
          <div className="invoice-header" style={{ marginTop: '1rem' }}>
            <div className="invoice-header-brand">
              {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
              <div>
                <h1 className="panel-title">{invoice.seller?.name}</h1>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {[invoice.seller?.city, invoice.seller?.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <MetaBlock invoice={invoice} intra={intra} />
          </div>
          <div className="grid-2 inv-parties">
            <PartyBlock title="Seller" party={invoice.seller} showEmail />
            <PartyBlock title="Buyer" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <div className="inv-ribbon-totals">
            <TotalsBlock invoice={invoice} intra={intra} />
          </div>
        </>
      )}

      {/* —— Split —— */}
      {format.id === 'split' && (
        <>
          <div className="inv-split-mast">
            <div className="inv-split-left">
              {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
              <h1 className="panel-title">{invoice.seller?.name}</h1>
              <div className="inv-party-meta">
                GSTIN: {invoice.seller?.gstin || '—'}
                <br />
                {[invoice.seller?.address, invoice.seller?.city, invoice.seller?.state]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
            <div className="inv-split-right">
              <div className="inv-split-label">Tax Invoice</div>
              <div className="inv-number-lg">{invoice.invoiceNumber}</div>
              <MetaBlock invoice={invoice} intra={intra} />
            </div>
          </div>
          <div className="inv-parties">
            <PartyBlock title="Bill To" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <TotalsBlock invoice={invoice} intra={intra} />
        </>
      )}

      {/* —— Stamp —— */}
      {format.id === 'stamp' && (
        <>
          <div className="inv-stamp-head">
            {logo ? <img className="invoice-logo" src={logo} alt="" /> : null}
            <h1 className="panel-title">Tax Invoice</h1>
            <p className="inv-number">{invoice.invoiceNumber}</p>
            <div className="inv-stamp-badge">{intra ? 'CGST + SGST' : 'IGST'}</div>
          </div>
          <div className="inv-stamp-meta">
            <span>
              <strong>Date:</strong> {invoice.invoiceDate}
            </span>
            {invoice.dueDate ? (
              <span>
                <strong>Due:</strong> {invoice.dueDate}
              </span>
            ) : null}
            <span>
              <strong>Seller GSTIN:</strong> {invoice.seller?.gstin || '—'}
            </span>
          </div>
          <div className="grid-2 inv-parties">
            <PartyBlock title="Seller" party={invoice.seller} showEmail />
            <PartyBlock title="Buyer" party={invoice.buyer} />
          </div>
          <ItemsTable invoice={invoice} intra={intra} />
          <TotalsBlock invoice={invoice} intra={intra} />
        </>
      )}

      {invoice.notes ? <p className="inv-notes">Notes: {invoice.notes}</p> : null}
    </div>
  );
});

export default InvoiceDocument;

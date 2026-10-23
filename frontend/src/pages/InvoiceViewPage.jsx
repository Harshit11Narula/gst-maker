import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import InvoiceDocument from '../components/InvoiceDocument';
import { DEFAULT_FORMAT_ID, INVOICE_FORMATS, getFormat } from '../invoiceFormats';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const printRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [formatId, setFormatId] = useState(DEFAULT_FORMAT_ID);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [savingFormat, setSavingFormat] = useState(false);

  useEffect(() => {
    api(`/invoices/${id}`)
      .then((d) => {
        setInvoice(d.invoice);
        setFormatId(d.invoice.formatId || DEFAULT_FORMAT_ID);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const changeFormat = async (nextId) => {
    setFormatId(nextId);
    if (!invoice) return;
    setSavingFormat(true);
    setError('');
    try {
      const data = await api(`/invoices/${invoice.id}/format`, {
        method: 'PATCH',
        body: { formatId: nextId },
      });
      setInvoice(data.invoice);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFormat(false);
    }
  };

  const downloadPdf = async () => {
    if (!printRef.current || !invoice) return;
    setDownloading(true);
    setError('');
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const fileName = `${invoice.invoiceNumber || 'gst-invoice'}.pdf`.replace(/[^\w.-]+/g, '_');
      pdf.save(fileName);
    } catch (err) {
      setError(err.message || 'Could not download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (error && !invoice) {
    return (
      <div className="panel">
        <div className="alert alert-error">{error}</div>
        <Link to="/invoices">Back to invoices</Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="panel">
        <p className="muted">Loading invoice…</p>
      </div>
    );
  }

  const selectedFormat = getFormat(formatId);

  return (
    <>
      <div className="btn-row no-print" style={{ marginBottom: '0.75rem', marginTop: 0 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPdf}
          disabled={downloading}
        >
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          Print
        </button>
        <Link className="btn btn-ghost" to="/invoices">
          Back
        </Link>
      </div>

      <div className="panel no-print" style={{ marginBottom: '1rem' }}>
        <h2 className="panel-title" style={{ fontSize: '1.05rem' }}>
          GST invoice format
        </h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Switch layout anytime. Current: <strong style={{ color: 'var(--ink)' }}>{selectedFormat.name}</strong>
          {savingFormat ? ' · Saving…' : ''}
        </p>
        <div className="format-grid" role="radiogroup" aria-label="Invoice format">
          {INVOICE_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              role="radio"
              aria-checked={formatId === fmt.id}
              className={`format-card${formatId === fmt.id ? ' is-selected' : ''}`}
              onClick={() => changeFormat(fmt.id)}
            >
              <div className="format-card-swatch" style={{ background: fmt.accent }} />
              <strong>{fmt.name}</strong>
              <span>{fmt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error no-print">{error}</div>}

      <InvoiceDocument ref={printRef} invoice={invoice} formatId={formatId} />
    </>
  );
}

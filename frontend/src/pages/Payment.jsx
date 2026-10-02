import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { formatPrice } from '../brand';
import { Heart } from '../components/Icons';

// Mercado Pago Checkout Transparente (Orders API): the customer pays here, inside the store.
// Card data is typed into Mercado Pago's secure iframes and tokenized by MercadoPago.js;
// our server only receives the token. Pix and boleto are issued by the server.
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/overview
const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;
const SDK_URL = 'https://sdk.mercadopago.com/js/v2';
const MAX_INSTALLMENTS = 3;
const POLL_MS = 5000;

let sdkPromise;
function loadSdk() {
  sdkPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Não foi possível carregar o Mercado Pago. Se você usa bloqueador de anúncios, desative-o nesta página.'));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

const PAY_LABEL = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' };

// Friendly messages for common refusals (Orders API status_detail).
const REFUSED = {
  insufficient_amount: 'O cartão não tem limite suficiente.',
  cc_rejected_insufficient_amount: 'O cartão não tem limite suficiente.',
  bad_filled_security_code: 'O código de segurança (CVV) está incorreto.',
  cc_rejected_bad_filled_security_code: 'O código de segurança (CVV) está incorreto.',
  bad_filled_date: 'A data de validade está incorreta.',
  cc_rejected_bad_filled_date: 'A data de validade está incorreta.',
  call_for_authorize: 'O banco pediu autorização. Ligue para o seu banco e tente de novo.',
  cc_rejected_call_for_authorize: 'O banco pediu autorização. Ligue para o seu banco e tente de novo.',
};
const refusedMessage = (p) =>
  REFUSED[p?.statusDetail] || 'O pagamento não foi aprovado. Confira os dados ou tente outro cartão.';

export default function Payment() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    () => api.orderPayment(id).then(({ order, payment }) => { setOrder(order); setPayment(payment); }),
    [id]
  );

  useEffect(() => {
    load().catch((e) => setLoadError(e.message));
  }, [load]);

  const paid = order && order.status !== 'aguardando_pagamento' && order.status !== 'cancelado';
  const pending = !paid && ['action_required', 'processing'].includes(payment?.status);

  // While a Pix/boleto/card review is pending, keep checking until Mercado Pago confirms it.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => load().catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [pending, load]);

  const pay = async (body) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.payOrder(id, body);
      setOrder(res.order);
      setPayment(res.payment);
      if (res.payment?.status === 'failed') setError(refusedMessage(res.payment));
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <p className="alert container section">{loadError}</p>;
  if (!order) return <p className="muted center section">Carregando…</p>;

  if (!PUBLIC_KEY) {
    return (
      <section className="section container">
        <p className="alert">Pagamento online indisponível: VITE_MP_PUBLIC_KEY não está configurada no frontend.</p>
      </section>
    );
  }

  if (paid) {
    return (
      <section className="section container success">
        <div className="success__icon"><Heart width={48} height={48} /></div>
        <h1>Pagamento aprovado! Valeu pelo carinho</h1>
        <p className="muted">Pedido <b>{order.id}</b>. Já estamos separando tudo com carinho para o envio.</p>
        <div className="hero__cta center">
          <Link to={`/pedido/${order.id}`} className="btn btn--primary">Ver pedido</Link>
          <Link to="/loja" className="btn btn--ghost">Voltar para a loja</Link>
        </div>
      </section>
    );
  }

  if (order.status === 'cancelado') {
    return <p className="alert container section">Este pedido foi cancelado.</p>;
  }

  return (
    <section className="section container pay-page">
      <h1 className="page-title">Pagamento</h1>
      <p className="muted">Pedido <b>{order.id}</b> · {PAY_LABEL[order.payment]}</p>

      {/* Total always visible above the payment form */}
      <p className="checkout-total">Total: <strong>{formatPrice(order.total)}</strong></p>

      {error && <p className="alert" role="alert">{error}</p>}

      {order.payment === 'cartao' && (
        <CardForm order={order} submitting={submitting} onPay={pay} onInitError={setError} />
      )}
      {order.payment === 'pix' && (
        pending && payment?.pix ? <PixBox pix={payment.pix} /> : (
          <div className="box">
            <p>Gere o QR code e pague pelo app do seu banco. A confirmação é na hora.</p>
            <button className="btn btn--primary btn--block" disabled={submitting} onClick={() => pay({})}>
              {submitting ? 'Gerando Pix…' : 'Gerar QR code Pix'}
            </button>
          </div>
        )
      )}
      {order.payment === 'boleto' && (
        pending && payment?.boleto ? <BoletoBox boleto={payment.boleto} /> : (
          <BoletoForm submitting={submitting} onPay={pay} />
        )
      )}

      {pending && payment?.status === 'processing' && order.payment === 'cartao' && (
        <p className="muted center">Pagamento em análise pelo Mercado Pago. Esta página atualiza sozinha.</p>
      )}
    </section>
  );
}

function CardForm({ order, submitting, onPay, onInitError }) {
  const [initError, setInitError] = useState('');
  const paymentTypeRef = useRef(null);
  const onPayRef = useRef(onPay);
  onPayRef.current = onPay;

  useEffect(() => {
    let cardForm;
    let cancelled = false;
    const fail = (msg) => {
      const text = typeof msg === 'string' ? msg : 'Não foi possível carregar os campos seguros do pagamento.';
      console.error('[Checkout Transparente]', msg);
      if (!cancelled) setInitError(text);
    };

    loadSdk()
      .then((MercadoPago) => {
        // Mount only after the form is on screen (hosts need real dimensions).
        requestAnimationFrame(() => {
          if (cancelled) return;
          const mp = new MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
          cardForm = mp.cardForm({
            amount: Number(order.total).toFixed(2),
            iframe: true,
            form: {
              id: 'form-checkout',
              cardNumber: { id: 'form-checkout__cardNumber', placeholder: '0000 0000 0000 0000' },
              expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
              securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
              cardholderName: { id: 'form-checkout__cardholderName' },
              issuer: { id: 'form-checkout__issuer' },
              installments: { id: 'form-checkout__installments' },
              identificationType: { id: 'form-checkout__identificationType' },
              identificationNumber: { id: 'form-checkout__identificationNumber' },
            },
            callbacks: {
              onFormMounted: (err) => {
                if (err) return fail(err);
                requestAnimationFrame(() => {
                  const broken = ['cardNumber', 'expirationDate', 'securityCode'].filter((f) => {
                    const host = document.getElementById(`form-checkout__${f}`);
                    return !host || host.querySelectorAll('iframe').length !== 1 || !host.getBoundingClientRect().height;
                  });
                  if (broken.length) fail(`Falha ao montar os campos seguros: ${broken.join(', ')}.`);
                });
              },
              onPaymentMethodsReceived: (err, methods) => {
                if (!err) paymentTypeRef.current = methods?.[0]?.payment_type_id || null;
              },
              onInstallmentsReceived: () => {
                // Only offer what the store promises (the server enforces it too).
                const select = document.getElementById('form-checkout__installments');
                [...(select?.options || [])].forEach((o) => { if (Number(o.value) > MAX_INSTALLMENTS) o.remove(); });
              },
              onSubmit: (event) => {
                event.preventDefault();
                const { token, paymentMethodId, installments, identificationNumber } = cardForm.getCardFormData();
                if (!token) return onInitError('Confira os dados do cartão.');
                onPayRef.current({
                  card: { token, paymentMethodId, paymentTypeId: paymentTypeRef.current, installments },
                  cpf: identificationNumber,
                });
              },
            },
          });
        });
      })
      .catch((e) => fail(e.message));

    return () => {
      cancelled = true;
      cardForm?.unmount();
    };
  }, [order.id, order.total]);

  return (
    <div className="box">
      <div id="checkout-init-error" className="alert" role="alert" aria-live="assertive" hidden={!initError}>
        {initError}
      </div>
      <form
        id="form-checkout"
        className="pay-form"
        data-mp-public-key-source="framework-public-config"
        data-mp-payer-email-source="application"
        data-mp-payer-identification-source="form"
        data-mp-identification-type="CPF"
        data-mp-offers-installments="true"
      >
        <div className="field field--full" data-mp-field="cardNumber" role="group" aria-labelledby="card-number-label">
          <span id="card-number-label">Número do cartão</span>
          <div id="form-checkout__cardNumber" className="secure-input" data-mp-secure-field="cardNumber" aria-labelledby="card-number-label"></div>
        </div>
        <div className="field" data-mp-field="expirationDate" role="group" aria-labelledby="expiration-label">
          <span id="expiration-label">Validade (MM/AA)</span>
          <div id="form-checkout__expirationDate" className="secure-input" data-mp-secure-field="expirationDate" aria-labelledby="expiration-label"></div>
        </div>
        <div className="field" data-mp-field="securityCode" role="group" aria-labelledby="security-code-label">
          <span id="security-code-label">Código de segurança (CVV)</span>
          <div id="form-checkout__securityCode" className="secure-input" data-mp-secure-field="securityCode" aria-labelledby="security-code-label"></div>
        </div>
        <div className="field field--full" data-mp-field="cardholderName">
          <span id="cardholder-name-label">Nome impresso no cartão</span>
          <input id="form-checkout__cardholderName" className="input" aria-labelledby="cardholder-name-label" autoComplete="cc-name" required />
        </div>
        <div className="field" data-mp-field="identificationNumber">
          <span id="cpf-label">CPF do titular</span>
          <input id="form-checkout__identificationNumber" className="input" aria-labelledby="cpf-label" inputMode="numeric" autoComplete="off" required />
        </div>
        <div className="field" data-mp-field="installments">
          <span id="installments-label">Parcelas</span>
          <select id="form-checkout__installments" className="input" aria-labelledby="installments-label" data-mp-sdk-required-field="installments"></select>
        </div>

        {/* Required CardForm lifecycle nodes (SDK plumbing, not trusted by the server). */}
        <select id="form-checkout__issuer" data-mp-sdk-required-field="issuer" hidden aria-hidden="true" tabIndex="-1"></select>
        <select id="form-checkout__identificationType" data-mp-sdk-required-field="identificationType" hidden aria-hidden="true" tabIndex="-1"></select>

        <button type="submit" className="btn btn--primary btn--block field--full" disabled={submitting}>
          {submitting ? 'Processando pagamento…' : `Pagar ${formatPrice(order.total)}`}
        </button>
      </form>
      <p className="muted small">Pagamento processado com segurança pelo Mercado Pago. Os dados do cartão não passam pela nossa loja.</p>
    </div>
  );
}

function PixBox({ pix }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(pix.qrCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="box pix">
      <p>Escaneie o QR code ou copie o código no app do seu banco. Esta página atualiza sozinha quando o pagamento cair.</p>
      {pix.qrCodeBase64 && <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR code Pix" width={220} height={220} />}
      <input className="input" readOnly value={pix.qrCode || ''} aria-label="Código Pix copia e cola" onFocus={(e) => e.target.select()} />
      <button className="btn btn--primary btn--block" onClick={copy}>{copied ? 'Código copiado!' : 'Copiar código Pix'}</button>
      {pix.ticketUrl && <a className="link" href={pix.ticketUrl} target="_blank" rel="noreferrer">Abrir instruções do Pix</a>}
    </div>
  );
}

function BoletoForm({ submitting, onPay }) {
  const [cpf, setCpf] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const submit = (e) => {
    e.preventDefault();
    onPay({ cpf, neighborhood });
  };
  return (
    <form className="box pay-form" onSubmit={submit}>
      <label className="field">CPF<input className="input" required inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} /></label>
      <label className="field">Bairro<input className="input" required value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></label>
      <button className="btn btn--primary btn--block field--full" disabled={submitting}>
        {submitting ? 'Gerando boleto…' : 'Gerar boleto'}
      </button>
    </form>
  );
}

function BoletoBox({ boleto }) {
  return (
    <div className="box pix">
      <p>Boleto gerado. Pague até o vencimento; a confirmação pode levar até 2 dias úteis.</p>
      {boleto.digitableLine && (
        <input className="input" readOnly value={boleto.digitableLine} aria-label="Linha digitável" onFocus={(e) => e.target.select()} />
      )}
      {boleto.ticketUrl && (
        <a className="btn btn--primary btn--block" href={boleto.ticketUrl} target="_blank" rel="noreferrer">Abrir boleto</a>
      )}
    </div>
  );
}

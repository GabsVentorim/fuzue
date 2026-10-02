import { randomUUID } from 'node:crypto';
import { MercadoPagoConfig, Order } from 'mercadopago';
import db from './db.js';

// Mercado Pago Checkout Transparente via the Orders API (POST /v1/orders).
// The customer pays inside the store: card data is tokenized in the browser by
// MercadoPago.js, and this server creates the order with the token.
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/overview

export const mpEnabled = () => !!process.env.MP_ACCESS_TOKEN;

let client;
const orders = () => {
  client ??= new Order(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }));
  return client;
};

export const MAX_INSTALLMENTS = 3;

// Orders API amounts are strings with two decimals ("10.00", never "10").
const money = (n) => Number(n).toFixed(2);
const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

export class PaymentInputError extends Error {}

// Builds the payment transaction for the method chosen at checkout. The amount always comes
// from the order saved on the server; the browser only sends the card token and payer data.
function buildPayment(order, input) {
  const amount = money(order.total);
  if (order.payment === 'pix') return { amount, payment_method: { id: 'pix', type: 'bank_transfer' } };
  if (order.payment === 'boleto') return { amount, payment_method: { id: 'boleto', type: 'ticket' } };

  const { token, paymentMethodId, paymentTypeId } = input.card || {};
  if (!token || !paymentMethodId) throw new PaymentInputError('Dados do cartão incompletos.');
  const type = paymentTypeId === 'debit_card' ? 'debit_card' : 'credit_card';
  // Debit is always 1x; credit is limited to what the store offers.
  const installments = type === 'debit_card' ? 1 : Math.min(Math.max(Math.floor(Number(input.card.installments)) || 1, 1), MAX_INSTALLMENTS);
  // issuer_id is not allowed inside payment_method in the Orders API.
  return { amount, payment_method: { id: paymentMethodId, type, token, installments } };
}

function buildPayer(order, input) {
  const [firstName, ...rest] = order.customer.name.trim().split(/\s+/);
  const payer = { email: order.customer.email, first_name: firstName, last_name: rest.join(' ') || firstName };
  if (order.payment === 'pix') return payer;

  const cpf = onlyDigits(input.cpf);
  if (cpf.length !== 11) throw new PaymentInputError('Informe um CPF válido.');
  payer.identification = { type: 'CPF', number: cpf };

  if (order.payment === 'boleto') {
    const neighborhood = String(input.neighborhood || '').trim();
    if (!neighborhood) throw new PaymentInputError('Informe o bairro.');
    const c = order.customer;
    payer.address = {
      street_name: c.address,
      street_number: c.number || 'S/N',
      zip_code: onlyDigits(c.cep),
      neighborhood,
      city: c.city,
      state: c.state.toUpperCase(),
    };
  }
  return payer;
}

// What the store page needs to show (never includes card data).
export function summarize(mpOrder) {
  if (!mpOrder) return null;
  const p = mpOrder.transactions?.payments?.[0] || {};
  const pm = p.payment_method || {};
  return {
    id: mpOrder.id,
    status: mpOrder.status,
    statusDetail: p.status_detail || mpOrder.status_detail,
    method: pm.id,
    pix: pm.id === 'pix' ? { qrCode: pm.qr_code, qrCodeBase64: pm.qr_code_base64, ticketUrl: pm.ticket_url } : null,
    boleto: pm.type === 'ticket' ? { ticketUrl: pm.ticket_url, digitableLine: pm.digitable_line } : null,
  };
}

// Saves Mercado Pago's answer on our order and marks it as paid once processed.
function applyOrder(mpOrder) {
  const order = db.prepare('SELECT id, status, total FROM orders WHERE id = ?').get(mpOrder.external_reference);
  if (!order) return;
  db.prepare('UPDATE orders SET mp_order_id = ?, mp_status = ? WHERE id = ?').run(mpOrder.id, mpOrder.status, order.id);

  if (mpOrder.status === 'processed' && order.status === 'aguardando_pagamento') {
    // Only mark as paid if Mercado Pago charged exactly what we priced.
    if (money(mpOrder.total_amount) !== money(order.total)) {
      console.warn(`⚠️ Order ${mpOrder.id} com valor diferente do pedido ${order.id}.`);
      return;
    }
    db.prepare("UPDATE orders SET status = 'pago' WHERE id = ?").run(order.id);
  }
}

// A declined card comes back as HTTP 402 and the SDK error drops the response body, so the
// failed order is looked up by our reference to get the decline reason (status_detail).
async function findLatestOrder(externalReference) {
  const now = new Date();
  const res = await orders().search({
    options: {
      external_reference: externalReference,
      begin_date: new Date(now - 60 * 60 * 1000).toISOString(),
      end_date: now.toISOString(),
      sort_by: 'created_date',
      sort_order: 'desc',
      page_size: 1,
    },
  });
  return res.data?.[0] || null;
}

export async function createPayment(order, input = {}) {
  const body = {
    type: 'online',
    processing_mode: 'automatic',
    external_reference: order.id,
    total_amount: money(order.total),
    description: `Pedido ${order.id}`,
    payer: buildPayer(order, input),
    transactions: { payments: [buildPayment(order, input)] },
  };
  let mpOrder;
  try {
    mpOrder = await orders().create({ body, requestOptions: { idempotencyKey: randomUUID() } });
  } catch (err) {
    if (err?.status !== 402) throw err;
    mpOrder = await findLatestOrder(order.id).catch(() => null);
    // Search can lag behind creation; still report the refusal to the customer.
    if (!mpOrder) return { id: null, status: 'failed', statusDetail: null, method: body.transactions.payments[0].payment_method.id };
  }
  applyOrder(mpOrder);
  return summarize(mpOrder);
}

// Refreshes an order from Mercado Pago (used by the payment page while Pix/boleto is pending).
export async function syncOrder(mpOrderId) {
  const mpOrder = await orders().get({ id: mpOrderId });
  applyOrder(mpOrder);
  return summarize(mpOrder);
}

// Single source of truth for the store identity.
// To rename the store, edit /brand.config.json at the project root.
import brand from '../../brand.config.json';

export default brand;

export const formatPrice = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const whatsappLink = (text = '') =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;

// Link to message a customer. Brazilian numbers without a country code get 55 prepended.
export const whatsappLinkTo = (phone, text = '') => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 11) digits = '55' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

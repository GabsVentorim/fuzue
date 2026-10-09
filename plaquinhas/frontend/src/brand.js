// Fonte única da identidade da loja.
// Para mudar nome, contatos ou prefixo das plaquinhas, edite /brand.config.json na raiz.
import brand from '../../brand.config.json';

export default brand;

export const instagramLink = () => `https://www.instagram.com/${brand.instagram.replace(/^@/, '')}/`;

export const whatsappLink = (text = '') =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;

// Link para falar com um tutor. Números brasileiros sem DDI ganham o 55 na frente.
export const whatsappLinkTo = (phone, text = '') => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 11) digits = '55' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

export const telLink = (phone) => `tel:+${String(phone).replace(/\D/g, '')}`;

// Mostra o telefone no formato (27) 99988-7766, tirando o DDI.
export const formatPhone = (v) => {
  const d = String(v || '').replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return v || '';
};

// A URL que vai gravada na medalha (QR Code e tag NFC).
export const tagUrl = (code) => `${(brand.siteUrl || window.location.origin).replace(/\/$/, '')}/tag/${code}`;

// Sem siteUrl configurado, tagUrl cai no endereço de onde o painel está aberto — em
// desenvolvimento, localhost. Gravar isso numa medalha a deixaria inútil, então a tela
// de gravação avisa. Defina siteUrl em brand.config.json antes de gravar de verdade.
export const siteUrlConfigured = Boolean(brand.siteUrl);

// Link para comprar a plaquinha: a categoria de tags na loja fuzue.
// Sem shopUrl configurado, cai no WhatsApp, que sempre funciona.
export const shopTagsUrl = () =>
  brand.shopUrl
    ? `${brand.shopUrl.replace(/\/$/, '')}/loja?categoria=${brand.shopTagsCategory || 'tags'}`
    : whatsappLink(`Oi, ${brand.name}! Quero uma plaquinha para o meu pet.`);

export const shopUrlConfigured = Boolean(brand.shopUrl);

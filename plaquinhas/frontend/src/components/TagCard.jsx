import { imageUrl } from '../assets';
import brand, { whatsappLinkTo, telLink, formatPhone } from '../brand';
import { SPECIES, SEX_SYMBOL, PET_SIZES_SHORT, breedLabel } from '../labels';
import { Alert, Chat, Phone, Paw, Pin, Shield, Sparkle } from './Icons';

// O cartão que quem encontrou o pet vê. Mora num componente próprio porque a prévia do
// painel mostra exatamente esta tela — se fosse uma imitação, ela mentiria com o tempo.
//
// `preview` desliga os links: numa prévia ninguém deve abrir o WhatsApp do tutor sem querer.
export default function TagCard({ tag, preview = false }) {
  const photo = imageUrl(tag.photoUrl);
  const lost = tag.status === 'perdido';
  const message = `Olá ${tag.tutorName}! Encontrei seu pet ${tag.petName} pela plaquinha da ${brand.name}.`;

  const Action = preview ? 'span' : 'a';
  const whatsProps = preview
    ? { 'aria-disabled': true }
    : { href: whatsappLinkTo(tag.tutorWhatsapp, message), target: '_blank', rel: 'noreferrer' };
  const telProps = preview ? { 'aria-disabled': true } : { href: telLink(tag.tutorPhone) };

  return (
    <div className="tagview__card">
      {lost && (
        <div className="tagview__lost">
          <Alert width={22} height={22} />
          <span>Estou perdido! Avise a minha família</span>
        </div>
      )}

      <div className="tagview__media">
        {photo ? <img src={photo} alt={tag.petName} /> : <Paw />}
        <span className="tagview__id mono">{tag.code || '—'}</span>
      </div>

      <div className="tagview__body">
        <h1 className="tagview__name">{tag.petName || 'Nome do pet'}</h1>
        <p className="tagview__breed">
          {SPECIES[tag.species] || tag.species} · {breedLabel(tag)}
        </p>

        <div className="tagview__pills">
          {tag.sex && <span className={`pet-pill pet-pill--${tag.sex}`}>{SEX_SYMBOL[tag.sex]}</span>}
          {tag.size && <span className="pet-pill">Porte {PET_SIZES_SHORT[tag.size]}</span>}
        </div>

        {tag.notes && (
          <div className="tagview__note">
            <b>
              <Sparkle width={15} height={15} /> Cuidados & saúde
            </b>
            <p>{tag.notes}</p>
          </div>
        )}

        <div className="tagview__where">
          <div>
            <small>Região onde mora</small>
            <b>
              <Pin width={16} height={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 4 }} />
              {tag.tutorNeighborhood || '—'}
            </b>
          </div>
          <div>
            <small>Tutor responsável</small>
            <b>{tag.tutorName || '—'}</b>
          </div>
        </div>

        <div className="tagview__actions">
          <Action className="btn btn--whats btn--block" style={{ marginTop: 0 }} {...whatsProps}>
            <Chat width={20} height={20} /> Avisar pelo WhatsApp
          </Action>
          {tag.tutorPhone && (
            <Action className="btn btn--dark btn--block" style={{ marginTop: 0 }} {...telProps}>
              <Phone width={18} height={18} /> Ligar para {formatPhone(tag.tutorPhone)}
            </Action>
          )}
        </div>

        <p className="tagview__foot">
          <Shield width={16} height={16} /> Plaquinha inteligente · {brand.name} {brand.subtitle.toLowerCase()}
        </p>
      </div>
    </div>
  );
}

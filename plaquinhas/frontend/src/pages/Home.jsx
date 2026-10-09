import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Horizon from '../components/Horizon';
import { Paw, Heart, Sparkle, Shield, Nfc, QrCode, Chat, Phone2, Pin, Lock } from '../components/Icons';
import brand, { shopTagsUrl } from '../brand';
import { asset } from '../assets';
import { ease } from '../motion';

const steps = [
  {
    tone: 'pink',
    icon: <Nfc />,
    title: 'Aproxime',
    text: 'Encoste a traseira do celular na medalha (NFC) ou aponte a câmera para o QR Code no verso.',
  },
  {
    tone: 'red',
    icon: <Shield />,
    title: 'Veja a ficha',
    text: 'A ficha do pet abre na hora: nome, porte, cuidados de saúde e o bairro onde ele mora.',
  },
  {
    tone: 'blue',
    icon: <Chat />,
    title: 'Avise o tutor',
    text: 'Um toque e você já está no WhatsApp da família, com a mensagem pronta para enviar.',
  },
];

const perks = [
  { icon: <Phone2 />, title: 'Sem aplicativo', text: 'Abre no navegador de qualquer celular' },
  { icon: <Pin />, title: 'Bairro na ficha', text: 'O reencontro acontece perto de casa' },
  { icon: <Heart />, title: 'Cuidados de saúde', text: 'Alergias e remédios à vista de quem achou' },
  { icon: <Sparkle />, title: 'Dados sempre atuais', text: 'A loja atualiza sem trocar a medalha' },
];

export default function Home() {
  const heroPhoto = asset('hero');

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="pill">
              <Sparkle width={16} height={16} /> Identificação por NFC & QR Code
            </span>
            <h1>
              Protegendo quem você mais ama com apenas um <span className="hl">toque</span>.
            </h1>
            <p className="muted">
              As plaquinhas da {brand.name} conectam quem encontrou o pet direto ao tutor, em segundos, sem precisar
              instalar nada.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary" href={shopTagsUrl()} target="_blank" rel="noreferrer">
                Quero uma plaquinha <Paw width={20} height={20} />
              </a>
              <Link className="btn btn--ghost" to="/entrar">
                <Lock width={18} height={18} /> Área do lojista
              </Link>
            </div>
          </div>

          {heroPhoto ? (
            <div className="hero__photo">
              <img src={heroPhoto} alt="" />
            </div>
          ) : (
            <div className="hero__art" aria-hidden>
              <motion.div
                className="blob blob--red"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease }}
              >
                <Paw />
              </motion.div>
              <motion.div
                className="blob blob--blue"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.12, ease }}
              >
                <QrCode />
              </motion.div>
              <motion.div
                className="blob blob--cream"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.24, ease }}
              >
                <Heart />
              </motion.div>
              <Sparkle className="float float--1" />
              <Paw className="float float--2" />
              <Sparkle className="float float--3" />
            </div>
          )}
        </div>
        <Horizon />
      </section>

      <section className="section container" id="como-funciona">
        <div className="section__head">
          <h2 className="section__title">Encontrou um pet com a medalha {brand.name}?</h2>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          São três passos, e nenhum deles precisa de cadastro ou aplicativo.
        </p>
        <div className="cats" style={{ marginTop: 24 }}>
          {steps.map((s, i) => (
            <motion.article
              key={s.title}
              className={`cat cat--${s.tone}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <span className="cat__n">{i + 1}</span>
              <div className="cat__art">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="perks">
          {perks.map((p) => (
            <div className="perk" key={p.title}>
              {p.icon}
              <span>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

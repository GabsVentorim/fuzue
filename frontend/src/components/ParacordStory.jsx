import { imageUrl, productImage } from '../assets';
import useScrollProgress from '../hooks/useScrollProgress';

const IMG = (f) => imageUrl(`/assets/paracord/${f}`);

// The collar's story, told the way product pages tell it: one idea per screen, huge type, and
// photos that move with the scroll (scrubbed through the --p variable from useScrollProgress).
// All collars are paracord, so this shows for every product in "coleiras".
export default function ParacordStory({ product, color }) {
  const intro = useScrollProgress({ pinned: true, rest: 0.6 });
  const pull = useScrollProgress({ pinned: true, rest: 1 });
  const inside = useScrollProgress();
  const weave = useScrollProgress();
  const colors = useScrollProgress({ pinned: true, rest: 0 });
  const shots = product.colors.filter((c) => c.image);

  return (
    <div className="story">
      {/* 1. the collar grows into the screen while the headline settles */}
      <section className="story__scene story__intro" ref={intro}>
        <div className="story__stick">
          <h2 className="story__mega">Paracord.<br /><span>Trançada à mão.</span></h2>
          <div className="story__hero">
            <img src={productImage(product, color)} alt={`${product.name}${color ? ` — ${color.name}` : ''}`} />
          </div>
        </div>
      </section>

      {/* 2. strength: the collar itself (in the chosen colour) turns and stretches while the words land */}
      <section className="story__scene story__pull" ref={pull}>
        <div className="story__stick">
          <div className="story__pull-photo story__pull-photo--product">
            <img src={productImage(product, color)} alt={`${product.name}${color ? ` — ${color.name}` : ''}`} />
          </div>
          <div className="story__words" aria-label="Puxa. Estica. Aguenta.">
            <span style={{ '--k': 0 }}>Puxa.</span>
            <span style={{ '--k': 1 }}>Estica.</span>
            <span style={{ '--k': 2 }}>Aguenta.</span>
          </div>
          <p className="story__pull-note">Paracord nasceu para segurar paraquedas. No pescoço do seu cachorro, segura as aventuras do passeio.</p>
        </div>
      </section>

      {/* 3. inside the cord: the photo zooms out as you arrive */}
      <section className="story__split container" ref={inside}>
        <div className="story__frame story__frame--zoom">
          <img src={IMG('fios-internos.webp')} alt="Paracord aberto mostrando os fios internos" />
        </div>
        <div className="story__copy">
          <h3>Por dentro,<br />fios e mais fios.</h3>
          <p>O paracord tem uma capa trançada por fora e vários fios por dentro. É isso que deixa a coleira firme sem ficar dura.</p>
        </div>
      </section>

      {/* 4. the weave: two photos drifting at different speeds */}
      <section className="story__weave container" ref={weave}>
        <div className="story__copy story__copy--center">
          <h3>A trama que abraça.</h3>
          <p>Cada volta do cordão é apertada à mão, nó por nó, até virar uma coleira macia no pescoço e forte na guia.</p>
        </div>
        <div className="story__duo">
          <div className="story__frame story__frame--slow"><img src={IMG('trama-cobra.webp')} alt="Trama de paracord em várias cores" /></div>
          <div className="story__frame story__frame--fast"><img src={IMG('rolo.webp')} alt="Rolo de cordão paracord" /></div>
        </div>
      </section>

      {/* 5. the colours slide sideways as you scroll down */}
      {shots.length > 1 && (
        <section className="story__scene story__colors" ref={colors} style={{ '--n': shots.length }}>
          <div className="story__stick">
            <h3 className="story__colors-title">Escolha a cor do passeio.</h3>
            <div className="story__rail">
              {shots.map((c) => (
                <figure key={c.hex} className="story__swatch">
                  <img src={imageUrl(c.image)} alt={`${product.name} — ${c.name}`} loading="lazy" />
                  <figcaption><span style={{ background: c.hex }} />{c.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <p className="story__credits container">
        Fotos ilustrativas de paracord: “MIL-C-5040 Type III 550 Paracord” por Rawkhopper, “Paracord cobra” por Akinnawid (CC BY-SA 3.0)
        e “Paracord Commercial Type III Coil” por David J. Fred (CC BY-SA 2.5), via Wikimedia Commons.
      </p>
    </div>
  );
}

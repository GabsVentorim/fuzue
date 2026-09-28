# Imagens do site

Todas as imagens fixas do site ficam aqui e são referenciadas **só** pela seção `assets`
do `brand.config.json` (na raiz do projeto). Os componentes nunca usam caminhos de imagem
diretamente — eles leem daquele arquivo via `frontend/src/assets.js`.

```
assets/
  logo/           logo.png (original) e logo-transparente.png (sem fundo, usada no header)
  brand/          favicon.svg, og-image.png
  site/           hero.jpg, banners
  site/categorias coleiras.jpg, bandanas.jpg, presilhas.jpg
  placeholders/   pet.svg (foto padrão de pet)
```

Para trocar uma imagem: coloque o arquivo na pasta e aponte o caminho no `brand.config.json`,
por exemplo `"logo": "/assets/brand/logo.png"`. Deixe vazio (`""`) para usar o desenho padrão.

Fotos de produtos e de pets **não** ficam aqui: são enviadas pelo painel admin / área do
cliente e salvas em `backend/uploads/`.

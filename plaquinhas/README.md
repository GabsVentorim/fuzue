# Fuzuê petstore — plaquinhas de identificação

Sistema das medalhas inteligentes da Fuzuê. Quem encontra um pet encosta o celular
na medalha (NFC) ou aponta a câmera para o QR Code, e a ficha do pet abre no navegador
com um botão direto para o WhatsApp do tutor. A loja cadastra e mantém as plaquinhas
num painel protegido.

A arquitetura e o sistema de design foram portados do projeto **fuzue**.

---

## Como rodar

Precisa de **Node 22 ou mais novo**. São dois processos, cada um no seu terminal.

**1. Backend** (API + banco)

```bash
cd backend
npm install
cp .env.example .env     # preencha o JWT_SECRET (instruções dentro do arquivo)
npm run dev
```

Sobe em `http://localhost:4100`.

**2. Frontend** (site)

```bash
cd frontend
npm install
npm run dev
```

Sobe em `http://localhost:5273`. O Vite faz proxy de `/api` e `/uploads` para o backend,
então não precisa configurar nada a mais em desenvolvimento.

> As portas 4100 e 5273 foram escolhidas para não colidirem com o fuzue (4000 e 5173),
> caso os dois estejam rodando na mesma máquina.

**3. Crie o primeiro acesso da loja**

```bash
cd backend
npm run create-admin -- voce@fuzuepetstore.com.br "uma-senha-longa" "Seu Nome"
```

Não existe cadastro público: toda conta nasce por esse comando. Rodá-lo de novo com um
e-mail que já existe apenas troca a senha dele — é assim que se recupera um acesso perdido.

---

## As telas

| Rota | Quem usa | O que faz |
|---|---|---|
| `/` | público | Explica a plaquinha e como avisar o tutor |
| `/tag/:codigo` | **quem achou o pet** | A ficha: foto, cuidados, bairro, WhatsApp e telefone |
| `/entrar` | loja | Login |
| `/admin` | loja | Visão geral: totais, pets perdidos, últimas cadastradas |
| `/admin/plaquinhas` | loja | Lista com busca, filtro por status e troca rápida de status |
| `/admin/nova` | loja | Cadastro de uma plaquinha |
| `/admin/plaquinhas/:id` | loja | Edição, foto do pet, QR/NFC e histórico |
| `/admin/senha` | loja | Troca da própria senha |

`/tag/:codigo` é a rota mais importante: é ela que vai gravada na medalha. Quem a abre
está na rua, com um pet perdido na mão — por isso a foto, o nome e os botões de contato
vêm antes de qualquer outra coisa.

---

## Estrutura

```
brand.config.json          Nome, contatos, prefixo das plaquinhas e imagens da marca
backend/
  src/
    server.js              Express: CORS, cookies, rotas, arquivos enviados
    db.js                  SQLite (better-sqlite3): schema, migrações e row mappers
    auth.js                Sessão em cookie httpOnly, requireAuth / requireAdmin
    uploads.js             Upload de imagem (multer), em backend/uploads/
    util.js                Código da medalha, telefone, listas de valores válidos
    routes/
      auth.js              Login, logout, /me, troca de senha
      tags.js              Consulta pública de uma plaquinha
      admin.js             CRUD das plaquinhas (exige admin)
    data/tags.seed.json    Plaquinhas de exemplo da primeira execução
  scripts/
    create-admin.js        Cria ou redefine a senha de um admin
    make-admin.js          Promove uma conta existente a admin
    reset-data.js          Apaga as plaquinhas e recarrega as de exemplo
  data/fuzue-tags.db       O banco (criado sozinho, fora do versionamento)
frontend/
  src/
    styles.css             O sistema de design (cores, botões, painel, tabelas…)
    api.js                 Único lugar que fala com a API
    brand.js / assets.js   Identidade da loja e resolução de imagens
    labels.js              Rótulos em português (espécie, porte, status)
    context/               Sessão (AuthContext) e avisos (ToastContext)
    components/            Header, Footer, Logo, Toast, QrModal, ícones…
    pages/                 Home, PublicTag, Login e o painel em pages/admin/
  public/assets/           Logo e favicon
```

---

## Decisões que valem saber

**O banco é um arquivo.** `backend/data/fuzue-tags.db`, SQLite via `better-sqlite3`, igual
ao fuzue. O schema vive em `db.js` e é aplicado na primeira conexão; mudanças posteriores
entram como migrações guardadas por `hasColumn`, então o banco existente nunca é perdido.

> ⚠️ **Em hospedagem gratuita (Render, Railway, Fly) o disco costuma ser efêmero** — o
> arquivo do banco some a cada deploy. Para valer em produção, é preciso um disco
> persistente (volume) ou trocar o `db.js` por um banco gerenciado.

**A sessão é um cookie httpOnly**, não um token no `localStorage`. O JavaScript da página
não consegue ler o cookie, então um XSS não rouba a sessão. É por isso que `api.js` manda
`credentials: 'include'` e o `AuthContext` pergunta ao servidor quem está logado.

**O cookie se chama `fuzue_tags_session`, não `fuzue_session`.** Cookies não distinguem
porta: em `localhost`, usar o mesmo nome da loja fuzue derrubaria a sessão de uma ao
entrar na outra.

**A ficha pública mostra menos do que o banco guarda.** `toPublicTag` em `db.js` monta
uma visão separada, sem id interno, sem quem cadastrou e sem contadores. Uma plaquinha
`inativo` responde 404, igual a uma que não existe — quem devolveu a medalha para a loja
não quer os dados antigos no ar.

**O prefixo das plaquinhas é `FZ-`**, configurável em `brand.config.json` → `tag.prefix`.

**O código da medalha tem duas regras diferentes.** Os códigos novos são gerados sem
vogais e sem `0`, `1`, `I` e `O`, porque são ditados por telefone e gravados à mão. Mas a
validação aceita qualquer alfanumérico, para as medalhas antigas (`CR-1001`) continuarem
editáveis.

**A consulta pública tem limite por IP** (60 em 10 minutos). O código é curto e a ficha
mostra o telefone do tutor, então sem o limite daria para varrer os códigos por tentativa
e erro.

---

## Em produção

No backend, defina no `.env`:

- `JWT_SECRET` — obrigatório, senão o servidor se recusa a subir
- `FRONTEND_ORIGIN` — o endereço do site (o cookie exige origem explícita)
- `ADMIN_EMAILS` — e-mails que viram admin automaticamente ao entrar

No frontend, se a API ficar em outro domínio, defina `VITE_API_URL`
(ex.: `https://api.fuzuepetstore.com.br/api`) e rode `npm run build`.

### ⚠️ Antes de gravar a primeira medalha: `siteUrl`

Em `brand.config.json`, o campo `siteUrl` está **vazio** — o domínio novo da Fuzuê ainda
não foi definido aqui. Enquanto ele estiver vazio, o QR Code e o endereço NFC usam o
endereço de onde o painel está aberto, que em desenvolvimento é `http://localhost:5273`.
Uma medalha gravada assim não funciona para ninguém.

A tela de gravação mostra um aviso enquanto isso não for resolvido. Preencha o `siteUrl`
com o domínio real antes de gravar qualquer medalha física.

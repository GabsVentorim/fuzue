# Fuzuê Petstore

Online store for dog collars, bandanas, and clips. The frontend and backend are separate apps.

```
fuzue/
├── brand.config.json   ← store name, slogan, contacts, shipping and ALL site images (edit here)
├── backend/            ← Node + Express REST API + SQLite (port 4000)
└── frontend/           ← React + Vite site (port 5173)
```

## Run it (Node 18+)

```bash
# 1. API
cd backend
cp .env.example .env      # fill in JWT_SECRET, ADMIN_EMAILS (and Google, optional)
npm install
npm run dev

# 2. Site
cd frontend
cp .env.example .env      # VITE_GOOGLE_CLIENT_ID (optional)
npm install
npm run dev
```

Then open http://localhost:5173.

Run the backend in **one terminal only**. If you see "A porta 4000 já está em uso" (port 4000 is already in use), another backend is already running. Close it with Ctrl+C, or run `lsof -ti:4000 | xargs kill`.

## Data

Everything lives in a SQLite file, `backend/data/fuzue.db`, which is created on the first run. The first run also imports `backend/src/data/products.json` and `orders.json`. After that, manage products in the admin panel. The JSON files are only the seed.

- `npm run reset-data` (in `backend/`) restores the products from `products.seed.json` and deletes orders and stock history. Users and pets are kept.
- Back up the store by copying `backend/data/` and `backend/uploads/`.

## Accounts and login

- Customers sign up with e-mail and password, or with **Google**. Sessions use an httpOnly cookie that lasts 30 days.
- In **Minha conta**, customers can edit their details, save addresses, see their orders and register their **pets**. Pet fields: species, name, sex, birth date (can be approximate), breed or mixed breed/SRD (which requires a size), weight, neck size (used to suggest a collar size), coat colour, neutered, allergies and notes, and a photo.
- At checkout, logged-in customers get their details and default address filled in automatically.

### Setting up login with Google

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), go to **Create credentials → OAuth client ID → Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:5173`, plus your real domain when you deploy.
3. Put the Client ID in `backend/.env` (`GOOGLE_CLIENT_ID`) and in `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`).

If the Client ID isn't set, the Google button stays hidden and e-mail login still works.

## Admin

Make yourself an admin in either of two ways:

- Put your e-mail in `ADMIN_EMAILS` in `backend/.env`. That e-mail becomes admin when it signs up or logs in.
- Or create the account on the site and run `npm run make-admin -- you@email.com` in `backend/`.

The **Admin** link then shows up in the header (`/admin`):

| Page | What's there |
|---|---|
| Visão geral | Sales today and this month, average order value, orders by status, low stock, best sellers, **pet birthdays this month** (with a WhatsApp link to the owner), latest orders |
| Pedidos | Filter by status, search, order details, change status. Cancelling an order puts the items back in stock |
| Produtos | Create and edit products: photo upload, colours, sizes, badge, featured, active/inactive |
| Estoque | Add stock or take it out (with a note), low-stock alert, full history of movements |
| Clientes | Customer list, customer details with pets, orders and addresses, give or remove admin access |

## Images: all in one place

- **Fixed site images** (logo, light logo, favicon, share image, hero, category images, pet placeholder):
  - The files go in `frontend/public/assets/`.
  - The paths go in the `assets` section of `brand.config.json`, e.g. `"logo": "/assets/brand/logo.png"`.
  - An empty value falls back to the built-in drawing, such as the text logo or illustrations.
  - See `frontend/public/assets/README.md`.
- **Company logo:** the files live in `frontend/public/assets/logo/`. `logo.png` is the original; the footer shows it as a rounded sticker. `logo-transparente.png` is a copy with the background removed, used in the header. To change the logo, replace the files and keep the paths in `assets.logo` / `assets.logoLight`.
- **Product and pet photos** are uploaded through the site and saved in `backend/uploads/`.
- In the code, every image URL comes from `frontend/src/assets.js` (`asset('logo')`, `imageUrl(path)`). Components never have image paths written into them.

Change the colours in the `:root` block at the top of `frontend/src/styles.css`.

## API

| Method | Route | What it does |
|---|---|---|
| GET | `/api/products?category=&search=&sort=&featured=` | List active products |
| GET | `/api/products/:slug` | One product |
| GET | `/api/categories` · `/api/store` | Categories · brand info |
| POST | `/api/orders` | Create an order (priced on the server; linked to the user when logged in) |
| GET | `/api/orders/:id` | Order details |
| POST · GET | `/api/orders/:id/pay` · `/api/orders/:id/payment` | Pay an order with Mercado Pago · current payment status |
| POST | `/api/auth/register` · `login` · `google` · `logout` | Auth |
| GET | `/api/auth/me` | Current user (or `null`) |
| GET/PUT | `/api/me` · `PUT /api/me/password` | Profile |
| CRUD | `/api/me/addresses` · `/api/me/pets` (+ `POST /:id/photo`) | Addresses and pets |
| GET | `/api/me/orders` | My orders |
| — | `/api/admin/*` | Dashboard, products, stock, uploads, orders, customers (admin only) |

## Payments (Mercado Pago)

Payments use **Mercado Pago Checkout Transparente** through the **Orders API** (`POST /v1/orders`, official `mercadopago` SDK). The customer pays inside the store, with no redirect and no Mercado Pago login. The money goes to your Mercado Pago account.

- After **Continuar para o pagamento** in the checkout, the order is created (priced on the server, stock reserved). The customer then goes to `/pagamento/:id` (`frontend/src/pages/Payment.jsx`).
- **Cartão:** the card fields are Mercado Pago's secure iframes (MercadoPago.js). Only the card token reaches the server. Up to 3 installments; debit is always 1x.
- **Pix:** the page shows the QR code and the copy-and-paste code, then updates on its own when the payment is approved.
- **Boleto:** asks for CPF and neighborhood, then shows the boleto link and the digitable line.
- The server always charges the order total it computed. When Mercado Pago reports the order as `processed`, the store order changes to **Pago**.

Setup:

1. Open the Fuzue Petstore application in the [developer panel](https://www.mercadopago.com.br/developers/panel/app) and go to **Credenciais**.
2. Put the **Access Token** in `MP_ACCESS_TOKEN` (backend) and the **Public Key** in `VITE_MP_PUBLIC_KEY` (frontend). Both must come from the same tab: **Teste** while testing, **Produção** when selling for real.
3. Restart both `npm run dev` processes.

Testing:

- Use `test_user_br@testuser.com` as the e-mail in the checkout. That is the buyer e-mail Mercado Pago accepts for tests.
- To have a test Pix approved automatically, start the customer name with `APRO` (e.g. "APRO Teste").
- Test card: Visa `4235 6477 2802 5682`, CVV `123`, expiry `11/30`, cardholder name `APRO`, CPF `12345678909`.
- Boleto tests only check that the boleto is created. It stays pending.

If `MP_ACCESS_TOKEN` or `VITE_MP_PUBLIC_KEY` is empty, the store works as before: payment is arranged over WhatsApp. Stock is reserved when the order is created. If a customer never pays, cancel the order in the admin.

## Deploying

- **Backend:** Render, Railway, or Fly.io.
  - Set `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `FRONTEND_ORIGIN=https://yoursite.com` and `MP_ACCESS_TOKEN`.
  - Use a **persistent disk** for `backend/data/` and `backend/uploads/`.
- **Frontend:** Vercel or Netlify.
  - Set `VITE_API_URL=https://your-api.com/api`, `VITE_GOOGLE_CLIENT_ID` and `VITE_MP_PUBLIC_KEY`.
  - Add an SPA rewrite so every route serves `index.html`.
  - Login uses a cookie. The simplest setup is the API on a subdomain of the same site (`api.yoursite.com`). If the frontend and API are on unrelated domains, browsers may block the cookie.

## Next steps before selling for real

- E-mail confirmations and password reset.

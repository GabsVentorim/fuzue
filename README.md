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

## Shipping (SuperFrete)

Shipping prices are real quotes from [SuperFrete](https://superfrete.readme.io): PAC, SEDEX, Mini Envios, Jadlog, Loggi and J&T.

- Put these in `backend/.env`:
  - `SUPERFRETE_TOKEN` — **secret**. It stays on the server; the site only calls `/api/shipping/quote`.
  - `STORE_CEP` — the CEP orders ship from.
- Customers can calculate shipping on the product page and in the cart, and choose the carrier at checkout.
- When the order is placed, the server fetches the quote again, so the price can't be changed in the browser.
- **Free shipping:** above `shipping.freeFrom` in `brand.config.json`, the cheapest option is free.
- Package size per item is `DEFAULT_PACKAGE` in `backend/src/shipping.js`: 16×11×2 cm, 100 g.
- Without a token, the site falls back to the flat fee (`shipping.fee`).

## CPF and support tickets

- **When the CPF is asked for:**
  - at e-mail sign-up;
  - in **Minha conta → Meus dados**, for accounts created with Google;
  - at checkout.
- **Validation:** the check digits are checked as soon as the 11th digit is typed (✓ valid / ✗ invalid). The server checks them again.
- **Storage:** the CPF is a **unique** field on the user. It is never the primary key; the primary key is the serial `id`.
- **Locked after it's saved:** customers can't edit their CPF. To change it, they open a **chamado** (support ticket) in Meus dados. You approve or reject it in **Admin → Chamados**, and the dashboard shows a notice when tickets are waiting.
- **At checkout:** logged-in customers always buy with the CPF on their account. If the account has no CPF yet, the CPF used in the first order is saved to it.

## Home carousel

The top of the home page is a carousel managed in **Admin → Carrossel**. Use it for new arrivals, brand collections and campaigns.

- **Images:** a desktop image (recommended 1600×600) and an optional phone image (900×1100). They are uploaded to `backend/uploads/banners/`.
- **Text, all optional:** title, subtitle, button and link (`/loja?categoria=coleiras`, a product page, or an `https://` address).
- **Scheduling:** set start and end dates to plan collections ahead. You can also reorder banners and switch them on or off.
- **Behaviour:** slides change every 5 s and pause on hover. There are arrows and dots, swipe on phones and keyboard arrows.
- **No banners live:** the home shows the default hero instead.

## Coupons

Create coupons under **Admin → Cupons**. Customers enter them in the **Pagamento** section of the checkout.

- **Types:**
  - percentage off the products;
  - fixed amount in R$;
  - free shipping.
- **Optional rules:** minimum order value, usage limit, expiry date, and one use per customer (checked by CPF).
- **Checked on the server:** the coupon is validated again when the order is placed, so nobody can forge a discount in the browser.
- **With Pix:** the 5% Pix discount applies to the products after the coupon.
- **Cancelling:** cancelling an order gives its coupon use back.

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
- **Animated header logo:** in the header, the blue ball bounces and the dog barks now and then. It uses `logo-sem-bola.png` (the logo without the ball) plus `logo-bola.png` (just the ball), set in `assets.logoAnimated` with positions as percentages of the image. Remove `logoAnimated` to go back to the static logo. People with reduced motion turned on see it still.
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
| POST | `/api/auth/register` · `login` · `google` · `logout` | Auth |
| GET | `/api/auth/me` | Current user (or `null`) |
| GET/PUT | `/api/me` · `PUT /api/me/password` | Profile |
| CRUD | `/api/me/addresses` · `/api/me/pets` (+ `POST /:id/photo`) | Addresses and pets |
| GET | `/api/me/orders` | My orders |
| — | `/api/admin/*` | Dashboard, products, stock, uploads, orders, customers (admin only) |

## Deploying

- **Backend:** Render, Railway, or Fly.io.
  - Set `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS` and `FRONTEND_ORIGIN=https://yoursite.com`.
  - Use a **persistent disk** for `backend/data/` and `backend/uploads/`.
- **Frontend:** Vercel or Netlify.
  - Set `VITE_API_URL=https://your-api.com/api` and `VITE_GOOGLE_CLIENT_ID`.
  - Add an SPA rewrite so every route serves `index.html`.
  - Login uses a cookie. The simplest setup is the API on a subdomain of the same site (`api.yoursite.com`). If the frontend and API are on unrelated domains, browsers may block the cookie.

## Next steps before selling for real

- Real payments: Mercado Pago or Stripe, with Pix support.
- E-mail confirmations and password reset.

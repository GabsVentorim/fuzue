# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Pet owners (mostly dog owners, some cat owners) who discover Fuzuê on Instagram (@fuzue_petstore) and buy on their phone. Mobile is the primary context. They are browsing for something cute for their pet, then need to choose a colour and the right size and check out quickly.

## Product Purpose
Fuzuê Petstore is an online shop for handmade dog accessories: collars (including hand-braided paracord), bandanas and hair clips.

The site has to do four things:
- turn an Instagram visit into a purchase;
- make choosing a colour and size feel easy and certain;
- handle orders, shipping (SuperFrete), coupons and customer accounts;
- give the owner an admin panel to run the shop.

## Positioning
- **Handmade:** pieces are made by hand in small batches.
- **Cheerful colours and patterns:** colour is the heart of the brand.
- **Getting the size right:** an official size table (XPP 25 to XXG 60 cm), a breed and size finder, a printable tape measure, and easy size exchanges within 30 days.

## Operating Context
- **Discovery and buying:** customers find the shop on Instagram and buy on a phone. They can create an account (with Google or e-mail) and save their address and their pets.
- **Checkout:**
  - CPF is required and validated;
  - Pix gets 5% off;
  - free shipping on orders over R$ 150;
  - shipping is a real SuperFrete quote.
- **Admin:** the owner runs products, stock, orders, coupons, home carousel banners, CPF-change tickets and customers from /admin.

## Capabilities and Constraints
- **Stack:** React 18 + Vite frontend and an Express + SQLite backend. All styles live in `frontend/src/styles.css`.
- **Images:** centralised in `brand.config.json` → `assets`. Product photos are uploaded through the admin panel.
- **Home hero:** a carousel managed by the admin. The original illustrated hero shows only when no banners are live.
- **Header logo:** animated (bouncing ball, blinking and barking dog), built from layers cut out of the real logo.
- **Language:** the UI is in Brazilian Portuguese.

## Brand Commitments
- **Identity:** the name is "Fuzuê · Petstore". The logo is "Fuzuê" lettering with a lying-down dog and a blue ball, in red #FE2A0A and blue on pink. The dog's style and lines must not change.
- **Colours:** pink, red and blue.
- **Voice:** playful, warm and affectionate. The shop calls its products "mimos" (treats/little gifts).
- **Contact:** fuzue.petstore@gmail.com and Instagram @fuzue_petstore.

## Evidence on Hand
- **Assets we have:**
  - the logo files in `frontend/public/assets/logo/`;
  - real paracord collar photos in colour variants (`frontend/public/assets/produtos/coleira-paracord/`);
  - the other products, which are drawn illustrations (ProductArt).
- **Coming later:** more real photos.
- **Do not fabricate:** there are no testimonials, review counts, sales numbers or press yet, so the site must not make them up.

## Product Principles
1. **Phone first:** every flow must feel effortless on a phone opened from Instagram.
2. **Size certainty:** never leave the customer unsure about size. A size is always pre-selected, and help is always one tap away.
3. **Colour leads:** let the products' colours carry the page.
4. **Handmade warmth over corporate polish:** playful, but always legible and trustworthy at checkout.

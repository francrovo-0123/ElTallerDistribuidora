# El Taller Distribuidora - E-commerce

Plataforma web de e-commerce y panel de administración conectada a Supabase para la gestión de productos, pedidos y usuarios.

## Tecnologías Utilizadas

* HTML5 / JavaScript (Vanilla)
* Tailwind CSS (compilado con CLI para producción → `client/output.css`)
* Supabase (PostgreSQL, Auth, Storage)
* Font Awesome (íconos)

## Estructura del Proyecto

```
Pagina Web ElTaller/
├── client/                      # Frontend (publicar esta carpeta)
│   ├── index.html
│   ├── admin.html
│   ├── checkout.html / checkout.js
│   ├── contacto.html            # Formulario → tabla mensajes_contacto
│   ├── mi-cuenta.html           # Historial por user_id + email
│   ├── robots.txt / sitemap.xml
│   ├── privacidad.html / terminos.html
│   ├── output.css
│   └── …
├── server/
│   ├── schema-completo.sql      # Schema + RLS endurecido + Storage
│   ├── supabase-rls-seguro.sql  # Parche RLS para DB ya existente
│   └── supabase-*.sql           # Parches individuales
├── package.json
└── tailwind.config.js
```

## Setup rápido

1. Crear proyecto en [Supabase](https://supabase.com).
2. SQL Editor → ejecutar `server/schema-completo.sql`  
   (si la DB ya existía con RLS abierto: ejecutar `server/supabase-rls-seguro.sql`).
3. Storage: bucket público `productos-img`.
4. Authentication → Email/Password.
5. Crear usuario admin con el mismo email que `CORREO_ADMIN` / `is_admin()` (`eltalleradmin@gmail.com`).
6. Pegar `SUPABASE_URL` y anon key en los scripts del `client/`.
7. `npm install` && `npm run build:css`.
8. Publicar la carpeta `client/` (Netlify, Vercel, Apache, etc.).

### Si la tienda ya está en producción

Ejecutá **solo** `server/supabase-rls-seguro.sql` en el SQL Editor. Eso:

* endurece RLS (escrituras admin; pedidos propios; insert contacto público)
* agrega `pedidos.user_id`
* crea `mensajes_contacto`
* crea RPCs `descontar_stock` y `registrar_uso_cupon`

Para **stock concurrente**, precios y cupones seguros, preferí:

1. `server/supabase-checkout-seguro.sql`
2. `server/supabase-security-hardening.sql`

(`supabase-stock-concurrencia.sql` quedó deprecado: solo deja `CHECK (stock >= 0)` y revoca grants; **no** recrea la RPC insegura.)

## Tailwind CSS

```bash
npm install
npm run build:css
npm run watch:css
```

## SEO

* Favicon + meta description + Open Graph / Twitter cards en las páginas HTML
* `client/robots.txt` y `client/sitemap.xml`
* Reemplazá `https://eltallerdistribuidora.com` por tu dominio real en esos dos archivos y en las meta `og:image`

### 404 en hosting

* **Netlify**: `404.html` en la raíz publicada
* **Vercel**: rewrite a `/404.html`
* **Apache**: `ErrorDocument 404 /404.html`

## Contacto

El formulario de `contacto.html` guarda en la tabla `mensajes_contacto`.  
El admin los ve en **Mensajes**. El link `mailto:` del footer sigue como contacto directo.

## Pago

Solo **transferencia bancaria** + confirmación por WhatsApp.  
Actualizá CBU / alias reales en `checkout.html` cuando los tengas.

## Seguridad (RLS + hardening)

* Lectura pública: productos, categorías, configuración (no cupones)
* Escritura de catálogo / cupones / config / storage: solo `is_admin()` (email admin)
* Pedidos: insert solo vía RPC `crear_pedido_con_stock`; lectura propia (`user_id` o email de pedidos guest sin `user_id`); update/delete solo admin
* Contacto: insert público con límites de largo; lectura solo admin
* Precios/stock/cupones: el front manda solo `id`/`cantidad`/`talle` + código; el servidor recalcula
* Headers: `client/vercel.json` y `client/_headers` (CSP, clickjacking, nosniff)
* XSS: `client/security.js` escapa datos al renderizar
* Config pública centralizada: `client/supabase-config.js` (nunca la **service_role**)
* Scripts legacy abiertos (`supabase-rls-pedidos.sql`, etc.) están **deprecados** — no los ejecutes

### Si la tienda ya está en producción

1. `server/supabase-rls-seguro.sql`
2. `server/supabase-checkout-seguro.sql`
3. **`server/supabase-security-hardening.sql`** ← obligatorio tras este audit

Eso endurece validación de payload, IDOR por email, contacto y revoca grants peligrosos de stock.

## Funcionalidades

* Catálogo, carrito, cupones, checkout por transferencia + WhatsApp
* Panel admin: productos, pedidos, cupones, portada, mensajes
* Cuenta de cliente: historial por `user_id` / email
* Privacidad y términos

## Scripts SQL

| Archivo | Uso |
|---------|-----|
| `schema-completo.sql` | Proyecto nuevo (todo en uno) |
| `supabase-rls-seguro.sql` | Endurecer RLS en DB existente |
| `supabase-checkout-seguro.sql` | Precios/cupones/stock vía RPC |
| `supabase-security-hardening.sql` | Validación payload + IDOR + contacto |
| `supabase-*.sql` (otros) | Parches viejos / deprecados — no usar |

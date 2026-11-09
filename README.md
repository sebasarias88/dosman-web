# Dosman · Web de pedidos (demo)

Web pública para que los clientes de **Dosman · Cholao & Coffee** (sede principal) hagan pedidos en línea, con panel del negocio.
Este repo es el **demo de venta**: todo funciona en el navegador, sin base de datos.

## Tecnología

- [Astro 7](https://astro.build) (páginas estáticas, muy rápidas y buenas para Google) + islas de **React 19** para lo interactivo (menú, carrito, checkout, panel).
- **Tailwind CSS 4**, fuentes Bricolage Grotesque (títulos) y Plus Jakarta Sans (texto).
- **pnpm** como gestor de paquetes (nunca npm).
- **GSAP + ScrollTrigger** para el vaso que se llena con el scroll.
- **nanostores** para el carrito compartido entre islas (guardado en el navegador).
- Despliegue pensado para **Cloudflare Pages** (gratis).

## Comandos

```bash
pnpm install
pnpm images   # descarga y optimiza las fotos de ejemplo de Unsplash (AVIF + WebP); solo baja las que faltan o cambiaron
pnpm dev      # http://localhost:4321
pnpm check    # revisión de tipos
pnpm build    # genera dist/
pnpm icons    # regenera favicon, íconos y la imagen para compartir (og.png)
```

> Sin `pnpm images` la web funciona igual, pero muestra el escudo de Dosman en lugar de las fotos.

## Páginas

| Ruta | Qué es |
| --- | --- |
| `/` | Inicio: interruptor Frío/Caliente, el vaso que se arma con el scroll, los de la corona, cómo pedir, ubicación |
| `/menu` | Menú con buscador, categorías, personalizador de producto y agotados en vivo |
| `/checkout` | Domicilio / recoger / en el parque, datos, pago (efectivo, transferencia con comprobante, pago en línea simulado) |
| `/pedido?id=…` | Seguimiento del pedido en tiempo real + mensaje completo por WhatsApp |
| `/admin` | Panel del negocio: pedidos en vivo con sonido, agotados, abrir/cerrar, pagos en línea |

## Cómo mostrar el demo al cliente

1. Abre `/admin` en el computador (botón **Entrar**, los datos ya están puestos).
2. En el celular (o en otra pestaña) abre la web, elige productos y confirma un pedido.
3. El pedido aparece en el panel con sonido. Muévelo de columna y mira cómo cambia el seguimiento del cliente.
4. En **Menú y agotados** apaga un producto: en la web sale "Agotado hoy" al instante.

> Las pestañas se comunican con `BroadcastChannel`, así que el "en vivo" funciona entre pestañas del **mismo navegador**. En producción se hace con Supabase Realtime y funciona entre cualquier dispositivo.

## Qué cambia al pasar a producción

- `src/lib/demo-backend.ts` se reemplaza por llamadas al sistema Dosman (Supabase). Las funciones tienen el mismo nombre y forma a propósito.
- Crear un pedido pasa por una función del servidor que **recalcula los precios** (nunca se confía en el navegador) + Cloudflare Turnstile contra spam.
- El menú se publica como archivo estático en Cloudflare: las visitas no consultan Supabase.
- Las fotos van a Cloudflare R2.
- El pago en línea usa la pasarela real (Wompi); el pedido se marca pagado solo cuando la pasarela lo confirma al servidor.
- Reemplazar los datos de ejemplo en `src/data/store.ts` (dirección, WhatsApp, horario, llave de transferencia) y el menú real.
- Cambiar `SITE_URL` (en `astro.config.mjs` o variable de entorno) por el dominio real.

## Datos de ejemplo

Precios, dirección, teléfono, llave de transferencia y fotos (Unsplash) son de ejemplo y están marcados en el pie de página.

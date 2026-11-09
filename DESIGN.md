# Diseño · Dosman web — dirección "Sorbete"

Claro, jugoso y con cara de app de domicilios. Fondo blanco, tinta morada muy oscura, rojo-fresa como color de acción y un tono pastel por categoría. Elegida por el cliente en el lienzo de diseño (opción A), con la barra flotante de vidrio de la opción B.

## Colores (`src/styles/global.css`, `@theme`)

| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | #FFFFFF | fondo |
| `fg` | #1E1225 | texto, botones oscuros, barra flotante |
| `muted` | #6B6070 | texto secundario |
| `surface` / `line` | #F6F3F7 / #ECE5EF | campos, chips, separadores |
| `accent` | #D61F5C | botón principal, selección |
| `mango` | #FFB03A | contador del carrito, "De la casa" |
| `ok` | #138A5B | abierto, pagado, confirmaciones |
| tints | fresa, mango, coral, lila, menta, hielo, latte | fondo de cada categoría (`categories[].tint`) |

## Tipografía

- **Bricolage Grotesque** (800): títulos y precios grandes.
- **Plus Jakarta Sans**: todo lo demás.

## Componentes clave

- Barra flotante del carrito (`FloatingActions`): vidrio oscuro con blur (`.glass-dark`), ícono con contador, total y "Ver pedido". Solo aparece cuando hay productos. El domicilio se calcula en el checkout.
- Botón de WhatsApp flotante en todas las páginas, encima de la barra.
- Íconos: un solo set de línea redondeada (`components/ui/Icon.tsx`).
- Radios grandes (16–30 px), sin bordes duros ni sombras negras.

## Siempre

Estados de carga en botones, skeletons, sin `<select>` nativo, respeta "reducir movimiento", foco visible, contraste AA.

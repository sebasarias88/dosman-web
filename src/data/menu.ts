/**
 * Demo menu for the main branch. Prices are realistic for Armenia (2026)
 * but are examples — the real menu will come from the Dosman system.
 */

export type Mode = 'cold' | 'hot'

export type Category = {
  id: string
  name: string
  mode: Mode
  blurb: string
  /** Soft background tint used for this category's cards */
  tint: string
  /** Product whose photo represents the category */
  cover: string
}

export type Option = { id: string; label: string; price: number }

export type OptionGroup = {
  id: string
  label: string
  /** single = choose exactly one; multi = choose any number up to `max` */
  type: 'single' | 'multi'
  required?: boolean
  max?: number
  options: Option[]
}

export type Product = {
  id: string
  name: string
  categoryId: string
  description: string
  /** Price of the default (first) size */
  price: number
  image: string
  tag?: 'crown' | 'new'
  groups: OptionGroup[]
}

export const categories: Category[] = [
  { id: 'cholaos', name: 'Cholaos', mode: 'cold', blurb: 'Hielo raspado, fruta picada y jarabe hecho en casa.', tint: 'bg-tint-fresa', cover: 'cholao-dosman' },
  { id: 'frutas', name: 'Frutas', mode: 'cold', blurb: 'Salpicón y fruta fresca del día, con todo o sin nada.', tint: 'bg-tint-mango', cover: 'salpicon' },
  { id: 'fresas', name: 'Fresas', mode: 'cold', blurb: 'Fresas con crema de la casa.', tint: 'bg-tint-coral', cover: 'fresas-crema' },
  { id: 'malteadas', name: 'Malteadas', mode: 'cold', blurb: 'Espesas, frías y para compartir (o no).', tint: 'bg-tint-lila', cover: 'malteada-oreo' },
  { id: 'limonadas', name: 'Limonadas', mode: 'cold', blurb: 'Limonadas y jugos naturales, en agua o en leche.', tint: 'bg-tint-menta', cover: 'limonada-hierbabuena' },
  { id: 'cafe-frio', name: 'Café frío', mode: 'cold', blurb: 'Café del Quindío, con hielo.', tint: 'bg-tint-hielo', cover: 'iced-latte' },
  { id: 'cafe', name: 'Café', mode: 'hot', blurb: 'Grano de origen Quindío, molido al momento.', tint: 'bg-tint-latte', cover: 'cappuccino' },
]

const cupSizes = (m: number, g: number): OptionGroup => ({
  id: 'size',
  label: 'Tamaño',
  type: 'single',
  required: true,
  options: [
    { id: 'm', label: 'Mediano · 16 oz', price: m },
    { id: 'g', label: 'Grande · 24 oz', price: g },
  ],
})

const coffeeSizes = (s: number, l: number): OptionGroup => ({
  id: 'size',
  label: 'Tamaño',
  type: 'single',
  required: true,
  options: [
    { id: 's', label: 'Pocillo · 8 oz', price: s },
    { id: 'l', label: 'Vaso · 12 oz', price: l },
  ],
})

const coldExtras: OptionGroup = {
  id: 'extras',
  label: 'Adiciones',
  type: 'multi',
  max: 4,
  options: [
    { id: 'helado', label: 'Bola de helado', price: 3000 },
    { id: 'queso', label: 'Queso rallado', price: 2000 },
    { id: 'lechera', label: 'Leche condensada extra', price: 1500 },
    { id: 'arequipe', label: 'Arequipe', price: 2000 },
    { id: 'barquillo', label: 'Barquillo', price: 1000 },
    { id: 'chantilly', label: 'Crema chantilly', price: 2000 },
  ],
}

const iceCream: OptionGroup = {
  id: 'helado',
  label: 'Sabor del helado',
  type: 'single',
  required: true,
  options: [
    { id: 'vainilla', label: 'Vainilla', price: 0 },
    { id: 'fresa', label: 'Fresa', price: 0 },
    { id: 'chocolate', label: 'Chocolate', price: 0 },
    { id: 'ron-pasas', label: 'Ron con pasas', price: 0 },
  ],
}

const milk: OptionGroup = {
  id: 'leche',
  label: 'Leche',
  type: 'single',
  required: true,
  options: [
    { id: 'entera', label: 'Entera', price: 0 },
    { id: 'deslactosada', label: 'Deslactosada', price: 0 },
    { id: 'almendras', label: 'De almendras', price: 2500 },
  ],
}

const sweetener: OptionGroup = {
  id: 'dulce',
  label: 'Endulzar con',
  type: 'single',
  required: true,
  options: [
    { id: 'azucar', label: 'Azúcar', price: 0 },
    { id: 'panela', label: 'Panela', price: 0 },
    { id: 'sin', label: 'Sin endulzar', price: 0 },
  ],
}

const juiceBase: OptionGroup = {
  id: 'base',
  label: 'Preparado en',
  type: 'single',
  required: true,
  options: [
    { id: 'agua', label: 'Agua', price: 0 },
    { id: 'leche', label: 'Leche', price: 2000 },
  ],
}

export const products: Product[] = [
  // Cholaos
  {
    id: 'cholao-clasico',
    name: 'Cholao clásico',
    categoryId: 'cholaos',
    description: 'Hielo raspado, mango, piña, banano, fresa y papaya, con jarabe de la casa y leche condensada.',
    price: 12000,
    image: 'cholao-clasico',
    groups: [cupSizes(12000, 15000), coldExtras],
  },
  {
    id: 'cholao-dosman',
    name: 'Cholao Dosman',
    categoryId: 'cholaos',
    description: 'El de la corona: doble fruta, helado, queso rallado, arequipe y barquillo. Para dos, siendo honestos.',
    price: 17000,
    image: 'cholao-dosman',
    tag: 'crown',
    groups: [cupSizes(17000, 21000), iceCream, coldExtras],
  },
  {
    id: 'cholao-verde',
    name: 'Cholao verde',
    categoryId: 'cholaos',
    description: 'Kiwi, uva verde, mango biche y helado de pistacho sobre hielo con jarabe de limón.',
    price: 16000,
    image: 'cholao-verde',
    tag: 'new',
    groups: [cupSizes(16000, 20000), coldExtras],
  },
  // Frutas
  {
    id: 'salpicon',
    name: 'Salpicón',
    categoryId: 'frutas',
    description: 'Fruta picada finita en jugo de sandía con soda, bien frío.',
    price: 9000,
    image: 'salpicon',
    groups: [cupSizes(9000, 12000), coldExtras],
  },
  {
    id: 'ensalada-frutas',
    name: 'Ensalada de frutas',
    categoryId: 'frutas',
    description: 'Fruta fresca del día, crema de leche, helado y queso rallado por encima.',
    price: 15000,
    image: 'ensalada-frutas',
    tag: 'crown',
    groups: [cupSizes(15000, 19000), iceCream, coldExtras],
  },
  {
    id: 'mango-crema',
    name: 'Mango con crema',
    categoryId: 'frutas',
    description: 'Mango de azúcar en cubos con crema de la casa y un toque de canela.',
    price: 11000,
    image: 'mango-crema',
    groups: [coldExtras],
  },
  {
    id: 'copa-frutas',
    name: 'Copa de frutas',
    categoryId: 'frutas',
    description: 'Solo fruta, sin nada encima. Para los que se cuidan entre semana.',
    price: 10000,
    image: 'copa-frutas',
    groups: [coldExtras],
  },
  // Fresas
  {
    id: 'fresas-crema',
    name: 'Fresas con crema',
    categoryId: 'fresas',
    description: 'Fresas frescas con la crema de la casa, suave y no muy dulce.',
    price: 12000,
    image: 'fresas-crema',
    tag: 'crown',
    groups: [cupSizes(12000, 15000), coldExtras],
  },
  {
    id: 'fresas-oreo',
    name: 'Fresas Oreo',
    categoryId: 'fresas',
    description: 'Fresas, crema, galleta Oreo triturada y salsa de chocolate.',
    price: 15000,
    image: 'fresas-oreo',
    groups: [cupSizes(15000, 18000), coldExtras],
  },
  {
    id: 'fresas-helado',
    name: 'Fresas con helado',
    categoryId: 'fresas',
    description: 'Fresas con crema y dos bolas de helado del sabor que quieras.',
    price: 16000,
    image: 'fresas-helado',
    groups: [cupSizes(16000, 19000), iceCream, coldExtras],
  },
  // Malteadas
  {
    id: 'malteada-fresa',
    name: 'Malteada de fresa',
    categoryId: 'malteadas',
    description: 'Helado de fresa, leche y fresas naturales, con chantilly.',
    price: 14000,
    image: 'malteada-fresa',
    groups: [cupSizes(14000, 17000), milk],
  },
  {
    id: 'malteada-oreo',
    name: 'Malteada Oreo',
    categoryId: 'malteadas',
    description: 'Helado de vainilla, galleta Oreo y chantilly. La que más piden.',
    price: 15000,
    image: 'malteada-oreo',
    tag: 'crown',
    groups: [cupSizes(15000, 18000), milk],
  },
  {
    id: 'malteada-chocolate',
    name: 'Malteada de chocolate',
    categoryId: 'malteadas',
    description: 'Helado de chocolate, cacao del Huila y leche.',
    price: 14000,
    image: 'malteada-chocolate',
    groups: [cupSizes(14000, 17000), milk],
  },
  {
    id: 'batido-fresa',
    name: 'Batido de fresa natural',
    categoryId: 'malteadas',
    description: 'Fresa y leche, sin helado. Ligero y bien frío.',
    price: 9000,
    image: 'batido-fresa',
    groups: [cupSizes(9000, 11000), milk, sweetener],
  },
  // Limonadas y jugos
  {
    id: 'limonada-natural',
    name: 'Limonada natural',
    categoryId: 'limonadas',
    description: 'Limón recién exprimido, hielo y azúcar o panela.',
    price: 6000,
    image: 'limonada-natural',
    groups: [cupSizes(6000, 8000), sweetener],
  },
  {
    id: 'limonada-hierbabuena',
    name: 'Limonada de hierbabuena',
    categoryId: 'limonadas',
    description: 'Limón, hierbabuena fresca y un toque de jengibre.',
    price: 7000,
    image: 'limonada-hierbabuena',
    groups: [cupSizes(7000, 9000), sweetener],
  },
  {
    id: 'soda-limon',
    name: 'Soda de limón',
    categoryId: 'limonadas',
    description: 'Soda, limón y hielo. Para bajar el calor de una.',
    price: 7500,
    image: 'soda-limon',
    groups: [cupSizes(7500, 9500)],
  },
  {
    id: 'jugo-mango',
    name: 'Jugo de mango',
    categoryId: 'limonadas',
    description: 'Mango maduro, en agua o en leche.',
    price: 7000,
    image: 'jugo-mango',
    groups: [cupSizes(7000, 9000), juiceBase, sweetener],
  },
  // Café frío
  {
    id: 'iced-latte',
    name: 'Latte frío',
    categoryId: 'cafe-frio',
    description: 'Doble espresso, leche fría y hielo.',
    price: 9500,
    image: 'iced-latte',
    groups: [cupSizes(9500, 12000), milk, sweetener],
  },
  {
    id: 'cafe-frio-leche',
    name: 'Café frío con arequipe',
    categoryId: 'cafe-frio',
    description: 'Café filtrado en frío por 12 horas, leche y arequipe.',
    price: 10000,
    image: 'cafe-frio-leche',
    tag: 'new',
    groups: [cupSizes(10000, 12500), milk],
  },
  // Café caliente
  {
    id: 'cafe-origen',
    name: 'Café de origen',
    categoryId: 'cafe',
    description: 'Tinto de grano del Quindío, filtrado al momento.',
    price: 4000,
    image: 'cafe-origen',
    groups: [coffeeSizes(4000, 5500), sweetener],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    categoryId: 'cafe',
    description: 'Espresso con leche texturizada y espuma espesa.',
    price: 7000,
    image: 'cappuccino',
    tag: 'crown',
    groups: [coffeeSizes(7000, 8500), milk, sweetener],
  },
  {
    id: 'latte',
    name: 'Latte',
    categoryId: 'cafe',
    description: 'Espresso suave con más leche y poca espuma.',
    price: 7500,
    image: 'latte',
    groups: [coffeeSizes(7500, 9000), milk, sweetener],
  },
  {
    id: 'mocaccino',
    name: 'Mocaccino',
    categoryId: 'cafe',
    description: 'Espresso, chocolate de mesa y leche, con cacao por encima.',
    price: 8500,
    image: 'mocaccino',
    groups: [coffeeSizes(8500, 10000), milk],
  },
]

export const productById = new Map(products.map((p) => [p.id, p]))
export const categoryById = new Map(categories.map((c) => [c.id, c]))

export const modeOfProduct = (p: Product): Mode => categoryById.get(p.categoryId)?.mode ?? 'cold'

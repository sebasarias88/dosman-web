const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** 12000 → "$ 12.000" */
export const formatCOP = (value: number) => cop.format(value).replace(/ /g, ' ')

/** Removes accents and lowercases, so "cafe" finds "Café". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

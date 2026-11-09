import { useEffect, useRef, useState } from 'react'
import { formatCOP, sleep } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Combobox } from '@/components/ui/Combobox'
import { Spinner } from '@/components/ui/Spinner'

type Props = { open: boolean; amount: number; onCancel: () => void; onApproved: () => void }
type Method = 'card' | 'pse' | 'nequi'

const banks = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'Banco Caja Social', 'Scotiabank Colpatria', 'Banco AV Villas', 'Banco Falabella', 'Nu']

/**
 * SIMULATED payment step. In production this screen is replaced by the real
 * gateway's checkout (Wompi), and the order is only marked as paid when the
 * gateway confirms it to our server — never because the browser says so.
 */
export default function PaymentGateway({ open, amount, onCancel, onApproved }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [method, setMethod] = useState<Method>('card')
  const [stage, setStage] = useState<'form' | 'processing' | 'approved'>('form')
  const [bank, setBank] = useState<string | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) {
      setStage('form')
      if (!d.open) d.showModal()
    } else if (d.open) d.close()
  }, [open])

  const pay = async () => {
    setStage('processing')
    await sleep(2200)
    setStage('approved')
    await sleep(1300)
    onApproved()
  }

  const tab = (m: Method, label: string) => (
    <button type="button" role="tab" aria-selected={method === m} onClick={() => setMethod(m)} className="chip flex-1 justify-center">
      {label}
    </button>
  )

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        if (stage !== 'form') e.preventDefault()
        else onCancel()
      }}
      aria-labelledby="pay-title"
      className="m-auto w-[min(460px,94vw)] rounded-[28px] bg-white p-0 text-fg shadow-[var(--shadow-float)]"
    >
      <div className="flex items-center justify-between border-b-2 border-line px-6 py-4">
        <div>
          <p id="pay-title" className="font-semibold">
            Pago seguro
          </p>
          <p className="text-sm text-muted">Simulación para el demo, no se cobra nada</p>
        </div>
        <p className="price font-display font-extrabold text-2xl">{formatCOP(amount)}</p>
      </div>

      {stage === 'form' && (
        <div className="px-6 py-5">
          <div role="tablist" aria-label="Medio de pago" className="flex gap-2">
            {tab('card', 'Tarjeta')}
            {tab('pse', 'PSE')}
            {tab('nequi', 'Nequi')}
          </div>

          <div className="mt-5 space-y-4" role="tabpanel">
            {method === 'card' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block font-medium">Número de la tarjeta</span>
                  <input className="field price" defaultValue="4242 4242 4242 4242" inputMode="numeric" autoComplete="off" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block font-medium">Vence</span>
                    <input className="field price" defaultValue="12/29" autoComplete="off" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block font-medium">CVC</span>
                    <input className="field price" defaultValue="123" autoComplete="off" />
                  </label>
                </div>
              </>
            )}
            {method === 'pse' && (
              <div>
                <span className="mb-1.5 block font-medium" id="bank-label">
                  Tu banco
                </span>
                <Combobox label="Tu banco" options={banks.map((b) => ({ value: b, label: b }))} value={bank} onChange={setBank} placeholder="Elige tu banco" />
                <p className="mt-2 text-sm text-muted">Te llevaremos a la página de tu banco para aprobar el pago.</p>
              </div>
            )}
            {method === 'nequi' && (
              <label className="block">
                <span className="mb-1.5 block font-medium">Celular registrado en Nequi</span>
                <input className="field price" defaultValue="300 123 4567" inputMode="tel" autoComplete="off" />
                <span className="mt-2 block text-sm text-muted">Te llega una notificación a la app para aceptar el pago.</span>
              </label>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Volver
            </button>
            <Button type="button" className="flex-1" onClick={pay} disabled={method === 'pse' && !bank}>
              Pagar <span className="price">{formatCOP(amount)}</span>
            </Button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="grid place-items-center gap-4 px-6 py-16 text-center" role="status">
          <Spinner className="size-10" />
          <p className="text-lg font-semibold">Confirmando tu pago…</p>
          <p className="text-muted">No cierres esta ventana.</p>
        </div>
      )}

      {stage === 'approved' && (
        <div className="grid place-items-center gap-4 px-6 py-16 text-center" role="status">
          <span className="grid size-16 place-items-center rounded-full bg-ok text-white">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M5 12.5 10 17l9-10" />
            </svg>
          </span>
          <p className="font-display font-extrabold text-3xl">Pago aprobado</p>
          <p className="text-muted">Enviando tu pedido a la cocina…</p>
        </div>
      )}
    </dialog>
  )
}

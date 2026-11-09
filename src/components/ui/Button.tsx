import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  variant?: 'primary' | 'dark' | 'soft' | 'ghost'
  children: ReactNode
}

/**
 * While `loading`, the spinner sits on top of the (invisible) label so the
 * button keeps its size, and the button is blocked to avoid double sends.
 */
export function Button({ loading = false, variant = 'primary', className = '', disabled, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn btn-${variant} ${className}`}
    >
      <span className={`flex w-full items-center gap-2 ${loading ? 'invisible' : ''}`} style={{ justifyContent: 'inherit' }}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
          <span className="sr-only" role="status">
            Cargando…
          </span>
        </span>
      )}
    </button>
  )
}

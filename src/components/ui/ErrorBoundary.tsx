'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// React Error Boundary — class component (única forma de capturar errores de
// render en React; los hooks no pueden hacerlo).
//
// Uso:
//   <ErrorBoundary>
//     <ComponenteQuePuedeFallar />
//   </ErrorBoundary>
//
//   <ErrorBoundary fallback={<MiFallbackCustom />}>
//     <ComponenteQuePuedeFallar />
//   </ErrorBoundary>
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode
  /** UI alternativa a mostrar en caso de error. Si no se provee, usa el fallback por defecto. */
  fallback?: ReactNode
  /** Texto descriptivo para el fallback por defecto */
  label?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción, enviar a un servicio de logging (Sentry, Axiom, etc.)
    console.error('[ErrorBoundary] Render error:', error.message, info.componentStack)
  }

  private reset = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10">
        <AlertTriangle className="h-8 w-8 text-red-400 dark:text-red-500" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {this.props.label ?? 'Error al cargar el componente'}
          </p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-600">
            El resto del panel sigue funcionando normalmente.
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    )
  }
}

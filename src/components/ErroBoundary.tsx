import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erro: boolean
}

export default class ErroBoundary extends Component<Props, State> {
  state: State = { erro: false }

  static getDerivedStateFromError(): State {
    return { erro: true }
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-1 text-xl font-semibold">Algo deu errado</h1>
          <p className="mb-6 text-sm text-ink2">
            O app encontrou um erro inesperado. Seus dados salvos estão seguros.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}

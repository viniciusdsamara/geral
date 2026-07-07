import type { ReactNode } from 'react'

// Renderizador mínimo para o markdown das retrospectivas
// (subconjunto: ## ###, listas com "-", **negrito**, *itálico*)
function inline(texto: string): ReactNode[] {
  const partes: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let ultimo = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index))
    if (m[1] !== undefined) partes.push(<strong key={k++} className="font-semibold text-ink">{m[1]}</strong>)
    else partes.push(<em key={k++}>{m[2]}</em>)
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}

export default function Markdown({ md }: { md: string }) {
  const blocos: ReactNode[] = []
  let lista: string[] = []
  let k = 0

  const despejarLista = () => {
    if (lista.length === 0) return
    blocos.push(
      <ul key={k++} className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-ink2">
        {lista.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    )
    lista = []
  }

  for (const linha of md.split('\n')) {
    if (linha.startsWith('- ')) {
      lista.push(linha.slice(2))
      continue
    }
    despejarLista()
    if (linha.startsWith('### ')) {
      blocos.push(<h4 key={k++} className="mt-3 text-sm font-semibold text-ink">{inline(linha.slice(4))}</h4>)
    } else if (linha.startsWith('## ')) {
      blocos.push(<h3 key={k++} className="mt-3 text-base font-semibold text-ink">{inline(linha.slice(3))}</h3>)
    } else if (linha.startsWith('# ')) {
      blocos.push(<h3 key={k++} className="mt-3 text-base font-semibold text-ink">{inline(linha.slice(2))}</h3>)
    } else if (linha.trim()) {
      blocos.push(<p key={k++} className="text-sm leading-relaxed text-ink2">{inline(linha)}</p>)
    }
  }
  despejarLista()

  return <div className="space-y-2">{blocos}</div>
}

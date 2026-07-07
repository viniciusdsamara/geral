// Comprime fotos no aparelho antes do upload: canteiro tem 3G/sinal fraco,
// e a foto original do celular (3–8 MB) trava ou estoura o envio.
export async function comprimirImagem(
  arquivo: File,
  maxLado = 1600,
  qualidade = 0.75,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * escala))
    const h = Math.max(1, Math.round(bitmap.height * escala))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return arquivo
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', qualidade),
    )
    if (!blob || blob.size >= arquivo.size) return arquivo
    return blob
  } catch {
    // Formato não suportado ou falha na decodificação: envia o original
    return arquivo
  }
}

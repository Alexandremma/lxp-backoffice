import { useEffect, useMemo, useRef, useState } from "react"
import { embedCertificatePrintImages } from "@/lib/certificateImageEmbed"
import {
  buildCertificatePrintHtml,
  type CertificatePrintPayload,
} from "@/lib/certificatePrint"

type CertificatePreviewFrameProps = {
  payload: CertificatePrintPayload
  className?: string
}

/** Renderiza o certificado em iframe — mesmo HTML do PDF, com QR embutido. */
export function CertificatePreviewFrame({ payload, className }: CertificatePreviewFrameProps) {
  const [debounced, setDebounced] = useState(payload)
  const [embedded, setEmbedded] = useState<CertificatePrintPayload | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDebounced(payload), 150)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [payload])

  useEffect(() => {
    let cancelled = false
    void embedCertificatePrintImages(debounced).then((result) => {
      if (!cancelled) setEmbedded(result)
    })
    return () => {
      cancelled = true
    }
  }, [debounced])

  const html = useMemo(
    () =>
      embedded ? buildCertificatePrintHtml({ ...embedded, autoPrint: false }) : "",
    [embedded],
  )

  return (
    <iframe
      title="preview-certificado"
      srcDoc={html}
      className={className ?? "w-full h-full min-h-[240px] border-0 bg-white rounded-lg shadow-sm"}
      sandbox="allow-same-origin"
    />
  )
}

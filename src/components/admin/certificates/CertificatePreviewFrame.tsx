import { useEffect, useMemo, useRef, useState } from "react"
import {
  buildCertificatePrintHtml,
  type CertificatePrintPayload,
} from "@/lib/certificatePrint"

type CertificatePreviewFrameProps = {
  payload: CertificatePrintPayload
  className?: string
}

/** Renderiza o certificado em iframe (srcDoc) — mesmo HTML usado no PDF. */
export function CertificatePreviewFrame({ payload, className }: CertificatePreviewFrameProps) {
  const [debounced, setDebounced] = useState(payload)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDebounced(payload), 150)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [payload])

  const html = useMemo(
    () => buildCertificatePrintHtml({ ...debounced, autoPrint: false }),
    [debounced],
  )

  return (
    <iframe
      title="preview-certificado"
      srcDoc={html}
      className={className ?? "w-full h-[520px] border rounded-lg bg-white"}
      sandbox="allow-same-origin"
    />
  )
}

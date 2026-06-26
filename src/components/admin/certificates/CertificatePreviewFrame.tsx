import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  A4_LANDSCAPE_HEIGHT_PX,
  A4_LANDSCAPE_WIDTH_PX,
} from "@/lib/certificateDimensions"
import { embedCertificatePrintImages } from "@/lib/certificateImageEmbed"
import {
  buildCertificatePrintHtml,
  type CertificatePrintPayload,
} from "@/lib/certificatePrint"

type CertificatePreviewFrameProps = {
  payload: CertificatePrintPayload
  className?: string
  /** Limite opcional de altura (ex.: modais menores). Sem valor, preenche o container pai. */
  maxHeight?: string
}

/** Placeholder A4 paisagem enquanto imagens/HTML do certificado são montados. */
function CertificatePreviewSkeleton() {
  return (
    <div
      className="absolute inset-0 flex flex-col bg-white p-[7%]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando preview do certificado"
    >
      <div className="flex justify-center pt-[4%]">
        <Skeleton className="h-5 w-[42%] max-w-xs" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[8%]">
        <Skeleton className="h-3 w-[70%]" />
        <Skeleton className="h-7 w-[52%]" />
        <Skeleton className="h-3 w-[60%]" />
        <Skeleton className="h-3 w-[48%]" />
      </div>
      <div className="flex justify-around px-[10%] pb-[6%]">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="absolute bottom-[6%] left-[6%] h-14 w-14 rounded-sm" />
    </div>
  )
}

/** Renderiza o certificado em iframe A4 paisagem, escalado para caber no container. */
export function CertificatePreviewFrame({
  payload,
  className,
  maxHeight,
}: CertificatePreviewFrameProps) {
  const [debounced, setDebounced] = useState(payload)
  const [embedded, setEmbedded] = useState<CertificatePrintPayload | null>(null)
  const [scale, setScale] = useState(0.5)
  const outerRef = useRef<HTMLDivElement>(null)
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
      embedded
        ? buildCertificatePrintHtml({
          ...embedded,
          autoPrint: false,
        })
        : "",
    [embedded],
  )

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const updateScale = () => {
      const w = el.clientWidth
      if (w <= 0) return

      let h = el.clientHeight
      if (maxHeight) {
        const parsedMaxH = parseFloat(getComputedStyle(el).maxHeight)
        if (Number.isFinite(parsedMaxH) && parsedMaxH > 0) {
          h = h > 0 ? Math.min(h, parsedMaxH) : parsedMaxH
        }
      }

      const scaleByWidth = w / A4_LANDSCAPE_WIDTH_PX
      const scaleByHeight = h > 0 ? h / A4_LANDSCAPE_HEIGHT_PX : scaleByWidth

      setScale(Math.min(scaleByWidth, scaleByHeight))
    }

    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxHeight, html])

  const scaledW = A4_LANDSCAPE_WIDTH_PX * scale
  const scaledH = A4_LANDSCAPE_HEIGHT_PX * scale
  const fillsParent = !maxHeight

  return (
    <div
      ref={outerRef}
      className={cn(
        "flex w-full justify-center overflow-hidden",
        fillsParent ? "h-full max-h-full min-h-0 items-center" : "h-auto items-center",
        className,
      )}
      style={
        maxHeight
          ? { maxHeight, height: scaledH }
          : undefined
      }
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-sm bg-white shadow-sm"
        style={{ width: scaledW, height: scaledH }}
      >
        {html ? (
          <iframe
            key={html.slice(0, 80)}
            title="preview-certificado"
            srcDoc={html}
            sandbox="allow-same-origin"
            className="absolute left-0 top-0 border-0 bg-white"
            style={{
              width: A4_LANDSCAPE_WIDTH_PX,
              height: A4_LANDSCAPE_HEIGHT_PX,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <CertificatePreviewSkeleton />
        )}
      </div>
    </div>
  )
}

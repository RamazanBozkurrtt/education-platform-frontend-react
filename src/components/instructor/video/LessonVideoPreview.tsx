import { useId } from 'react'
import Button from '../../ui/Button'

interface LessonVideoPreviewProps {
  hasVideo: boolean
  isOpen: boolean
  videoSrc?: string
  isLoading: boolean
  errorMessage?: string | null
  onToggle: () => void
}

const LessonVideoPreview = ({
  hasVideo,
  isOpen,
  videoSrc,
  isLoading,
  errorMessage,
  onToggle,
}: LessonVideoPreviewProps) => {
  const previewPanelId = useId()

  if (!hasVideo) {
    return <p className="theme-muted text-sm">Bu ders icin henuz video yuklenmedi.</p>
  }

  return (
    <div className="space-y-3">
      <Button aria-controls={previewPanelId} aria-expanded={isOpen} onClick={onToggle} size="sm" variant="ghost">
        {isOpen ? 'Onizlemeyi gizle' : 'Onizlemeyi ac'}
      </Button>

      {isOpen ? (
        <div className="overflow-hidden rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--color-forest-canopy)] p-3" id={previewPanelId}>
          {isLoading ? (
            <p className="text-sm text-white">Onizleme yukleniyor...</p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-[color:var(--surface-muted-mandarin)]">{errorMessage}</p>
          ) : null}
          {videoSrc && !isLoading ? (
            <video aria-label="Ders video onizlemesi" className="aspect-video w-full rounded-md bg-black" controls preload="metadata" src={videoSrc} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default LessonVideoPreview

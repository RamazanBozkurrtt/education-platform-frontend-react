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
  if (!hasVideo) {
    return <p className="theme-muted text-sm">Bu ders icin henuz video yuklenmemis.</p>
  }

  return (
    <div className="space-y-3">
      <Button onClick={onToggle} size="sm" variant="ghost">
        {isOpen ? 'Onizlemeyi gizle' : 'Onizle'}
      </Button>

      {isOpen ? (
        <div className="overflow-hidden rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--color-forest-canopy)] p-3">
          {isLoading ? (
            <p className="text-sm text-white">Onizleme yukleniyor...</p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-[color:var(--surface-muted-mandarin)]">{errorMessage}</p>
          ) : null}
          {videoSrc && !isLoading ? (
            <video className="aspect-video w-full rounded-md bg-black" controls preload="metadata" src={videoSrc} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default LessonVideoPreview

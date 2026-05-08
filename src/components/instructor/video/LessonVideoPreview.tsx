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
    return <p className="text-sm text-slate-400">Bu ders icin henuz video yuklenmemis.</p>
  }

  return (
    <div className="space-y-3">
      <Button onClick={onToggle} size="sm" variant="ghost">
        {isOpen ? 'Onizlemeyi gizle' : 'Onizle'}
      </Button>

      {isOpen ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-3">
          {isLoading ? (
            <p className="text-sm text-cyan-200">Onizleme yukleniyor...</p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-rose-300">{errorMessage}</p>
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

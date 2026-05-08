import Button from '../../ui/Button'

interface LessonVideoUploaderProps {
  lessonId: string
  hasVideo: boolean
  selectedFile: File | null
  isUploading: boolean
  onFileSelect: (file: File | null) => void
  onUpload: () => void
}

const LessonVideoUploader = ({
  lessonId,
  hasVideo,
  selectedFile,
  isUploading,
  onFileSelect,
  onUpload,
}: LessonVideoUploaderProps) => {
  const inputId = `lesson-video-file-${lessonId}`

  return (
    <div className="space-y-3">
      <label className="flex w-full flex-col gap-2" htmlFor={inputId}>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Video dosyasi</span>
        <input
          accept="video/mp4,.mp4"
          className="h-11 rounded-lg border border-white/10 bg-[color:var(--surface-muted)] px-3 text-sm text-slate-200"
          disabled={isUploading}
          id={inputId}
          onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>

      {selectedFile ? (
        <p className="text-xs text-slate-300">
          Secilen dosya: <span className="font-medium text-slate-100">{selectedFile.name}</span>
        </p>
      ) : null}

      <Button
        disabled={isUploading || !selectedFile}
        onClick={onUpload}
        size="sm"
        variant="secondary"
      >
        {hasVideo ? 'Videoyu degistir' : 'Video yukle'}
      </Button>
    </div>
  )
}

export default LessonVideoUploader

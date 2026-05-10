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
        <span className="theme-heading text-xs font-semibold uppercase tracking-[0.14em]">Video dosyasi (MP4)</span>
        <input
          accept="video/mp4,.mp4"
          className="theme-text h-11 rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
          disabled={isUploading}
          id={inputId}
          onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>

      <p className="theme-subtle text-xs">Yalnizca MP4 dosyalari yuklenebilir.</p>

      {selectedFile ? (
        <p className="theme-muted text-xs">
          Secilen dosya: <span className="theme-heading break-all font-medium">{selectedFile.name}</span>
        </p>
      ) : null}

      <Button
        className="w-full sm:w-auto"
        disabled={isUploading || !selectedFile}
        onClick={onUpload}
        size="sm"
        variant="secondary"
      >
        {hasVideo ? 'Videoyu guncelle' : 'Video yukle'}
      </Button>
    </div>
  )
}

export default LessonVideoUploader

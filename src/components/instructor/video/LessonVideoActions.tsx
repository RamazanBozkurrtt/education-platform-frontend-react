import Button from '../../ui/Button'
import LessonVideoPreview from './LessonVideoPreview'
import LessonVideoUploader from './LessonVideoUploader'
import UploadProgressBar from './UploadProgressBar'

interface LessonVideoActionsProps {
  lessonId: string
  hasVideo: boolean
  selectedFile: File | null
  isUploading: boolean
  uploadProgress: number
  previewOpen: boolean
  previewSrc?: string
  previewLoading: boolean
  previewError?: string | null
  onSelectFile: (file: File | null) => void
  onUpload: () => void
  onDelete: () => void
  onTogglePreview: () => void
}

const LessonVideoActions = ({
  lessonId,
  hasVideo,
  selectedFile,
  isUploading,
  uploadProgress,
  previewOpen,
  previewSrc,
  previewLoading,
  previewError,
  onSelectFile,
  onUpload,
  onDelete,
  onTogglePreview,
}: LessonVideoActionsProps) => {
  return (
    <div className="space-y-4">
      <LessonVideoUploader
        hasVideo={hasVideo}
        isUploading={isUploading}
        lessonId={lessonId}
        onFileSelect={onSelectFile}
        onUpload={onUpload}
        selectedFile={selectedFile}
      />

      {isUploading ? <UploadProgressBar progress={uploadProgress} /> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          className="w-full sm:w-auto"
          disabled={isUploading || !hasVideo}
          onClick={onDelete}
          size="sm"
          variant="ghost"
        >
          Videoyu sil
        </Button>
      </div>

      <LessonVideoPreview
        errorMessage={previewError}
        hasVideo={hasVideo}
        isLoading={previewLoading}
        isOpen={previewOpen}
        onToggle={onTogglePreview}
        videoSrc={previewSrc}
      />
    </div>
  )
}

export default LessonVideoActions

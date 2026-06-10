import { useId, useMemo, useRef, useState } from 'react'
import Button from '../../ui/Button'
import CourseVideoPlayer from '../../player/CourseVideoPlayer'
import { useLanguage } from '../../../hooks/useLanguage'

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
  const { language } = useLanguage()
  const previewPanelId = useId()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playbackErrorMessage, setPlaybackErrorMessage] = useState<string | null>(null)
  const videoKey = useMemo(() => (videoSrc ? `lesson-preview-${videoSrc}` : 'lesson-preview-empty'), [videoSrc])
  const sourceErrorMessage = errorMessage || playbackErrorMessage

  if (!hasVideo) {
    return <p className="theme-muted text-sm">{language === 'tr' ? 'Bu ders icin henuz video yuklenmedi.' : 'No video has been uploaded for this lesson yet.'}</p>
  }

  return (
    <div className="space-y-3">
      <Button aria-controls={previewPanelId} aria-expanded={isOpen} onClick={onToggle} size="sm" variant="ghost">
        {isOpen
          ? (language === 'tr' ? 'Onizlemeyi gizle' : 'Hide preview')
          : (language === 'tr' ? 'Onizlemeyi ac' : 'Open preview')}
      </Button>

      {isOpen ? (
        <div className="space-y-3" id={previewPanelId}>
          <CourseVideoPlayer
            emptyMessage={language === 'tr' ? 'Onizleme videosu henuz hazir degil.' : 'Preview video is not ready yet.'}
            isSourceLoading={isLoading}
            onVideoError={() => {
              setPlaybackErrorMessage(language === 'tr' ? 'Video onizlemesi oynatilamadi.' : 'Video preview could not be played.')
            }}
            onVideoLoadedMetadata={() => {
              setPlaybackErrorMessage(null)
            }}
            onVideoPlay={() => {
              setPlaybackErrorMessage(null)
            }}
            sourceErrorMessage={sourceErrorMessage}
            src={videoSrc}
            title={language === 'tr' ? 'Ders video onizlemesi' : 'Lesson video preview'}
            videoKey={videoKey}
            videoRef={videoRef}
          />
        </div>
      ) : null}
    </div>
  )
}

export default LessonVideoPreview

import { AlertCircle, LoaderCircle, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { type ChangeEvent, type CSSProperties, type KeyboardEvent, type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../utils/helpers'
import './courseVideoPlayer.css'

interface CourseVideoPlayerProps {
  videoRef: MutableRefObject<HTMLVideoElement | null>
  src?: string
  videoKey: string
  title: string
  subtitle?: string
  emptyMessage: string
  isSourceLoading: boolean
  sourceErrorMessage?: string | null
  onVideoPlay: () => void
  onVideoLoadedMetadata: () => void
  onVideoError: () => void
}

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '00:00'
  }

  const roundedSeconds = Math.floor(value)
  const hours = Math.floor(roundedSeconds / 3_600)
  const minutes = Math.floor((roundedSeconds % 3_600) / 60)
  const seconds = roundedSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getBufferedEnd = (video: HTMLVideoElement) => {
  const ranges = video.buffered

  if (!ranges.length) {
    return 0
  }

  for (let index = ranges.length - 1; index >= 0; index -= 1) {
    if (ranges.start(index) <= video.currentTime) {
      return ranges.end(index)
    }
  }

  return ranges.end(ranges.length - 1)
}

const CourseVideoPlayer = ({
  videoRef,
  src,
  videoKey,
  title,
  subtitle,
  emptyMessage,
  isSourceLoading,
  sourceErrorMessage,
  onVideoError,
  onVideoLoadedMetadata,
  onVideoPlay,
}: CourseVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hideControlsTimeoutRef = useRef<number | null>(null)
  const lastNonZeroVolumeRef = useRef(1)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)

  const hasSource = Boolean(src)
  const hasError = Boolean(sourceErrorMessage)
  const showCenterPlay = hasSource && !hasStarted && !isSourceLoading && !hasError
  const shouldShowLoader = isSourceLoading || (isBuffering && hasSource)

  const playedPercent = useMemo(() => {
    if (!duration) {
      return 0
    }

    return clamp((currentTime / duration) * 100, 0, 100)
  }, [currentTime, duration])

  const bufferedPercent = useMemo(() => {
    if (!duration) {
      return 0
    }

    return clamp((bufferedEnd / duration) * 100, 0, 100)
  }, [bufferedEnd, duration])

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current)
      hideControlsTimeoutRef.current = null
    }
  }, [])

  const queueAutoHideControls = useCallback(() => {
    clearHideControlsTimer()

    if (!isPlaying || isSeeking) {
      return
    }

    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false)
    }, 2_800)
  }, [clearHideControlsTimer, isPlaying, isSeeking])

  const refreshPlaybackStateFromElement = useCallback(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    setCurrentTime(video.currentTime)
    setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    setBufferedEnd(getBufferedEnd(video))
    setVolume(video.volume)
    setPlaybackRate(video.playbackRate)
    setIsMuted(video.muted || video.volume === 0)
    setIsPlaying(!video.paused && !video.ended)
  }, [videoRef])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    refreshPlaybackStateFromElement()
  }, [refreshPlaybackStateFromElement, videoKey, videoRef])

  useEffect(() => {
    setIsPlaying(false)
    setIsBuffering(false)
    setShowControls(true)
    setCurrentTime(0)
    setDuration(0)
    setBufferedEnd(0)
    setHasStarted(false)
    setIsSeeking(false)
  }, [videoKey])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const container = containerRef.current
      const fullscreenElement = document.fullscreenElement
      setIsFullscreen(Boolean(container && fullscreenElement && container.contains(fullscreenElement)))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    queueAutoHideControls()

    return clearHideControlsTimer
  }, [clearHideControlsTimer, queueAutoHideControls])

  useEffect(() => {
    return () => {
      clearHideControlsTimer()
    }
  }, [clearHideControlsTimer])

  const seekTo = useCallback((nextTime: number) => {
    const video = videoRef.current

    if (!video || !duration) {
      return
    }

    const clampedTime = clamp(nextTime, 0, duration)
    video.currentTime = clampedTime
    setCurrentTime(clampedTime)
  }, [duration, videoRef])

  const updateVolume = useCallback((nextVolume: number) => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const clampedVolume = clamp(nextVolume, 0, 1)
    video.volume = clampedVolume
    video.muted = clampedVolume === 0
    setVolume(clampedVolume)
    setIsMuted(video.muted)

    if (clampedVolume > 0) {
      lastNonZeroVolumeRef.current = clampedVolume
    }
  }, [videoRef])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current

    if (!video || !hasSource || hasError) {
      return
    }

    if (video.paused || video.ended) {
      void video.play().catch(() => undefined)
      return
    }

    video.pause()
  }, [hasError, hasSource, videoRef])

  const toggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      updateVolume(lastNonZeroVolumeRef.current || 1)
      return
    }

    lastNonZeroVolumeRef.current = volume
    updateVolume(0)
  }, [isMuted, updateVolume, volume])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current

    if (!container) {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }

    await container.requestFullscreen().catch(() => undefined)
  }, [])

  const handlePlaybackRateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const nextRate = Number(event.target.value)
    video.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }

  const handleSeekInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value)
    setCurrentTime(nextTime)

    if (!isSeeking) {
      seekTo(nextTime)
    }
  }

  const commitSeek = (nextTime: number) => {
    seekTo(nextTime)
    setIsSeeking(false)
    queueAutoHideControls()
  }

  const handleSeekPointerDown = () => {
    clearHideControlsTimer()
    setIsSeeking(true)
    setShowControls(true)
  }

  const handleSeekPointerUp = (value: number) => {
    commitSeek(value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasSource || hasError) {
      return
    }

    const target = event.target as HTMLElement | null

    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return
    }

    switch (event.key) {
      case ' ':
        event.preventDefault()
        togglePlayPause()
        break
      case 'ArrowLeft':
        event.preventDefault()
        seekTo(currentTime - 10)
        break
      case 'ArrowRight':
        event.preventDefault()
        seekTo(currentTime + 10)
        break
      case 'ArrowUp':
        event.preventDefault()
        updateVolume(volume + 0.1)
        break
      case 'ArrowDown':
        event.preventDefault()
        updateVolume(volume - 0.1)
        break
      case 'f':
      case 'F':
        event.preventDefault()
        void toggleFullscreen()
        break
      default:
        break
    }
  }

  const handlePointerMove = () => {
    setShowControls(true)
    queueAutoHideControls()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="theme-heading text-lg font-semibold md:text-xl">{title}</h2>
        {subtitle ? <p className="theme-muted text-sm leading-6">{subtitle}</p> : null}
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[color:rgba(255,255,255,0.16)] bg-[#0a1219] shadow-[0_20px_60px_rgba(5,10,16,0.45)]',
          isPlaying && !showControls ? 'cursor-none' : 'cursor-default',
        )}
        onBlur={queueAutoHideControls}
        onFocus={() => setShowControls(true)}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={queueAutoHideControls}
        onMouseMove={handlePointerMove}
        onMouseDown={() => containerRef.current?.focus()}
        onTouchStart={() => {
          setShowControls((current) => !current)
        }}
        ref={containerRef}
        role="region"
        tabIndex={0}
      >
        {hasSource ? (
          <video
            className="aspect-video w-full bg-[#070d13] object-contain"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            key={videoKey}
            onCanPlay={() => setIsBuffering(false)}
            onContextMenu={(event) => event.preventDefault()}
            onDurationChange={refreshPlaybackStateFromElement}
            onEnded={() => {
              setIsPlaying(false)
              setShowControls(true)
              setIsBuffering(false)
            }}
            onError={onVideoError}
            onLoadedMetadata={() => {
              onVideoLoadedMetadata()
              refreshPlaybackStateFromElement()
            }}
            onPause={() => {
              setIsPlaying(false)
              setShowControls(true)
              clearHideControlsTimer()
            }}
            onPlay={() => {
              setIsPlaying(true)
              setHasStarted(true)
              onVideoPlay()
            }}
            onPlaying={() => {
              setIsBuffering(false)
              queueAutoHideControls()
            }}
            onProgress={refreshPlaybackStateFromElement}
            onRateChange={refreshPlaybackStateFromElement}
            onTimeUpdate={refreshPlaybackStateFromElement}
            onVolumeChange={refreshPlaybackStateFromElement}
            onWaiting={() => {
              if (videoRef.current && !videoRef.current.paused) {
                setIsBuffering(true)
                setShowControls(true)
              }
            }}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={src}
          />
        ) : (
          <div className="theme-muted flex aspect-video items-center justify-center px-6 text-center text-sm">
            {emptyMessage}
          </div>
        )}

        {showCenterPlay ? (
          <button
            aria-label="Play video"
            className="absolute inset-0 z-20 flex items-center justify-center bg-[color:rgba(7,12,18,0.38)]"
            onClick={togglePlayPause}
            type="button"
          >
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.24)] bg-[color:rgba(5,10,16,0.72)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
              <Play className="h-8 w-8" />
            </span>
          </button>
        ) : null}

        {shouldShowLoader ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[color:rgba(7,12,18,0.48)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(255,255,255,0.18)] bg-[color:rgba(10,16,24,0.86)] px-4 py-2 text-sm text-white">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Loading video...</span>
            </div>
          </div>
        ) : null}

        {hasError ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[color:rgba(7,12,18,0.82)] px-6">
            <div className="max-w-md rounded-xl border border-[color:rgba(255,255,255,0.18)] bg-[color:rgba(12,18,28,0.94)] p-5 text-center text-sm text-white">
              <AlertCircle className="mx-auto mb-3 h-6 w-6 text-[color:var(--danger)]" />
              <p className="font-semibold">Video could not be loaded</p>
              <p className="mt-2 text-[color:rgba(255,255,255,0.76)]">{sourceErrorMessage}</p>
            </div>
          </div>
        ) : null}

        {hasSource ? (
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-[25] bg-[linear-gradient(180deg,rgba(6,11,18,0)_0%,rgba(6,11,18,0.72)_40%,rgba(6,11,18,0.94)_100%)] px-3 pb-3 pt-8 transition-opacity duration-200 sm:px-4 sm:pb-4',
              showControls || !isPlaying ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <div className="rounded-xl border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(6,11,18,0.82)] p-3 backdrop-blur-md sm:p-3.5">
              <div className="mb-2">
                <div className="relative h-1.5 overflow-hidden rounded-full bg-[color:rgba(255,255,255,0.14)]">
                  <div
                    className="absolute inset-y-0 left-0 bg-[color:rgba(255,255,255,0.28)]"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-[color:var(--color-muted-sage)]"
                    style={{ width: `${playedPercent}%` }}
                  />
                </div>
                <input
                  aria-label="Seek"
                  className="edu-video-range mt-[-6px] h-3 w-full"
                  max={duration || 0}
                  min={0}
                  onChange={handleSeekInput}
                  onPointerDown={handleSeekPointerDown}
                  onPointerUp={(event) => handleSeekPointerUp(Number(event.currentTarget.value))}
                  step={0.1}
                  style={{ '--range-progress': `${playedPercent}%` } as CSSProperties}
                  type="range"
                  value={currentTime}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="edu-video-icon-btn"
                    onClick={togglePlayPause}
                    type="button"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>

                  <p className="min-w-0 text-xs font-medium text-[color:rgba(255,255,255,0.84)] sm:text-sm">
                    {formatTime(currentTime)}
                    <span className="mx-1 text-[color:rgba(255,255,255,0.38)]">/</span>
                    {formatTime(duration)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                      className="edu-video-icon-btn"
                      onClick={toggleMute}
                      type="button"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      aria-label="Volume"
                      className="edu-video-range w-20 sm:w-24"
                      max={1}
                      min={0}
                      onChange={(event) => updateVolume(Number(event.target.value))}
                      step={0.05}
                      style={{ '--range-progress': `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties}
                      type="range"
                      value={isMuted ? 0 : volume}
                    />
                  </div>

                  <label className="relative inline-flex">
                    <span className="sr-only">Playback speed</span>
                    <select
                      className="edu-video-select"
                      onChange={handlePlaybackRateChange}
                      value={playbackRate}
                    >
                      {SPEED_OPTIONS.map((speed) => (
                        <option key={speed} value={speed}>{speed}x</option>
                      ))}
                    </select>
                  </label>

                  <button
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    className="edu-video-icon-btn"
                    onClick={() => {
                      void toggleFullscreen()
                    }}
                    type="button"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CourseVideoPlayer

import { useEffect, useState, type SyntheticEvent } from 'react'

interface CourseImageProps {
  alt: string
  className?: string
  fit?: 'contain' | 'cover'
  fallbackSrc: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  src: string
}

const joinClasses = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(' ')

const CourseImage = ({
  alt,
  className,
  fit = 'contain',
  fallbackSrc,
  imageClassName,
  loading = 'lazy',
  src,
}: CourseImageProps) => {
  const [displaySrc, setDisplaySrc] = useState(src || fallbackSrc)

  useEffect(() => {
    setDisplaySrc(src || fallbackSrc)
  }, [fallbackSrc, src])

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (displaySrc === fallbackSrc) {
      return
    }

    event.currentTarget.dataset.fallbackApplied = 'true'
    setDisplaySrc(fallbackSrc)
  }

  return (
    <div className={joinClasses('relative isolate overflow-hidden bg-[color:var(--surface-soft)]', className)}>
      <div aria-hidden="true" className="absolute inset-0 bg-[color:var(--surface-muted)]" />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl"
        src={displaySrc}
      />
      <img
        alt={alt}
        className={joinClasses(
          `relative z-10 block h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`,
          imageClassName,
        )}
        loading={loading}
        onError={handleImageError}
        src={displaySrc}
      />
    </div>
  )
}

export default CourseImage

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  src: string
  alt?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  aspectRatio?: 'video' | 'square' | '4/3'
  className?: string
}

export function ImageGallery({ images, aspectRatio = 'video', className }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)

  const aspectClass = {
    video:  'aspect-video',
    square: 'aspect-square',
    '4/3':  'aspect-[4/3]',
  }[aspectRatio]

  if (!images.length) {
    return (
      <div className={cn('flex items-center justify-center rounded bg-muted', aspectClass, className)}>
        <ImageOff className="size-12 text-muted-foreground/50" />
      </div>
    )
  }

  const prev = () => setCurrent(p => (p - 1 + images.length) % images.length)
  const next = () => setCurrent(p => (p + 1) % images.length)

  return (
    <div className={cn('overflow-hidden rounded', className)}>
      {/* Main image */}
      <div className={cn('relative group overflow-hidden', aspectClass)}>
        <img
          src={images[current].src}
          alt={images[current].alt ?? ''}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/800/450' }}
        />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 backdrop-blur-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 backdrop-blur-sm"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'shrink-0 h-16 w-24 rounded-md overflow-hidden ring-2 ring-offset-1 transition-all',
                i === current
                  ? 'ring-primary opacity-100'
                  : 'ring-transparent opacity-60 hover:opacity-90',
              )}
            >
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { FaStar } from 'react-icons/fa'


type Testimonial = {
  text: string
  author: string
  icon: JSX.Element
}

interface AutoCarouselProps {
  items: Testimonial[]
  speed?: number // píxeles por frame
}

export default function AutoCarousel({ items, speed = 1 }: AutoCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollPositionRef = useRef(0) // acumulador decimal

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationId: number

    const scroll = () => {
      if (!container) return

      if (!isPaused) {
        scrollPositionRef.current += speed
        container.scrollLeft = Math.floor(scrollPositionRef.current)

        if (scrollPositionRef.current >= container.scrollWidth / 2) {
          scrollPositionRef.current = 0
          container.scrollLeft = 0
        }
      }

      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused, speed])

  return (
    <div
      className="w-full overflow-x-scroll no-scrollbar px-4"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex gap-6 w-max">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="neuro-testimonial flex flex-col justify-between" style={{ width: '600px', minHeight: '180px' }}>
            {/* Stars */}
            <div className="testimonial-stars mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className="star-rating filled"
                />
              ))}
            </div>
            <div className="flex-1">
              <p className="text-[16px] text-[#132944] text-start mb-3 leading-relaxed">{item.text}</p>
              <p className="text-[16px] text-start font-semibold text-[#132944]">{item.author}</p>
            </div>
            <div className="flex justify-end mt-4">
              <div className="neuro-icon-container w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2A1E90]">
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// components/FloatingAssistantButton.tsx

import Image from 'next/image'

export default function FloatingAssistantButton() {
  return (
    <button
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-md text-white font-medium shadow-lg bg-gradient-to-r from-[#132944] to-[#3C31A3] hover:scale-105 transition-transform"
    >
      <div className="">
        <Image src={'/assets/images/IA.svg'} alt="Asistente CognIA" width={33} height={33} />
      </div>
      <span>Asistente CognIA</span>
    </button>
  )
}

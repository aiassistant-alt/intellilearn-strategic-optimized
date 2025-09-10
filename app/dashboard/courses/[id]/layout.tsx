/**
 * Generate static params for course detail pages
 * Required for static export in Next.js
 */
export async function generateStaticParams() {
  // Generate static params for sample courses
  return [
    { id: '000000000' }, // Curso principal actual
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ]
}

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 
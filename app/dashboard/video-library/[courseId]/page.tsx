/**
 * ^VideoLibraryCourseDetailPage
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Detailed view of video course episodes with grid/list toggle
 * Business Context: Shows all videos within a specific course folder
 * Relations: Accessed from Video Library main page via course card click
 * Reminders: Supports both grid and list view modes for video browsing
 */

import VideoLibraryCourseDetailClient from './VideoLibraryCourseDetailClient'

// Generate static params for all possible course IDs
export async function generateStaticParams() {
  return [
    { courseId: '000001' },
    { courseId: '000002' },
    { courseId: '000003' },
    { courseId: '000004' },
    { courseId: '000005' },
    { courseId: '000006' }
  ]
}

export default async function VideoLibraryCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  return <VideoLibraryCourseDetailClient courseId={courseId} />
}

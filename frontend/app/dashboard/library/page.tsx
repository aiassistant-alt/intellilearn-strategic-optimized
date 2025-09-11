/**
 * ^LibraryPage
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Library management page for educational resources
 * Business Context: Admin interface for managing educational content library
 * Relations: Connected to Video Library and course management systems
 * Reminders: Only accessible in admin mode
 */

import LibraryClient from './LibraryClient'

export const metadata = {
  title: 'Library - Intellilearn',
  description: 'Educational resources library management',
}

export default function LibraryPage() {
  return <LibraryClient />
}

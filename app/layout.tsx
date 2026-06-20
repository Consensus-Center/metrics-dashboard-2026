import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Consensus Center — Transparency Dashboard',
  description:
    'Honest, real-time metrics for the Consensus Center: membership & revenue, members & access, the operator network, clinical activity & integrity, and unit economics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

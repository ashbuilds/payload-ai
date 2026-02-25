import React from 'react'
import './frontend.css'

export const metadata = {
  title: 'Minimal Clothing Store',
  description: 'A minimal fashion store',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="frontend-shell">{children}</main>
      </body>
    </html>
  )
}

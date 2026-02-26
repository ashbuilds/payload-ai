import React from 'react'

import './frontend.css'

export const metadata = {
  description: 'A minimal fashion store',
  title: 'Minimal Clothing Store',
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

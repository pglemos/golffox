import type { Metadata } from 'next'
import Script from 'next/script'
import '../index.css'
import { AppProvider } from './providers'

export const metadata: Metadata = {
  title: 'Golffox Management Panel',
  description: 'Sistema de gestão e rastreamento de veículos Golffox',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script
          id="tailwind-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfill for process.env to prevent app crash on load
              window.process = window.process || { env: {} };
              
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      golffox: {
                        'orange-primary': '#FF5F00',
                        'blue-dark': '#002D56',
                        'blue-light': '#004A8D',
                        'gray-dark': '#2C3E50',
                        'gray-medium': '#7F8C8D',
                        'gray-light': '#F4F4F4',
                        'white': '#FFFFFF',
                        'red': '#E74C3C',
                        'yellow': '#F1C40F',
                      },
                    },
                    fontFamily: {
                      sans: ['Roboto', 'sans-serif'],
                    },
                  },
                },
              };
            `,
          }}
        />
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
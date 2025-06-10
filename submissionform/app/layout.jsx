import "./globals.css"
import { FormProvider } from "../contexts/form-context"
import { ErrorBoundary } from "../components/error-boundary"

export const metadata = {
  title: "Share Your Vision - Abby Museum",
  description: "Join the creative community at Abby Museum and share your artistic vision with the world.",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <FormProvider>{children}</FormProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

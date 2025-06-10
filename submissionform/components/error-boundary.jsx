"use client"

import { Component } from "react"
import { Button } from "../components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

/**
 * Error boundary component to catch and handle React errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service in production
    console.error("Error caught by boundary:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Store error info for debugging
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "lastError",
        JSON.stringify({
          error: error.toString(),
          errorInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      )
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      const isNetworkError =
        this.state.error?.message?.includes("fetch") || this.state.error?.message?.includes("network")

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md w-full text-center shadow-lg">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />

            <h2 className="text-2xl font-bold text-red-700 mb-4">
              {isNetworkError ? "Connection Problem" : "Something went wrong"}
            </h2>

            <p className="text-gray-600 mb-6">
              {isNetworkError
                ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
                : "We're sorry, but we encountered an unexpected error. Your progress has been saved and you can continue where you left off."}
            </p>

            {this.state.retryCount < 3 && (
              <div className="space-y-3 mb-4">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>
            )}

            <Button
              onClick={this.handleGoHome}
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-gray-600"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Button>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

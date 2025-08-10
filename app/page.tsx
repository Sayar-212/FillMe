"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"

import GradientBG from "../components/gradient-bg"
import { useAuth } from "../components/auth"

export default function Page() {
  const router = useRouter()
  const { user, signIn } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <GradientBG />
      <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <img 
              src="https://i.ibb.co/bj0kyZK2/logo.png" 
              alt="FillMe Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <span className="inline-block rounded-full border px-3 py-1 text-xs text-muted-foreground">
            FillMe — Structured, Easy & Private Storage for Code & Beyond
          </span>
          <h1 className="text-balance bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-semibold leading-tight text-transparent md:text-6xl">
            {"Store Everything. Structured. Private."}
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
            {"Drop it. Tag it. Find it. No file size limits."}
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              className="group relative rounded-full px-6"
              onClick={async () => {
                await signIn({ provider: "google" })
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {"Login with Google"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              {"Limited Storage cuz i m Poor"}
            </p>
            <div className="mt-6 pt-4 border-t border-muted/20">
              <a 
                href="/about" 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Meet the Creator →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

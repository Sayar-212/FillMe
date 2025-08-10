"use client"

import type React from "react"

import { AuthProvider } from "../components/auth"

export default function Providers({ children }: { children?: React.ReactNode } = { children: null }) {
  return <AuthProvider>{children}</AuthProvider>
}

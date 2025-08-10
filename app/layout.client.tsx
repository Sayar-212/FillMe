import type React from "react"
import Providers from "./providers"

export default function ClientLayout({ children }: { children?: React.ReactNode } = { children: null }) {
  return <Providers>{children}</Providers>
}

import { MainLayout } from "@/components/layouts/main-layout"
import type { ReactNode } from "react"

export default function UserProfileLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}

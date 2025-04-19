import { redirect } from "next/navigation"

export default function Dashboard() {
  // Redirect to home page
  redirect("/home")
  return null
}

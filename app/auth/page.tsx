import { Suspense } from "react"
import LoginForm from "@/app/auth/components/login-form"

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <LoginFormWrapper />
        </Suspense>
      </div>
    </div>
  )
}
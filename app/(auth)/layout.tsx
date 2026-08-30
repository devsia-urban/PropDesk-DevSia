import React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 md:p-6">
      <main className="w-full h-full flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}

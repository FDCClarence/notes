import { appConfig } from '../config/app'

export function AppShell() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight">{appConfig.name}</h1>
        <p className="prose prose-slate mt-4 text-center text-slate-600">
          {appConfig.tagline}
        </p>
      </div>
    </main>
  )
}

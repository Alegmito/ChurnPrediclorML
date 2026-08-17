import Link from "next/link";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            API health and recent churn predictions.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Back to Predictor
        </Link>
      </header>

      <Dashboard />
    </main>
  );
}

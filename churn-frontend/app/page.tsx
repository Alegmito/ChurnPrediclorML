import ChurnForm from "@/components/ChurnForm";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Customer Churn Prediction
            </h1>
            <p className="mt-1 text-gray-600">
              Predict churn risk using the ML prediction API
            </p>
          </div>
          <Link
          href={"/dashboard"}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </header>
        <ChurnForm />
      </main>
  );
}

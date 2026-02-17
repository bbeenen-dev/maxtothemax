import PredictionForm from "@/components/PredictionForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">
          F1 Voorspelling 🏎️
        </h1>
        
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
          <PredictionForm />
        </div>
      </div>
    </main>
  );
}
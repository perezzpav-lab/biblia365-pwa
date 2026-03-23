import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CompartirQuizClient from "./CompartirQuizClient";

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-violet-50">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Cargando" />
    </div>
  );
}

export default function CompartirPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CompartirQuizClient />
    </Suspense>
  );
}

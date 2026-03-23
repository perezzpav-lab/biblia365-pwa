import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DueloClient from "./DueloClient";

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-fuchsia-50 to-violet-50">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Cargando" />
    </div>
  );
}

export default function DueloPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <DueloClient />
    </Suspense>
  );
}

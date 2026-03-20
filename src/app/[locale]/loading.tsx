import LeafLoader from "@/components/ui/LeafLoader";

export default function LocaleLoading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white">
      <LeafLoader />
      <p className="animate-pulse text-sm font-medium text-emerald-600">
        Yüklənir...
      </p>
    </div>
  );
}

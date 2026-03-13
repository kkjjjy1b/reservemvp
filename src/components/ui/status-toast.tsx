"use client";

type StatusToastProps = {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
};

export function StatusToast({
  message,
  tone = "success",
  onClose,
}: StatusToastProps) {
  const toneClassName =
    tone === "success"
      ? "border-black/10 bg-[#fbfbfa] text-[#37352f] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      : "border-[#d9735b]/20 bg-[#fff7f5] text-[#b42318] shadow-[0_10px_30px_rgba(15,23,42,0.08)]";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[70] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${toneClassName}`}
      >
        <span className="font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-[#6b6a67] transition hover:bg-black/[0.04]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

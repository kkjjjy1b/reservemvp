export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-3 md:px-5 md:py-5">
      <section className="mx-auto max-w-[1640px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
        <header className="border-b border-black/10 bg-[#fcfcfb] px-5 py-4 md:px-7">
          <div className="h-6 w-28 animate-pulse rounded-full bg-black/5" />
          <div className="mt-3 h-9 w-40 animate-pulse rounded-full bg-black/10" />
        </header>

        <section className="px-6 py-12 md:px-8">
          <div className="mx-auto max-w-[680px] rounded-[24px] border border-black/10 bg-[#fcfcfb] px-6 py-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[#2f3437]" />
            <p className="mt-5 text-lg font-semibold text-[#2f3437]">
              화면을 준비하고 있습니다.
            </p>
            <p className="mt-2 text-sm text-[#6b6a67]">
              로그인 상태와 예약 현황을 불러오는 중입니다.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

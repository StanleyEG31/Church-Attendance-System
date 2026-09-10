function SyncOverlay({ status }) {
  if (!status) return null;

  const isSyncing = status === "syncing";
  const isSuccess = status === "success";
  const isPartial = status === "partial";
  const isFailed = status === "failed";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">

        {/* SYNCING */}
        {isSyncing && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Syncing data...
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Please wait while your offline changes are being synchronized.
            </p>
          </>
        )}

        {/* SUCCESS */}
        {isSuccess && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Sync complete!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              All offline changes have been synchronized successfully.
            </p>
          </>
        )}

        {/* PARTIAL */}
        {isPartial && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-3xl text-yellow-600">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Sync partially completed
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Some changes could not be synchronized. They remain saved on
              this device and will be retried when the connection is available.
            </p>
          </>
        )}

        {/* FAILED */}
        {isFailed && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-600">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Sync failed
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your offline changes are still saved on this device and will be
              retried when the connection is available.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default SyncOverlay;
import { useSocketToasts } from "../context/SocketContext";

export function ToastStack() {
  const { toasts, dismissToast } = useSocketToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="max-w-xs rounded-xl border border-white/60 bg-white/95 px-4 py-3 text-left text-sm text-gray-900 shadow-lg shadow-gray-900/10 backdrop-blur-xl"
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}

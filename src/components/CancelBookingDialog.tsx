"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, ShieldCheck, X } from "lucide-react";

interface CancelBookingDialogProps {
  bookingId: string;
  startAt: string;
  hasAssignedHelper: boolean;
  isEnRoute?: boolean;
  initiallyOpen?: boolean;
  currentTimeMs?: number;
}

export function CancelBookingDialog({
  bookingId,
  startAt,
  hasAssignedHelper,
  isEnRoute = false,
  initiallyOpen = false,
  currentTimeMs,
}: CancelBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isLateCancellation, setIsLateCancellation] = useState(() => {
    if (currentTimeMs !== undefined) {
      const hours = (new Date(startAt).getTime() - currentTimeMs) / (1000 * 60 * 60);
      return hasAssignedHelper && (hours <= 4 || isEnRoute);
    }
    return isEnRoute;
  });

  function handleOpen() {
    const startTime = new Date(startAt).getTime();
    const now = Date.now();
    const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
    setIsLateCancellation(hasAssignedHelper && (hoursUntilStart <= 4 || isEnRoute));
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors cursor-pointer"
      >
        <Trash2 className="size-3.5" />
        <span>Cancel Request</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-100 space-y-6">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Header / Policy Badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isLateCancellation ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    R100 Fee Applies
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    Free Cancellation
                  </span>
                )}
              </div>
              <h2 id="cancel-dialog-title" className="text-xl font-bold tracking-tight text-neutral-900">
                {isLateCancellation ? "Late Cancellation Notice" : "Cancel Booking Request"}
              </h2>
            </div>

            {/* Body Explanation */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs leading-relaxed space-y-2">
              {isLateCancellation ? (
                <>
                  <p className="font-semibold text-neutral-900">
                    Because you are cancelling within 4 hours of the start time (or your helper is already on their way):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700">
                    <li>
                      An automatic <strong>R100 transport compensation</strong> is provided to your helper for their travel commitment.
                    </li>
                    <li>Any remainder of your payment will be refunded to your card.</li>
                  </ul>
                </>
              ) : (
                <p className="text-neutral-700">
                  You are cancelling more than 4 hours before the booking starts (or before a helper was assigned). You will receive a <strong>full refund</strong> with zero cancellation fee.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <form action="/api/host/bookings/cancel" method="post" className="w-full">
                <input type="hidden" name="bookingId" value={bookingId} />
                <button
                  type="submit"
                  className="w-full h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {isLateCancellation ? "Confirm Cancellation (R100 Fee)" : "Confirm Free Cancellation"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

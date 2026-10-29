"use client";

import { useState } from "react";
import { assignHelpers } from "@/app/(admin)/admin/bookings/actions";

type ShortlistHelper = { index: number; rateNote: string; profile: { first_name: string; phone: string } };

export function AssignmentControls({ bookingId, helpers, version }: { bookingId: string; helpers: ShortlistHelper[]; version: string }) {
  const [selected, setSelected] = useState<number[]>([]);
  return <div className="grid gap-4"><ul className="admin-reference-list">{helpers.map((helper) => <li className="admin-panel" key={helper.index}><label className="flex gap-3"><input type="checkbox" checked={selected.includes(helper.index)} onChange={(event) => setSelected(event.target.checked ? [...selected, helper.index] : selected.filter((index) => index !== helper.index))} className="mt-1 size-5" /><span><span className="block text-xl font-medium">{helper.profile.first_name}</span><span className="block text-sm text-[#666]">{helper.profile.phone} / {helper.rateNote}</span></span></label></li>)}</ul><div className="admin-actions"><button disabled={!selected.length} onClick={() => assignHelpers(bookingId, { indexes: selected, version })} className="admin-action-button" type="button">Assign selected</button></div></div>;
}

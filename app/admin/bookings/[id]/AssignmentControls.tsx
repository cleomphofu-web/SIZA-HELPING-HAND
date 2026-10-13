"use client";

import { useState } from "react";
import { assignCleaners } from "@/app/admin/bookings/actions";

export function AssignmentControls({ bookingId, cleaners, summary }: { bookingId: string; summary: string; cleaners: Array<{ id: string; full_name: string; phone: string; rate_amount: number; rate_unit: string }> }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <div className="grid gap-4"><ul className="admin-reference-list">{cleaners.map((cleaner) => <li className="admin-panel" key={cleaner.id}><label className="flex gap-3"><input type="checkbox" checked={selected.includes(cleaner.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, cleaner.id] : selected.filter((id) => id !== cleaner.id))} className="mt-1 size-5" /><span><span className="block text-xl font-medium">{cleaner.full_name}</span><span className="block text-sm text-[#666]">{cleaner.phone} / R{cleaner.rate_amount} {cleaner.rate_unit}</span></span></label></li>)}</ul><div className="admin-actions"><button disabled={!selected.length} onClick={() => assignCleaners(bookingId, selected)} className="admin-action-button" type="button">Assign selected</button><a className="admin-action-button admin-action-button-secondary" href={`https://wa.me/?text=${encodeURIComponent(summary)}`} target="_blank" rel="noreferrer">Open WhatsApp summary ↗</a></div></div>;
}

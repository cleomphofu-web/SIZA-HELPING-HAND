"use client";

import { useState } from "react";
import { approveHelper, rejectHelper } from "@/app/(admin)/admin/helpers/actions";

export function VettingForm({ id }: { id: string }) {
  const [checks, setChecks] = useState({ idMatchesSelfie: false, idReadable: false, referencesCalled: false });
  const ready = Object.values(checks).every(Boolean);
  return <div className="admin-panel"><p className="admin-panel-title">Required before approval</p><div className="admin-checklist">{(["idMatchesSelfie", "idReadable", "referencesCalled"] as const).map((key) => <label key={key}><input type="checkbox" checked={checks[key]} onChange={(event) => setChecks({ ...checks, [key]: event.target.checked })} />{key === "idMatchesSelfie" ? "ID matches selfie" : key === "idReadable" ? "ID is readable" : "Both references called"}</label>)}</div><div className="admin-actions"><button disabled={!ready} onClick={() => approveHelper(id, checks)} className="admin-action-button" type="button">Approve helper</button><button onClick={() => rejectHelper(id)} className="admin-action-button admin-action-button-secondary" type="button">Reject application</button></div></div>;
}

import React, { useState, useRef } from "react";
import { BILL_RECUR_LABEL, billUrgency, MONTHS } from "../lib/dates";

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function fmtAmt(n) {
  if (n == null || n === "") return "";
  return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const URGENCY_CLASS = { overdue: "bill-overdue", today: "bill-today", soon: "bill-soon", upcoming: "", paid: "bill-paid" };

export default function BillsPanel({
  bills, onAdd, onPay, onUnpay, onDelete, onUpdate, onUpload, onViewFile, editMode,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", amount: "", due_date: "", recur: "monthly" });
  const fileInputs = useRef({});

  const unpaid = bills.filter((b) => !b.paid).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paid = bills.filter((b) => b.paid).sort((a, b) => (b.paid_at || "").localeCompare(a.paid_at || ""));
  const [showPaid, setShowPaid] = useState(false);

  const submit = () => {
    if (!draft.name.trim() || !draft.due_date) return;
    onAdd({ name: draft.name.trim(), amount: draft.amount ? parseFloat(draft.amount) : null, due_date: draft.due_date, recur: draft.recur });
    setDraft({ name: "", amount: "", due_date: "", recur: "monthly" });
    setShowAdd(false);
  };

  const handleDrop = (billId) => (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bill-dragover");
    const file = e.dataTransfer.files[0];
    if (file) onUpload(billId, file);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add("bill-dragover"); };
  const handleDragLeave = (e) => { e.currentTarget.classList.remove("bill-dragover"); };

  return (
    <div className="panel bills-panel">
      <div className="panel-head">
        <span className="dot" style={{ background: "#DD6B53" }} />
        <h3>Bills</h3>
        {unpaid.length > 0 && <span className="bills-badge">{unpaid.length} due</span>}
      </div>

      <div className="bills-list">
        {unpaid.map((b) => {
          const urg = billUrgency(b);
          return (
            <div
              key={b.id}
              className={"bill-row " + (URGENCY_CLASS[urg] || "")}
              onDrop={handleDrop(b.id)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <button className="bill-pay" onClick={() => onPay(b.id)} title="Mark paid">
                <svg viewBox="0 0 16 16" className="tick"><path d="M3 8.5l3 3 7-8" /></svg>
              </button>
              <div className="bill-info">
                <span className="bill-name">{b.name}</span>
                <span className="bill-meta">
                  {fmtDate(b.due_date)}
                  {b.amount != null && <> &middot; {fmtAmt(b.amount)}</>}
                  {b.recur !== "none" && <> &middot; {BILL_RECUR_LABEL[b.recur]}</>}
                </span>
              </div>
              <div className="bill-actions">
                {b.file_path ? (
                  <button className="bill-file has" onClick={() => onViewFile(b.file_path)} title="View invoice">&#128196;</button>
                ) : (
                  <button className="bill-file" onClick={() => fileInputs.current[b.id]?.click()} title="Attach invoice (or drag PDF here)">&#128206;</button>
                )}
                <input ref={(el) => (fileInputs.current[b.id] = el)} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" hidden
                  onChange={(e) => { if (e.target.files[0]) onUpload(b.id, e.target.files[0]); }} />
                {editMode && <button className="del" onClick={() => onDelete(b.id)} aria-label="Delete">&times;</button>}
              </div>
              {urg === "overdue" && <span className="bill-urg-tag">overdue</span>}
              {urg === "today" && <span className="bill-urg-tag today">due today</span>}
              {urg === "soon" && <span className="bill-urg-tag soon">due soon</span>}
            </div>
          );
        })}

        {paid.length > 0 && (
          <div className="done-zone">
            <div className="done-bar">
              <button className="done-toggle" onClick={() => setShowPaid((s) => !s)}>
                &#10003; {paid.length} paid {showPaid ? "\u25BE" : "\u25B8"}
              </button>
            </div>
            {showPaid && paid.map((b) => (
              <div key={b.id} className="bill-row bill-paid">
                <button className="bill-pay on" onClick={() => onUnpay(b.id)} title="Mark unpaid">
                  <svg viewBox="0 0 16 16" className="tick"><path d="M3 8.5l3 3 7-8" /></svg>
                </button>
                <div className="bill-info">
                  <span className="bill-name">{b.name}</span>
                  <span className="bill-meta">{fmtDate(b.due_date)}{b.amount != null && <> &middot; {fmtAmt(b.amount)}</>}</span>
                </div>
                {b.file_path && (
                  <button className="bill-file has" onClick={() => onViewFile(b.file_path)} title="View invoice">&#128196;</button>
                )}
                {editMode && <button className="del" onClick={() => onDelete(b.id)} aria-label="Delete">&times;</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bill-add-form">
          <input placeholder="Bill name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input type="number" step="0.01" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          <input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
          <select value={draft.recur} onChange={(e) => setDraft({ ...draft, recur: e.target.value })}>
            {Object.entries(BILL_RECUR_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="bill-add-btns">
            <button className="bill-add-go" onClick={submit}>Add bill</button>
            <button className="bill-add-cancel" onClick={() => setShowAdd(false)}>cancel</button>
          </div>
        </div>
      ) : (
        <button className="bill-add-btn" onClick={() => setShowAdd(true)}>+ add bill</button>
      )}
    </div>
  );
}

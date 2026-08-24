import React from "react";

export default function page() {
  return (
    <div>
      <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
        Save & Print
      </button>

      <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
        ...
      </div>

      <span className="bg-success/10 text-success px-2 py-1 rounded-full text-sm">
        Paid
      </span>
    </div>
  );
}

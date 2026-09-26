"use client";

import { useState } from "react";

// "Your day changed" banner. `useState` remembers whether it's showing:
// `show` is the current value, `setShow` changes it (and React re-draws the component).
// The test button is temporary; later the live report data will decide when to show it.
export default function DayAlert({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  return (
    <div>
      {show && (
        <div className="rounded-2xl border border-yellow-300 bg-warn-light p-4">
          <p className="font-bold text-warn">⚠️ Your day changed</p>
          <p className="mt-1 text-sm text-gray-800">{message}</p>
        </div>
      )}
      <button
        onClick={() => setShow(!show)}
        className="mt-2 text-xs text-gray-400 underline"
      >
        Test: {show ? "hide" : "show"} alert
      </button>
    </div>
  );
}

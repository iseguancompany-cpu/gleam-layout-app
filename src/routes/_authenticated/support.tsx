import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support and Privacy — Cash Loading Portal" },
      {
        name: "description",
        content:
          "Change your password, review payout settings and contact your account manager.",
      },
      {
        property: "og:title",
        content: "Support and Privacy — Cash Loading Portal",
      },
      {
        property: "og:description",
        content: "Security settings and account manager contact details.",
      },
    ],
  }),
  component: Support,
});

function Support() {
  const [panel, setPanel] = useState<"password" | "settings" | null>(null);

  const [cashappTag, setCashappTag] = useState("");
  const [withdrawalCode, setWithdrawalCode] = useState("");

  return (
    <AppShell title="Support and Privacy">
      <div className="max-w-2xl space-y-4">
        <div className="grid gap-3">
          {/* Change Password */}
          <button
            type="button"
            onClick={() =>
              setPanel(panel === "password" ? null : "password")
            }
            className="w-full rounded-xl bg-navy px-4 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90"
          >
            Change Password
          </button>

          {panel === "password" && (
            <div className="grid gap-3 rounded-xl border border-border p-4">
              <input
                type="password"
                placeholder="Current password"
                className="rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />

              <input
                type="password"
                placeholder="New password"
                className="rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />

              <button
                type="button"
                className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold transition-colors hover:bg-accent"
              >
                Update password
              </button>
            </div>
          )}

          {/* Withdrawal Setting */}
          <button
            type="button"
            onClick={() =>
              setPanel(panel === "settings" ? null : "settings")
            }
            className="w-full rounded-xl bg-navy px-4 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90"
          >
            Withdrawal Setting
          </button>

          {panel === "settings" && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-4 border-b border-border pb-3 text-lg font-bold text-red-600">
                Withdrawal Setting
              </h3>

              <div className="grid gap-5 rounded-xl border border-border p-5">
                {/* Cashapp Tag */}
                <div className="grid gap-2">
                  <label
                    htmlFor="cashapp-tag"
                    className="text-sm font-medium"
                  >
                    Cashapp Tag
                  </label>

                  <input
                    id="cashapp-tag"
                    type="text"
                    value={cashappTag}
                    onChange={(event) =>
                      setCashappTag(event.target.value)
                    }
                    placeholder="$YourCashappTag"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>

                {/* Withdrawal Code */}
                <div className="grid gap-2">
                  <label
                    htmlFor="withdrawal-code"
                    className="text-sm font-medium"
                  >
                    Withdrawal Code
                  </label>

                  <input
                    id="withdrawal-code"
                    type="text"
                    value={withdrawalCode}
                    onChange={(event) =>
                      setWithdrawalCode(event.target.value)
                    }
                    placeholder="Enter withdrawal code"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>

                {/* Update Settings */}
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-orange-500 px-4 py-3 text-base font-bold text-white transition-colors hover:bg-orange-600"
                >
                  Update Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contact Manager */}
        <h2 className="pt-2 text-base font-bold text-ember">
          Contact Manager
        </h2>

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
          <p>
            <span className="font-bold">Email:</span> manager@example.com
          </p>

          <p>
            <span className="font-bold">Phone:</span> +1 (555) 010-4532
          </p>

          <p>
            <span className="font-bold">Address:</span> 1455 Market Street
            Suite 600, San Francisco, CA 94103
          </p>
        </div>

        {/* Review Window */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
          Your account review window closes in 41 days.
        </div>
      </div>
    </AppShell>
  );
}

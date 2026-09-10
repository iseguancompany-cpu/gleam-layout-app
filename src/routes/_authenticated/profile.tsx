import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { account } from "@/lib/demo-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Cash Loading Portal" },
      { name: "description", content: "Update your display name, email, country and referrer details." },
      { property: "og:title", content: "Profile — Cash Loading Portal" },
      { property: "og:description", content: "Manage your account profile details." },
    ],
  }),
  component: Profile,
});

const field = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "text-sm font-bold";

function Profile() {
  const [form, setForm] = useState({
    name: account.name,
    email: account.email,
    country: account.country,
    referrer: account.referrer,
  });

  return (
    <AppShell title="Profile">
      <form
        className="max-w-xl space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Profile saved");
        }}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-navy text-xl font-extrabold text-navy-foreground">
            {form.name.charAt(0)}
          </div>
          <label className="min-w-0 cursor-pointer rounded-xl bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent">
            Choose file
            <input type="file" className="hidden" />
          </label>
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="name">
            Name<span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            required
            className={field}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="email">
            Email<span className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            className={field}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="country">
            Country<span className="text-destructive">*</span>
          </label>
          <select
            id="country"
            className={field}
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            {["United States", "Canada", "United Kingdom", "Nigeria", "Germany"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="referrer">
            Referrer<span className="text-destructive">*</span>
          </label>
          <input
            id="referrer"
            className={field}
            value={form.referrer}
            onChange={(e) => setForm({ ...form, referrer: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-ember px-6 py-3 text-base font-extrabold text-ember-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          Save Changes
        </button>
      </form>
    </AppShell>
  );
}

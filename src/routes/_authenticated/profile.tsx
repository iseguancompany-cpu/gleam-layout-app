import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useProfile, useUpdateProfile } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Cash Loading Portal" },
      { name: "description", content: "Update your display name, email, phone, country and referrer details." },
      { property: "og:title", content: "Profile — Cash Loading Portal" },
      { property: "og:description", content: "Manage your account profile details." },
    ],
  }),
  component: Profile,
});

const field =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "text-sm font-bold";

function Profile() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "United States",
    referrer: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        country: profile.country ?? "United States",
        referrer: profile.referrer ?? "",
      });
    }
  }, [profile]);

  return (
    <AppShell title="Profile">
      <form
        className="max-w-xl space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(form, {
            onSuccess: () => toast.success("Profile saved"),
            onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
          });
        }}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-navy text-xl font-extrabold text-navy-foreground">
            {(form.full_name || form.email || "?").charAt(0).toUpperCase()}
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading your details…" : "Keep your details up to date."}
          </p>
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="name">
            Name<span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            required
            className={field}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
          <label className={labelCls} htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            className={field}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
            Referrer
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
          disabled={update.isPending}
          className="w-full rounded-xl bg-ember px-6 py-3 text-base font-extrabold text-ember-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {update.isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </AppShell>
  );
}

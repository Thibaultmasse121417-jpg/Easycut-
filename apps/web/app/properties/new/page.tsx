"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      address: form.get("address"),
      city: form.get("city"),
      postalCode: form.get("postalCode"),
      price: form.get("price") ? Number(form.get("price")) : undefined,
      surface: form.get("surface") ? Number(form.get("surface")) : undefined,
      rooms: form.get("rooms") ? Number(form.get("rooms")) : undefined,
      notes: form.get("notes"),
    };

    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Impossible de créer le bien. Réessayez.");
      setSubmitting(false);
      return;
    }

    const property = await response.json();
    router.push(`/properties/${property.id}`);
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Nouveau bien</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field name="title" label="Titre" required />
        <Field name="address" label="Adresse" required />
        <div className="grid grid-cols-2 gap-4">
          <Field name="city" label="Ville" required />
          <Field name="postalCode" label="Code postal" required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field name="price" label="Prix (€)" type="number" />
          <Field name="surface" label="Surface (m²)" type="number" />
          <Field name="rooms" label="Pièces" type="number" />
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Notes pour le descriptif (optionnel)
          <textarea name="notes" rows={3} className="rounded-md border border-neutral-300 p-2" />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer le bien"}
        </button>
      </form>

      <p className="mt-6 text-xs text-neutral-500">
        L&apos;upload des photos et le lancement des traitements IA se font sur la
        fiche du bien, une fois celui-ci créé.
      </p>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-md border border-neutral-300 p-2"
      />
    </label>
  );
}

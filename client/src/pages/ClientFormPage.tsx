import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import type { ClientPayload } from "../types";

const emptyForm: ClientPayload = {
  name: "",
  email: "",
  dateOfBirth: "",
  nationality: "",
  passportNumber: "",
  consentStatus: "PENDING",
  conflictCheckStatus: "ESCALATE",
  portalActive: false
};

export function ClientFormPage() {
  const { clientId } = useParams();
  const isEditing = Boolean(clientId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClientPayload>(emptyForm);
  const [error, setError] = useState("");

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api.client(clientId ?? ""),
    enabled: isEditing
  });

  useEffect(() => {
    if (!client) return;

    setForm({
      name: client.name,
      email: client.email,
      dateOfBirth: client.dob,
      nationality: client.nationality,
      passportNumber: "",
      consentStatus: client.consentStatus as ClientPayload["consentStatus"],
      conflictCheckStatus: client.conflictCheck as ClientPayload["conflictCheckStatus"],
      portalActive: client.portalActive
    });
  }, [client]);

  const mutation = useMutation({
    mutationFn: () =>
      isEditing && clientId ? api.updateClient(clientId, form) : api.createClient(form),
    onSuccess: async (savedClient) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["client", savedClient.id] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
      navigate(`/app/clients/${savedClient.id}`);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save client");
    }
  });

  function updateField<K extends keyof ClientPayload>(field: K, value: ClientPayload[K]) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  if (isEditing && isLoading) {
    return <p className="text-sm text-ink/60">Loading client...</p>;
  }

  return (
    <div>
      <Link
        to="/app/clients"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-moss hover:text-coral"
      >
        <ArrowLeft size={16} />
        Back to clients
      </Link>

      <PageHeader
        eyebrow="Client CRM"
        title={isEditing ? "Edit Client" : "Create Client"}
        description="Capture demographics, passport details, consent state, conflict check outcome, and portal readiness."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        {error ? (
          <div className="mb-5 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Date of birth">
            <input
              required
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => updateField("dateOfBirth", event.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Nationality">
            <input
              required
              value={form.nationality}
              onChange={(event) => updateField("nationality", event.target.value)}
              className="form-input"
            />
          </Field>

          <Field label={isEditing ? "New passport number" : "Passport number"}>
            <input
              required={!isEditing}
              placeholder={isEditing ? "Leave blank to keep current passport" : "X1234567"}
              value={form.passportNumber}
              onChange={(event) => updateField("passportNumber", event.target.value.toUpperCase())}
              className="form-input"
            />
          </Field>

          <Field label="Consent status">
            <select
              value={form.consentStatus}
              onChange={(event) =>
                updateField("consentStatus", event.target.value as ClientPayload["consentStatus"])
              }
              className="form-input"
            >
              <option value="SIGNED">Signed</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </Field>

          <Field label="Conflict check">
            <select
              value={form.conflictCheckStatus}
              onChange={(event) =>
                updateField(
                  "conflictCheckStatus",
                  event.target.value as ClientPayload["conflictCheckStatus"]
                )
              }
              className="form-input"
            >
              <option value="CLEAR">Clear</option>
              <option value="ESCALATE">Escalate</option>
              <option value="DECLINED">Declined</option>
            </select>
          </Field>

          <label className="flex items-center gap-3 rounded-md border border-black/10 bg-wheat px-4 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.portalActive}
              onChange={(event) => updateField("portalActive", event.target.checked)}
              className="h-4 w-4 accent-coral"
            />
            Client portal active
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to={clientId ? `/app/clients/${clientId}` : "/app/clients"}
            className="inline-flex items-center justify-center rounded-md border border-black/10 px-4 py-2 text-sm font-semibold hover:border-coral hover:text-coral"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Save size={16} />
            {mutation.isPending ? "Saving..." : "Save client"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}


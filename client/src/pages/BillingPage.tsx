import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, DollarSign, Receipt, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export function BillingPage() {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.invoices
  });

  const paymentMutation = useMutation({
    mutationFn: (invoiceId: string) => api.payInvoice(invoiceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["matters"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    }
  });

  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== "PAID")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const sentCount = invoices.filter((invoice) => invoice.status === "SENT").length;

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        description="Agency-wide invoice and payment status, backed by real Prisma invoice and payment records."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          helper="Draft, sent, and overdue invoices"
          icon={WalletCards}
        />
        <MetricCard
          label="Paid"
          value={`$${totalPaid.toLocaleString()}`}
          helper="Captured through mock Stripe flow"
          icon={DollarSign}
        />
        <MetricCard
          label="Sent invoices"
          value={String(sentCount)}
          helper="Ready for payment follow-up"
          icon={Receipt}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Invoices</h2>
            <p className="mt-1 text-sm text-ink/55">
              Create invoices from a matter workspace, then collect payment here or from the matter.
            </p>
          </div>
          <Link
            to="/app/matters"
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
          >
            Create from matter
          </Link>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-ink/60">Loading invoices...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-wheat text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Matter</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{invoice.number}</p>
                      <p className="text-xs text-ink/50">
                        Subtotal ${invoice.subtotal.toLocaleString()} · tax ${invoice.tax.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">{invoice.clientName}</td>
                    <td className="px-5 py-4">
                      <Link to={`/app/matters/${invoice.matterId}`} className="font-semibold hover:text-coral">
                        {invoice.matterTitle}
                      </Link>
                      <p className="text-xs text-ink/50">Subclass {invoice.visaSubclass}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold">${invoice.amount.toLocaleString()}</td>
                    <td className="px-5 py-4">{invoice.dueOn}</td>
                    <td className="px-5 py-4">
                      {invoice.latestPayment ? (
                        <div>
                          <p className="font-semibold">{invoice.latestPayment.provider}</p>
                          <p className="text-xs text-ink/50">{invoice.latestPayment.status}</p>
                        </div>
                      ) : (
                        <span className="text-ink/45">No payment</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-5 py-4">
                      {invoice.status !== "PAID" ? (
                        <button
                          type="button"
                          disabled={paymentMutation.isPending}
                          onClick={() => paymentMutation.mutate(invoice.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CreditCard size={14} />
                          Mock pay
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


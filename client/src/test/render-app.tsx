import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { CurrentUserProvider } from "../state/current-user";
import type { AppUser } from "../types";

export const roleUsers: AppUser[] = [
  {
    id: "user-rma",
    name: "Daniel Cho",
    title: "Registered Migration Agent",
    role: "RMA",
    description: "Reviews matters, verifies documents, and monitors lodgement readiness."
  },
  {
    id: "user-finance",
    name: "Oliver Stone",
    title: "Finance Officer",
    role: "FINANCE",
    description: "Creates invoices, tracks payments, and reviews revenue."
  },
  {
    id: "user-client",
    name: "John Smith",
    title: "Client Portal User",
    role: "CLIENT",
    description: "Uploads documents, sends messages, and pays invoices."
  }
];

export function renderApp(ui: React.ReactElement, route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <CurrentUserProvider>{ui}</CurrentUserProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function storeCurrentUser(user: AppUser) {
  localStorage.setItem("asun-current-user", JSON.stringify(user));
}

export function mockFetchJson(data: unknown) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ data })
  } as Response);
}

export function mockApiRoutes(routes: Record<string, unknown>) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    const pathname = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0] ?? url;

    if (!(pathname in routes)) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: "API_404",
            message: `No mocked route for ${pathname}`
          }
        })
      } as Response;
    }

    return {
      ok: true,
      json: async () => ({ data: routes[pathname] })
    } as Response;
  });
}

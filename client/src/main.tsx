import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { DemoUserProvider } from "./state/demo-user";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DemoUserProvider>
          <App />
        </DemoUserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);


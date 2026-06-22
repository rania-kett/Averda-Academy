import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import type { EmpUser, AdminUser } from "@/context/AuthContext";

type Options = {
  route?: string;
  authUser?: EmpUser | AdminUser | null;
} & Omit<RenderOptions, "wrapper">;

function TestProviders({
  children,
  route = "/",
}: {
  children: ReactNode;
  route?: string;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = "/", ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => <TestProviders route={route}>{children}</TestProviders>,
    ...renderOptions,
  });
}

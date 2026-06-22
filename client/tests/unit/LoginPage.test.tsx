import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "@/pages/employee/LoginPage";
import { renderWithProviders } from "../helpers/renderWithProviders";

const mockNavigate = vi.fn();
const mockSetEmployeeSession = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    state: { kind: "none" as const },
    setEmployeeSession: mockSetEmployeeSession,
    setAdminSession: vi.fn(),
    updateEmployeeUser: vi.fn(),
    refreshMe: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/api/api", () => ({
  authApi: {
    login: vi.fn(),
  },
}));

import { authApi } from "@/api/api";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders employee ID field and PIN keypad", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/employee|matricule|رقم/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });

  it("shows validation state when submitting incomplete credentials", async () => {
    renderWithProviders(<LoginPage />);
    const submit = screen.getByRole("button", { name: /login|connexion|دخول/i });
    expect(submit).toBeDisabled();
  });

  it("successful login navigates to /home", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        accessToken: "tok",
        refreshToken: "ref",
        user: {
          id: "u1",
          employeeId: "AV000001",
          name: "Test",
          role: "EMPLOYEE",
          language: "AR",
          avatarColor: "#000",
        },
      },
    } as never);

    renderWithProviders(<LoginPage />);
    const idInput = screen.getByLabelText(/employee|matricule|رقم/i);
    await userEvent.clear(idInput);
    await userEvent.type(idInput, "AV000001");
    for (const d of ["1", "2", "3", "4"]) {
      await userEvent.click(screen.getByRole("button", { name: d }));
    }
    const submit = screen.getByRole("button", { name: /login|connexion|دخول/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith("AV000001", "1234");
      expect(mockSetEmployeeSession).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
    });
  });

  it("wrong PIN shows error message", async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { status: 401 } });
    renderWithProviders(<LoginPage />);
    const idInput = screen.getByLabelText(/employee|matricule|رقم/i);
    await userEvent.type(idInput, "AV000001");
    for (const d of ["9", "9", "9", "9"]) {
      await userEvent.click(screen.getByRole("button", { name: d }));
    }
    const submit = screen.getByRole("button", { name: /login|connexion|دخول/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("PIN is masked (dots shown instead of digits)", async () => {
    renderWithProviders(<LoginPage />);
    for (const d of ["1", "2", "3", "4"]) {
      await userEvent.click(screen.getByRole("button", { name: d }));
    }
    expect(screen.getAllByText("●")).toHaveLength(4);
  });
});

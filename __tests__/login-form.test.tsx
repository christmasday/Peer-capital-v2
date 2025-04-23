import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LoginForm } from "@/components/login-form"
import { signIn } from "@/lib/actions/auth"
import { storeJWT } from "@/lib/jwt-client"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock("@/lib/actions/auth", () => ({
  signIn: jest.fn(),
}))

jest.mock("@/lib/jwt-client", () => ({
  storeJWT: jest.fn(),
}))

// Mock window.location
const originalLocation = window.location
beforeAll(() => {
  delete window.location
  window.location = { href: "" } as any
})

afterAll(() => {
  window.location = originalLocation
})

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
    Object.defineProperty(document, "cookie", {
      value: "",
      writable: true,
    })
  })

  it("renders the login form correctly", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it("handles form submission correctly on success", async () => {
    // Mock successful sign in
    const mockUser = { id: "user-123" }
    const mockJwt = "jwt-token-123"
    ;(signIn as jest.Mock).mockResolvedValue({
      success: true,
      user: mockUser,
      jwt: mockJwt,
    })

    render(<LoginForm />)

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    })

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    // Wait for the form submission to complete
    await waitFor(() => {
      // Verify signIn was called with correct data
      expect(signIn).toHaveBeenCalled()
      const formData = (signIn as jest.Mock).mock.calls[0][0]
      expect(formData.get("email")).toBe("test@example.com")
      expect(formData.get("password")).toBe("password123")

      // Verify JWT was stored
      expect(storeJWT).toHaveBeenCalledWith(mockJwt)

      // Verify localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith("auth_bypass", "true")
      expect(window.localStorage.setItem).toHaveBeenCalledWith("user_email", "test@example.com")
      expect(window.localStorage.setItem).toHaveBeenCalledWith("user_id", "user-123")
      expect(window.localStorage.setItem).toHaveBeenCalledWith("is_authenticated", "true")

      // Verify redirect
      expect(window.location.href).toBe("/home?auth=direct")
    })
  })

  it("displays error message on failed login", async () => {
    // Mock failed sign in
    ;(signIn as jest.Mock).mockResolvedValue({
      error: "Invalid login credentials",
    })

    render(<LoginForm />)

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong-password" },
    })

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument()
    })

    // Verify no redirect happened
    expect(window.location.href).not.toBe("/home?auth=direct")
  })

  it("handles unexpected errors during login", async () => {
    // Mock signIn to throw an error
    ;(signIn as jest.Mock).mockRejectedValue(new Error("Network error"))

    render(<LoginForm />)

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    })

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument()
      expect(screen.getByText(/error: network error/i)).toBeInTheDocument()
    })
  })
})

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { signIn } from "../../lib/auth";
import { useAuth } from "../../contexts/AuthContext";
import { roleHomePath } from "../../routes/roleHomePath";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["administrator", "medical_staff", "student", "lecturer"], {
    errorMap: () => ({ message: "Select your role" }),
  }),
});

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "lecturer", label: "Lecturer" },
  { value: "medical_staff", label: "Medical Staff" },
  { value: "administrator", label: "Administrator" },
];

export default function Login() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { profile } = await signIn({
        email: values.email,
        password: values.password,
        expectedRole: values.role,
      });
      await refreshProfile();
      toast.success(`Welcome back, ${profile.full_name.split(" ")[0]}`);
      const redirectTo = location.state?.from?.pathname || roleHomePath(profile.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not sign in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clinic-500 text-lg font-display font-semibold text-white">
            AA
          </div>
          <h1 className="font-display text-2xl font-semibold text-clinic-900 dark:text-white">
            AAUA Health Management System
          </h1>
          <p className="mt-1 text-sm text-clinic-500">Adekunle Ajasin University Clinic — Ibadan Campus</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="role">
              I am logging in as
            </label>
            <select id="role" className="input-field" {...register("role")}>
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-clay-600">{errors.role.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@aaua.edu.ng"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-clay-600">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-clinic-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-clay-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-clinic-500">
          New to the clinic system?{" "}
          <Link to="/signup" className="font-medium text-clinic-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

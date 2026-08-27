import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signUp } from "../../lib/auth";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    role: z.enum(["student", "lecturer", "medical_staff", "administrator"], {
      errorMap: () => ({ message: "Select a role" }),
    }),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "lecturer", label: "Lecturer" },
  { value: "medical_staff", label: "Medical Staff" },
  { value: "administrator", label: "Administrator (requires approval)" },
];

export default function Signup() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
      });
      toast.success("Account created. Check your email to confirm, then finish your profile.");
      // The `profiles` row now exists (via the DB trigger); role-specific
      // fields (matric number, department, etc.) are collected next.
      navigate("/complete-profile", { state: { role: values.role } });
    } catch (err) {
      toast.error(err.message || "Could not create account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 py-10 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-clinic-900 dark:text-white">
            Create your clinic account
          </h1>
          <p className="mt-1 text-sm text-clinic-500">AAUA Health Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="input-field" {...register("fullName")} />
            {errors.fullName && <p className="mt-1 text-xs text-clay-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="role">Role</label>
            <select id="role" className="input-field" {...register("role")}>
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-clay-600">{errors.role.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="input-field" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-clay-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input-field" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-clay-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" className="input-field" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-clay-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-clinic-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-clinic-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { updatePassword } from "../../lib/auth";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not update password. The reset link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-clinic-900 dark:text-white">
          Choose a new password
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="password">New password</label>
            <input id="password" type="password" className="input-field" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-clay-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" type="password" className="input-field" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-clay-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

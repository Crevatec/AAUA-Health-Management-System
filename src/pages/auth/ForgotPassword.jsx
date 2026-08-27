import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { requestPasswordReset } from "../../lib/auth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message || "Could not send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-clinic-900 dark:text-white">
          Reset your password
        </h1>

        {sent ? (
          <div className="card text-center">
            <p className="text-sm text-clinic-700 dark:text-clinic-200">
              If an account exists for that email, a reset link has been sent. Check your inbox.
            </p>
            <Link to="/login" className="btn-secondary mt-4 inline-flex">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className="input-field" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-clay-600">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending…" : "Send reset link"}
            </button>
            <Link to="/login" className="block text-center text-sm text-clinic-500 hover:underline">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

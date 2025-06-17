"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initiatePasswordReset } from "@/lib/actions/auth.action";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await initiatePasswordReset(email);

      if (result.success) {
        toast.success("Password reset email sent. Please check your inbox.");
        router.push("/sign-in");
      } else {
        toast.error(result.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to initiate password reset");
    }

    setIsLoading(false);
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <h3 className="text-center">Reset Your Password</h3>
        <p className="text-center text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your registered email"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center">
          Remember your password?{" "}
          <Link href="/sign-in" className="font-bold text-user-primary">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
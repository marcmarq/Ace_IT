"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { completePasswordReset } from "@/lib/actions/auth.action";
import Link from "next/link";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!oobCode) {
      toast.error("Invalid reset link");
      router.push("/forgot-password");
    }
  }, [oobCode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }

      if (!oobCode) {
        toast.error("Invalid reset link");
        router.push("/forgot-password");
        return;
      }

      const result = await completePasswordReset(oobCode, newPassword);

      if (result.success) {
        toast.success("Password reset successfully");
        router.push("/sign-in");
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!oobCode) {
    return null;
  }

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <h3 className="text-center">Reset Your Password</h3>
        <p className="text-center text-muted-foreground">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-2 border rounded"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-2 border rounded"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
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
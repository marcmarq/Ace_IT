"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendResetOtp } from "@/lib/actions/auth.action";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await sendResetOtp(email);

    if (result?.success) {
      toast.success("OTP sent to your email");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } else {
      toast.error(result?.message || "Failed to send OTP");
    }

    setIsLoading(false);
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={32} />
          <h2 className="text-primary-100">AceIT</h2>
        </div>
        <h3>Reset Your Password</h3>

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
            {isLoading ? "Sending..." : "Send OTP"}
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
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  console.log("Auth Layout - User:", user ? "Found" : "Not Found");

  if (user) {
    console.log("Auth Layout - Redirecting to home");
    redirect("/");
  }
  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;

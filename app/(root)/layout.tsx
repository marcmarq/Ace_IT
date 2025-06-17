import { getCurrentUser } from "@/lib/actions/auth.action";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  console.log("Root Layout - User:", user ? "Found" : "Not Found");

  if (!user) {
    console.log("Root Layout - Redirecting to sign-in");
    redirect("/sign-in");
  }

  return (
    <div className="root-layout">
      <Navbar />
      {children}
    </div>
  );
};

export default RootLayout;

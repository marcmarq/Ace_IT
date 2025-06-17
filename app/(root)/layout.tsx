import { getCurrentUser } from "@/lib/actions/auth.action";
import Image from "next/image";
import Link from "next/link";
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
      <nav>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Logo.png" alt="logo" width={88} height={82} />
          <h2>AceIT</h2>
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default RootLayout;

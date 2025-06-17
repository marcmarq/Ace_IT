"use client";

import { LogoutButton } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center w-full">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/Logo.png" alt="logo" width={88} height={82} />
        <h2>AceIT</h2>
      </Link>
      <LogoutButton />
    </nav>
  );
};

export default Navbar; 
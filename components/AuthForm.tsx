"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import FormField from "./FormField";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.action";
import MFASetup from "./MFASetup";

const AuthFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const formSchema = AuthFormSchema(type);
  const [showMFA, setShowMFA] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === "sign-up") {
        const { name, email, password } = values;

        const userCredentials = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredentials.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account Created Successfully");
        router.push("/sign-in");
      } else {
        const { email, password } = values;
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const idToken = await userCredential.user.getIdToken();

        if (!idToken) {
          toast.error("Sign in failed");
          return;
        }

        const signInResult = await signIn({
          email,
          idToken,
        });

        if (signInResult.requiresMFA) {
          setCurrentUser(userCredential.user);
          setShowMFA(true);
          return;
        }

        if (!signInResult.success) {
          toast.error(signInResult.message);
          return;
        }

        toast.success("Signed In");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  }

  async function handleGoogleAuth() {
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      prompt: 'select_account', 
      login_hint: '', 
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      if (!idToken) {
        toast.error("Google Sign in failed");
        return;
      }

      if (type === "sign-up") {
        const res = await signUp({
          uid: user.uid,
          name: user.displayName || "Google User",
          email: user.email!,
          password: "", 
        });

        if (!res?.success) {
          toast.error(res.message);
          return;
        }

        await signIn({
          email: user.email!,
          idToken,
        });

        toast.success("Account Created via Google");
        router.push("/");
      } else {
        await signIn({
          email: user.email!,
          idToken,
        });
        toast.success("Signed in with Google");
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      
      
      let errorMessage = "Google Authentication failed";
      if (error instanceof Error) {
        if (error.message.includes("popup-closed-by-user")) {
          errorMessage = "Sign in window was closed";
        } else if (error.message.includes("account-exists-with-different-credential")) {
          errorMessage = "Account already exists with different method";
        }
      }
      
      toast.error(errorMessage);
    }
  }

  const handleMFAComplete = () => {
    setShowMFA(false);
    toast.success("MFA setup complete");
    router.push("/");
  };

  const isSignIn = type === "sign-in";

  if (showMFA) {
    return (
      <div className="card-border lg:min-w-[566px]">
        <div className="flex flex-col gap-6 card py-14 px-10">
          <MFASetup userId={currentUser.uid} onComplete={handleMFAComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <h2 className="text-primary-100">AceIT</h2>
        </div>
        <h3>Practice, Perfect, Ace Your Interview with AceIT!</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
              />
            )}
            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your Email Address"
              type="email"
            />
            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter Your Password"
              type="password"
            />
            <Button className="btn" type="submit">
              {isSignIn ? "Sign in" : "Create An Account"}
            </Button>
          </form>
        </Form>

        <Button
          variant="outline"
          className="btn"
          onClick={handleGoogleAuth}
        >
          {isSignIn ? "Sign in with Google" : "Sign up with Google"}
        </Button>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Already have an account?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="text-center text-sm text-primary-500 hover:text-primary-600 hover:underline cursor-pointer"
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

export default AuthForm;

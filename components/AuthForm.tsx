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
import { signIn, signUp, signInWithGoogle } from "@/lib/actions/auth.action";

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
        window.location.href = "/sign-in";
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

        if (!signInResult.success) {
          toast.error(signInResult.message);
          return;
        }

        toast.success("Signed In");
        window.location.href = "/";
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  }

  async function handleGoogleAuth() {
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      if (!idToken) {
        toast.error("Google Sign in failed");
        return;
      }

      // For both sign-up and sign-in, we'll use signInWithGoogle
      const signInResult = await signInWithGoogle(idToken);

      if (!signInResult.success) {
        toast.error(signInResult.message || "Failed to authenticate with Google");
        return;
      }

      toast.success(type === "sign-up" ? "Account Created via Google" : "Signed in with Google");
      window.location.href = "/";
    } catch (error) {
      console.error("Google auth error:", error);
      
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

  const isSignIn = type === "sign-in";

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
            {isSignIn && (
              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600 hover:underline block text-right"
              >
                Forgot Password?
              </Link>
            )}
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
      </div>
    </div>
  );
};

export default AuthForm;

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
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp, signInWithGoogle } from "@/lib/actions/auth.action";

// Declare recaptchaVerifier on window
declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

const AuthFormSchema = (type: FormType) => {
  return z.object({
    firstName: type === "sign-up" ? z.string().min(1, "First name is required") : z.string().optional(),
    lastName: type === "sign-up" ? z.string().min(1, "Last name is required") : z.string().optional(),
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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const [showVerifyNotice, setShowVerifyNotice] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [checkError, setCheckError] = useState("");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === "sign-up") {
        const { firstName, lastName, email, password } = values;
        // 1. Create user
        const userCredentials = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        // 2. Send email verification
        await sendEmailVerification(userCredentials.user);
        setShowVerifyNotice(true);
        setPendingUser(userCredentials.user);
        toast.success("Account created! Please check your email to verify your account.");
        return;
      } else {
        const { email, password } = values;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.emailVerified) {
          setShowVerifyNotice(true);
          setPendingUser(user);
          toast.error("Please verify your email before signing in.");
          return;
        }
        const idToken = await user.getIdToken();
        if (!idToken) {
          toast.error("Sign in failed");
          return;
        }
        const signInResult = await signIn({
          email: String(form.getValues('email')),
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

  async function handleResendVerification() {
    if (!pendingUser) return;
    setResendLoading(true);
    setResendError("");
    try {
      await sendEmailVerification(pendingUser);
      toast.success("Verification email resent!");
    } catch (error) {
      setResendError("Failed to resend verification email.");
    } finally {
      setResendLoading(false);
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

  async function handleCheckVerification() {
    if (!pendingUser) return;
    setCheckingVerification(true);
    setCheckError("");
    try {
      await pendingUser.reload();
      if (pendingUser.emailVerified) {
        // Create user record in DB after verification
        const result = await signUp({
          uid: pendingUser.uid,
          firstName: form.getValues('firstName') || '',
          lastName: form.getValues('lastName') || '',
          email: form.getValues('email') || '',
          password: form.getValues('password') || '',
        });
        console.log('signUp result:', result);
        if (!result?.success) {
          setCheckError(result?.message || 'Failed to create user record.');
          return;
        }
        toast.success("Email verified! Redirecting...");
        window.location.href = "/";
      } else {
        setCheckError("Email is still not verified. Please check your inbox and click the verification link.");
      }
    } catch (error) {
      setCheckError("Failed to check verification status.");
    } finally {
      setCheckingVerification(false);
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
              <>
                <FormField
                  control={form.control}
                  name="firstName"
                  label="First Name"
                  placeholder="Your First Name"
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  label="Last Name"
                  placeholder="Your Last Name"
                />
              </>
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

        {showVerifyNotice && (
          <div className="mt-4 p-4 border border-yellow-400 bg-yellow-50 rounded">
            <p className="mb-2">A verification email has been sent to your email address. Please verify your email to continue.</p>
            <Button className="btn" onClick={handleResendVerification} disabled={resendLoading}>
              {resendLoading ? "Resending..." : "Resend Verification Email"}
            </Button>
            <Button className="btn ml-2" onClick={handleCheckVerification} disabled={checkingVerification}>
              {checkingVerification ? "Checking..." : "I've verified my email"}
            </Button>
            {resendError && <p className="text-red-500 mt-2">{resendError}</p>}
            {checkError && <p className="text-red-500 mt-2">{checkError}</p>}
          </div>
        )}

        <div id="recaptcha-container"></div>

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

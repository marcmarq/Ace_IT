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
        toast.success("Account created! Please verify your email to continue.");
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
          toast.error("Sign in failed. Please check your credentials and try again.");
          return;
        }
        const signInResult = await signIn({
          email: String(form.getValues('email')),
          idToken,
        });
        if (!signInResult.success) {
          toast.error(`Sign in failed: ${signInResult.message}`);
          return;
        }
        toast.success("Signed in successfully!");
        window.location.href = "/";
      }
    } catch (error) {
      console.log(error);
      // Show a more specific error if available
      if (error && typeof error === "object" && "message" in error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred during sign in. Please try again.");
      }
    }
  }

  async function handleResendVerification() {
    if (!pendingUser) return;
    setResendLoading(true);
    setResendError("");
    try {
      await sendEmailVerification(pendingUser);
      toast.success("Verification email sent again! Please check your inbox.");
    } catch (error) {
      setResendError("Unable to resend verification email. Please try again.");
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
        toast.error("Google sign-in failed. Please try again.");
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
          errorMessage = "Google sign-in was cancelled.";
        } else if (error.message.includes("account-exists-with-different-credential")) {
          errorMessage = "An account already exists with a different sign-in method.";
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
        setCheckError("Your email is not verified yet. Please check your inbox.");
      }
    } catch (error) {
      setCheckError("Could not check verification status. Please try again.");
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-full max-w-md bg-white border border-yellow-300 rounded-lg shadow-lg p-6 flex flex-col items-center relative">
              <div className="bg-green-100 rounded-full p-3 mb-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-yellow-700">Verify Your Email Address</h4>
              <p className="mb-2 text-center text-gray-700">
                We've sent a verification email to <span className="font-semibold">{form.getValues('email')}</span>.<br/>
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="mb-4 text-sm text-gray-500 text-center">If you don't see the email, check your spam or junk folder.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button className="btn w-full sm:w-auto" onClick={handleResendVerification} disabled={resendLoading}>
                  {resendLoading ? "Resending..." : "Resend Verification Email"}
                </Button>
                <Button className="btn w-full sm:w-auto" onClick={handleCheckVerification} disabled={checkingVerification}>
                  {checkingVerification ? "Checking..." : "I've verified my email"}
                </Button>
              </div>
              {resendError && <p className="text-red-500 mt-3 text-center">{resendError}</p>}
              {checkError && <p className="text-red-500 mt-1 text-center">{checkError}</p>}
            </div>
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

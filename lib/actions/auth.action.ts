"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { sendOtpEmail } from "@/lib/nodemailer";
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {app} from "@/firebase/client"


const ONE_WEEK = 60 * 60 * 24 * 7

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    const userRecord = await db.collection("users").doc(uid).get();

    if (userRecord.exists) {
      return {
        success: false,
        message: "User already exists. Please sign in instead.",
      };
    }

    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message: 'Account created successfully. Please sign in'
    }
  } catch (e: any) {
    console.error("Error creating a user", e);

    if (e.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use.",
      };
    }

    return {
      success: false,
      message: "Failed to create an account",
    };  
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {
        success: false,
        message: 'User does not exist, Create an account instead'
      }
    }

    await setSessionCookie(idToken);
    
    return {
      success: true,
      message: 'Signed in successfully'
    }
  } catch (e) {
    console.log(e);

    return {
      success: false,
      message: 'Failed to log in into an account'
    }
  }
}


export async function signInWithGoogle(idToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("Google sign in - Decoded token:", decodedToken.uid);
    
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("Google sign in - Creating new user record");
      await userRef.set({
        name: decodedToken.name || "Google User",
        email: decodedToken.email,
        createdAt: new Date().toISOString(),
        id: decodedToken.uid // Add this to ensure id is set
      });
    } else {
      console.log("Google sign in - User record exists");
    }

    // Set session cookie
    await setSessionCookie(idToken);

    return { success: true };
  } catch (e: any) {
    console.error("Google sign-in error:", e);
    return {
      success: false,
      message: e.message || "Google authentication failed"
    };
  }
}


export async function setSessionCookie(idToken: string){
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {expiresIn: ONE_WEEK * 1000})

  cookieStore.set('session', sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: false, // Set to false for local development
    path: '/',
    sameSite: "lax"
  })
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie) {
      console.log("No session cookie found");
      return null;
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    console.log("Session cookie verified:", decodedClaims.uid);

    const userRecord = await db.collection('users').doc(decodedClaims.uid).get();

    if(!userRecord.exists) {
      console.log("No user record found for uid:", decodedClaims.uid);
      return null;
    }

    return{
      ... userRecord.data(), 
      id: userRecord.id, 
    } as User;
  } catch (e){
    console.error("Error in getCurrentUser:", e);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();

  return !!user; 
}

export async function sendResetOtp(email: string) {
  try {
    console.log('Starting OTP send for:', email);
    
    const userSnapshot = await db.collection("users")
      .where("email", "==", email.trim().toLowerCase())
      .get();

    console.log('User query results:', userSnapshot.size, 'matches');
    
    if (userSnapshot.empty) {
      console.error('No user found with email:', email);
      return { success: false, message: "User not found" };
    }

    const userDoc = userSnapshot.docs[0];
    console.log('Found user:', userDoc.id);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expireAt = Date.now() + 15 * 60 * 1000;

    console.log('Generated OTP:', otp);
    
    await userDoc.ref.update({
      resetOtp: otp,
      resetOtpExpireAt: expireAt, // Note: Fix typo if present in your code
    });

    console.log('Firestore updated, sending email...');
    await sendOtpEmail(email, otp);
    
    return { success: true, message: "OTP sent to email" };
  } catch (e) {
    console.error('Full OTP send error:', e);
    return { 
      success: false, 
      message: e instanceof Error ? e.message : "Failed to send OTP" 
    };
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).get();

    if (userSnapshot.empty) {
      return { success: false, message: "User not found" };
    }

    const userRef = userSnapshot.docs[0].ref;
    const userData = userSnapshot.docs[0].data();

    if (userData.resetOtp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }

    if (userData.resetOtpExpireAt < Date.now()) {
      return { success: false, message: "OTP expired" };
    }

    await auth.updateUser(userSnapshot.docs[0].id, {
      password: newPassword, 
    });

    await userRef.update({
      resetOtp: "",
      resetOtpExpireAt: 0,
    });

    return { success: true, message: "Password reset successfully" };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to reset password" };
  }
}

export async function enrollMFA(uid: string) {
  try {
    // Get the user record
    const userRecord = await auth.getUser(uid);

    // Check if MFA is already enabled
    if (userRecord.multiFactor.enrolledFactors.length > 0) {
      return {
        success: false,
        message: "MFA is already enabled for this account"
      };
    }

    // Update user document to mark MFA enrollment status
    await db.collection("users").doc(uid).update({
      mfaEnrollmentInProgress: true
    });

    return {
      success: true,
      message: "Ready for MFA enrollment"
    };
  } catch (e) {
    console.error("Error in MFA enrollment:", e);
    return {
      success: false,
      message: "Failed to start MFA enrollment"
    };
  }
}

export async function verifyMFA(params: { 
  uid: string;
  verificationId: string;
  verificationCode: string;
}) {
  try {
    const { uid, verificationId, verificationCode } = params;

    // Verify the MFA code
    await auth.verifyPhoneNumber({
      sessionInfo: verificationId,
      code: verificationCode,
    });

    // Update user document to confirm MFA enrollment
    await db.collection("users").doc(uid).update({
      mfaEnabled: true,
      mfaEnrollmentInProgress: false
    });

    return {
      success: true,
      message: "MFA verification successful"
    };
  } catch (e) {
    console.error("Error in MFA verification:", e);
    return {
      success: false,
      message: "Failed to verify MFA"
    };
  }
}

export async function disableMFA(uid: string) {
  try {
    // Get the user record
    const userRecord = await auth.getUser(uid);

    // Check if MFA is enabled
    if (userRecord.multiFactor.enrolledFactors.length === 0) {
      return {
        success: false,
        message: "MFA is not enabled for this account"
      };
    }

    // Disable MFA for the user
    await auth.updateUser(uid, {
      multiFactor: {
        enrolledFactors: []
      }
    });

    // Update user document
    await db.collection("users").doc(uid).update({
      mfaEnabled: false
    });

    return {
      success: true,
      message: "MFA disabled successfully"
    };
  } catch (e) {
    console.error("Error disabling MFA:", e);
    return {
      success: false,
      message: "Failed to disable MFA"
    };
  }
}



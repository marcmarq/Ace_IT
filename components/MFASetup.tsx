"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { enrollMFA, verifyMFA, disableMFA } from '@/lib/actions/auth.action';

interface MFASetupProps {
  userId: string;
  onComplete?: () => void;
}

export default function MFASetup({ userId, onComplete }: MFASetupProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnrollMFA = async () => {
    try {
      setLoading(true);
      const result = await enrollMFA(userId);

      if (result.success) {
        setIsEnrolling(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to start MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const result = await verifyMFA({
        uid: userId,
        verificationId,
        verificationCode,
      });

      if (result.success) {
        toast.success(result.message);
        onComplete?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to verify MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setLoading(true);
      const result = await disableMFA(userId);

      if (result.success) {
        toast.success(result.message);
        onComplete?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  if (!isEnrolling) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Multi-Factor Authentication</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable two-factor authentication to add an extra layer of security to your account.
        </p>
        <Button
          onClick={handleEnrollMFA}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Setting up...' : 'Enable MFA'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Verify MFA Setup</h2>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter verification code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={handleVerifyMFA}
          disabled={loading || !verificationCode}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsEnrolling(false)}
          disabled={loading}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
} 
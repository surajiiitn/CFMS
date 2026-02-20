import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, UserRound, Mail, LockKeyhole } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthLayout } from "@/components/layout/AuthLayout";

type Step = "info" | "otp" | "success";

const Register = () => {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { sendRegistrationOtp, verifyRegistrationOtp } = useAuth();
  const navigate = useNavigate();

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const requestOtp = async () => {
    const result = await sendRegistrationOtp(name, email, password);
    startCountdown(result.resendAfter);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await requestOtp();
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");

    if (otp.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await verifyRegistrationOtp(email, otp);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await requestOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (step === "otp") {
      return (
        <div className="space-y-6 text-center">
          <div>
            <h3 className="display-font text-xl font-semibold text-foreground">Verify your email</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleVerifyOTP} className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            {countdown > 0 ? (
              `Resend available in ${countdown}s`
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="font-semibold text-accent transition-colors hover:text-accent/80"
                disabled={loading}
              >
                Resend code
              </button>
            )}
          </p>
        </div>
      );
    }

    if (step === "success") {
      return (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <h3 className="display-font text-2xl font-semibold text-foreground">Account verified</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your CFMS account is ready. Continue to dashboard.</p>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSendOTP} className="space-y-5">
        {error ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">College Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP
            </>
          ) : (
            "Send Verification Code"
          )}
        </Button>
      </form>
    );
  };

  return (
    <AuthLayout
      title={step === "info" ? "Create your account" : step === "otp" ? "Email verification" : "All set"}
      subtitle={
        step === "info"
          ? "Join your campus marketplace as a freelancer or job poster."
          : step === "otp"
            ? "Secure your account by confirming your one-time code."
            : "You're ready to start using CFMS."
      }
      footer={
        step === "info" ? (
          <p className="text-center">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-accent transition-colors hover:text-accent/80">
              Sign in
            </Link>
          </p>
        ) : null
      }
    >
      {renderContent()}
    </AuthLayout>
  );
};

export default Register;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, GraduationCap, CheckCircle2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(interval);
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

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 auth-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-8">
            <GraduationCap className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">Join CFMS</h1>
          <p className="text-primary-foreground/70 text-lg">Start freelancing or posting micro-jobs within your campus community.</p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {step === "info" && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
                <p className="text-muted-foreground mt-1">Use your college email to get started</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-4">
                {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>College Email</Label>
                  <Input type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Use your official college email address</p>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Verify your email</h2>
                <p className="text-muted-foreground mt-1">We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></p>
              </div>
              {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  <button onClick={resendOtp} className="text-accent hover:underline font-medium" disabled={loading}>
                    Resend code
                  </button>
                )}
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">You&apos;re all set!</h2>
                <p className="text-muted-foreground mt-1">Your account has been verified successfully.</p>
              </div>
              <Button onClick={() => navigate("/dashboard")} className="w-full">Go to Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;

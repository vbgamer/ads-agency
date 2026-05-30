import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight, Chrome, User, Building2 } from "lucide-react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { categories } from "@/data/mockData";
import { CompanySignupForm } from "@/components/auth/CompanySignupForm";
import { UserSignupForm } from "@/components/auth/UserSignupForm";
import { useAuth } from "@/hooks/useAuth";
import { useHeroStats } from "@/hooks/useHeroStats";
import { formatIndianCurrency, formatCount } from "@/lib/utils";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userType, signIn, signUp, signUpCompany, isLoading: authLoading } = useAuth();
  const { data: stats } = useHeroStats();
  
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"user" | "company">("user");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [referralCode, setReferralCode] = useState("");
  
  // Capture referral code from URL and store in sessionStorage
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      sessionStorage.setItem("referralCode", refCode);
      setReferralCode(refCode);
    } else {
      // Check if there's a stored referral code
      const storedCode = sessionStorage.getItem("referralCode");
      if (storedCode) {
        setReferralCode(storedCode);
      }
    }
  }, [searchParams]);

  // Sync referral code state to sessionStorage
  useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem("referralCode", referralCode);
    } else {
      sessionStorage.removeItem("referralCode");
    }
  }, [referralCode]);
  const [loginTab, setLoginTab] = useState<"phone" | "email">("phone");
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  
  // Refs for auto-focus
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);
  
  // Track previous values to only focus on actual changes
  const prevAuthMode = useRef(authMode);
  const prevAccountType = useRef(accountType);
  const prevLoginTab = useRef(loginTab);
  const prevShowOtp = useRef(showOtp);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // User signup fields
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Company signup fields
  const [companyName, setCompanyName] = useState("");
  const [companyCategory, setCompanyCategory] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [companyBanner, setCompanyBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    // Wait for auth to fully load and userType to be determined
    if (user && !authLoading && userType !== null) {
      if (userType === 'company') {
        navigate('/brand/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [user, userType, authLoading, navigate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-switch to email tab when company is selected
  useEffect(() => {
    if (accountType === "company" && loginTab === "phone") {
      setLoginTab("email");
    }
  }, [accountType, loginTab]);

  // Auto-focus logic
  useEffect(() => {
    const authModeChanged = prevAuthMode.current !== authMode;
    const accountTypeChanged = prevAccountType.current !== accountType;
    const loginTabChanged = prevLoginTab.current !== loginTab;
    const showOtpChanged = prevShowOtp.current !== showOtp;

    prevAuthMode.current = authMode;
    prevAccountType.current = accountType;
    prevLoginTab.current = loginTab;
    prevShowOtp.current = showOtp;

    if (!authModeChanged && !accountTypeChanged && !loginTabChanged && !showOtpChanged) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const active = document.activeElement;
      const isTypingTarget =
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.getAttribute("contenteditable") === "true" ||
          active.closest("button[role='combobox']"));
      if (isTypingTarget) return;

      if (authMode === "signup") {
        if (accountType === "company") {
          companyNameRef.current?.focus();
        } else {
          userNameRef.current?.focus();
        }
      } else {
        if (loginTab === "phone" && accountType === "user") {
          if (showOtp) {
            otpInputRef.current?.focus();
          } else {
            phoneInputRef.current?.focus();
          }
        } else {
          emailInputRef.current?.focus();
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [authMode, accountType, loginTab, showOtp]);

  const handleCompanySignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !companyCategory || !companyEmail || !companyPassword || !logoPreview || !bannerPreview) {
      toast.error("Please fill in all required fields including logo and banner");
      return;
    }

    if (companyPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const pwStrength = evaluatePasswordStrength(companyPassword);
    if (!pwStrength.isAcceptable) {
      toast.error(
        `Password too weak. Missing: ${pwStrength.failedChecks.join(", ")}`
      );
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUpCompany(companyEmail, companyPassword, {
      name: companyName,
      category: companyCategory,
      logo_url: logoPreview,
      cover_url: bannerPreview,
    });

    if (error) {
      setIsLoading(false);
      toast.error(error.message || "Failed to create account");
      return;
    }

    setIsLoading(false);
    toast.success("Company account created successfully!");
    navigate("/brand/dashboard");
  };

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userEmail || !userPassword || !gender || !age || !country || !state || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (userPassword !== userConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const userPwStrength = evaluatePasswordStrength(userPassword);
    if (!userPwStrength.isAcceptable) {
      toast.error(
        `Password too weak. Missing: ${userPwStrength.failedChecks.join(", ")}`
      );
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      toast.error("Please enter a valid age (13-120)");
      return;
    }

    setIsLoading(true);
    
    // Use referral code from state (synced with sessionStorage)
    const referralCodeToUse = referralCode || undefined;
    
    const { error } = await signUp(userEmail, userPassword, {
      name: userName,
      phone: userPhone || undefined,
      gender,
      age,
      country,
      state,
      city,
    }, referralCodeToUse);

    if (error) {
      setIsLoading(false);
      toast.error(error.message || "Failed to create account");
      return;
    }

    // Clear referral code after successful signup
    sessionStorage.removeItem("referralCode");
    setReferralCode("");
    
    setIsLoading(false);
    toast.success("Account created successfully!");
    navigate("/user/dashboard");
  };

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Note: Phone OTP is not yet implemented with Supabase
    // For now, show a message to use email login
    toast.info("Phone login is coming soon. Please use email login for now.", {
      action: {
        label: "Use Email",
        onClick: () => setLoginTab("email"),
      },
    });
  };

  const handleVerifyOtp = () => {
    toast.info("Phone login is coming soon. Please use email login for now.");
    setLoginTab("email");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    const { error, userType: detectedType } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      if (error.message?.includes("Invalid login")) {
        toast.error("Invalid email or password. Please try again.", {
          action: {
            label: "Sign up",
            onClick: () => setAuthMode("signup"),
          },
        });
      } else {
        toast.error(error.message || "Login failed");
      }
      return;
    }

    setIsLoading(false);
    toast.success("Login successful!");
    
    if (detectedType === 'company') {
      navigate("/brand/dashboard");
    } else {
      navigate("/user/dashboard");
    }
  };

  const handleGoogleLogin = () => {
    toast.info("Google login is coming soon. Please use email/password for now.", {
      duration: 5000,
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-primary p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/icon-192.png" 
            alt="ADSSIMSIM Logo" 
            className="h-12 w-12 rounded-xl shadow-glow object-contain"
          />
          <span className="font-display text-2xl font-bold text-primary-foreground">
            ADSSIMSIM
          </span>
        </Link>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 font-display text-4xl font-bold leading-tight text-primary-foreground xl:text-5xl"
          >
            {accountType === "company" && authMode === "signup" 
              ? "Partner with us and grow your business"
              : "Start earning real cashback on every purchase"
            }
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-primary-foreground/80"
          >
            {accountType === "company" && authMode === "signup"
              ? `Join ${stats?.partnerBrands ?? 0}+ brands reaching customers through our platform.`
              : (stats?.totalUsers ?? 0) >= 1000
                ? `Join ${formatCount(stats?.totalUsers ?? 0)}+ smart shoppers who have earned ${formatIndianCurrency(stats?.cashbackPaid ?? 0)}+ in cashback rewards.`
                : "Join our growing community of smart shoppers earning real cashback rewards."
            }
          </motion.p>
        </div>

        <div className="flex gap-6 text-sm text-primary-foreground/60">
          <span>© 2025 ADSSIMSIM</span>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img 
              src="/icon-192.png" 
              alt="ADSSIMSIM Logo" 
              className="h-10 w-10 rounded-xl shadow-glow object-contain"
            />
            <span className="font-display text-xl font-bold">ADSSIMSIM</span>
          </Link>

          <Card variant="elevated" className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">
                {authMode === "signup" 
                  ? (accountType === "company" ? "Register Your Company" : "Create Account")
                  : "Welcome Back"
                }
              </CardTitle>
              <CardDescription>
                {authMode === "signup"
                  ? (accountType === "company" ? "Join our partner network and reach millions" : "Sign up to start earning cashback")
                  : `Sign in to continue ${accountType === "company" ? "growing your business" : "earning cashback"}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Account Type Selection */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("user")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      accountType === "user"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <User className="h-6 w-6" />
                    <span className="text-sm font-medium">User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("company")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      accountType === "company"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Building2 className="h-6 w-6" />
                    <span className="text-sm font-medium">Company</span>
                  </button>
                </div>
              </div>

              {/* Auth Mode Toggle */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      authMode === "login"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      authMode === "signup"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Signup Forms */}
              {authMode === "signup" ? (
                accountType === "company" ? (
                  <CompanySignupForm
                    onSubmit={handleCompanySignup}
                    isLoading={isLoading}
                    categories={categories}
                    logoPreview={logoPreview}
                    onLogoUpload={handleLogoUpload}
                    bannerPreview={bannerPreview}
                    onBannerUpload={handleBannerUpload}
                    companyNameRef={companyNameRef}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    companyCategory={companyCategory}
                    setCompanyCategory={setCompanyCategory}
                    companyEmail={companyEmail}
                    setCompanyEmail={setCompanyEmail}
                    companyPassword={companyPassword}
                    setCompanyPassword={setCompanyPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                  />
                ) : (
                  <UserSignupForm
                    onSubmit={handleUserSignup}
                    isLoading={isLoading}
                    userNameRef={userNameRef}
                    userName={userName}
                    setUserName={setUserName}
                    userEmail={userEmail}
                    setUserEmail={setUserEmail}
                    userPassword={userPassword}
                    setUserPassword={setUserPassword}
                    userConfirmPassword={userConfirmPassword}
                    setUserConfirmPassword={setUserConfirmPassword}
                    gender={gender}
                    setGender={setGender}
                    age={age}
                    setAge={setAge}
                    country={country}
                    setCountry={setCountry}
                    state={state}
                    setState={setState}
                    city={city}
                    setCity={setCity}
                    userPhone={userPhone}
                    setUserPhone={setUserPhone}
                    referralCode={referralCode}
                    setReferralCode={setReferralCode}
                  />
                )
              ) : (
                <>
                  {accountType === "company" ? (
                    // Company Login - Email only
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          ref={emailInputRef}
                          type="email"
                          placeholder="Enter your company email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="text-right">
                        <a
                          href="#"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Please wait..." : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    // User Login - Phone/Email tabs
                    <Tabs value={loginTab} onValueChange={(v) => setLoginTab(v as "phone" | "email")} className="w-full">
                      <TabsList className="mb-6 grid w-full grid-cols-2">
                        <TabsTrigger value="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="phone" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone Number</label>
                          <div className="flex gap-2">
                            <div className="flex h-11 w-20 items-center justify-center rounded-lg border-2 border-input bg-card text-sm font-medium">
                              +91
                            </div>
                            <Input
                              ref={phoneInputRef}
                              type="tel"
                              placeholder="Enter phone number"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              disabled={showOtp}
                            />
                          </div>
                        </div>

                        {showOtp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2"
                          >
                            <label className="text-sm font-medium">Enter OTP</label>
                            <Input
                              ref={otpInputRef}
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                              Didn't receive?{" "}
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => toast.info("OTP resent!")}
                              >
                                Resend OTP
                              </button>
                            </p>
                          </motion.div>
                        )}

                        <Button
                          className="w-full"
                          onClick={showOtp ? handleVerifyOtp : handleSendOtp}
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Please wait..."
                            : showOtp
                            ? "Verify & Login"
                            : "Send OTP"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TabsContent>

                      <TabsContent value="email">
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              ref={emailInputRef}
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                          <div className="text-right">
                            <a
                              href="#"
                              className="text-sm text-primary hover:underline"
                            >
                              Forgot password?
                            </a>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Please wait..." : "Sign In"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  )}

                </>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                  type="button"
                  onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  {authMode === "signup" ? "Sign in" : `Sign up as ${accountType === "company" ? "Company" : "User"}`}
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

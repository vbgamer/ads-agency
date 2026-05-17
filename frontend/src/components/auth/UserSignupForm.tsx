import * as React from "react";
import { ArrowRight, Gift, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sanitizeInput, isValidEmail } from "@/lib/sanitize";

type Props = {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;

  // Refs
  userNameRef?: React.Ref<HTMLInputElement>;

  // Fields
  userName: string;
  setUserName: (v: string) => void;

  userEmail: string;
  setUserEmail: (v: string) => void;

  userPassword: string;
  setUserPassword: (v: string) => void;

  userConfirmPassword: string;
  setUserConfirmPassword: (v: string) => void;

  gender: string;
  setGender: (v: string) => void;

  age: string;
  setAge: (v: string) => void;

  country: string;
  setCountry: (v: string) => void;

  state: string;
  setState: (v: string) => void;

  city: string;
  setCity: (v: string) => void;

  userPhone: string;
  setUserPhone: (v: string) => void;

  referralCode: string;
  setReferralCode: (v: string) => void;
};

export function UserSignupForm({
  onSubmit,
  isLoading,
  userNameRef,
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  userPassword,
  setUserPassword,
  userConfirmPassword,
  setUserConfirmPassword,
  gender,
  setGender,
  age,
  setAge,
  country,
  setCountry,
  state,
  setState,
  city,
  setCity,
  userPhone,
  setUserPhone,
  referralCode,
  setReferralCode,
}: Props) {
  const [emailError, setEmailError] = React.useState("");
  const [nameError, setNameError] = React.useState("");

  // Sanitize name on change
  const handleNameChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    if (sanitized !== value) {
      setNameError("Special characters and HTML tags are not allowed");
    } else {
      setNameError("");
    }
    setUserName(sanitized);
  };

  // Validate email on change
  const handleEmailChange = (value: string) => {
    setUserEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Sanitize text inputs
  const handleSanitizedInput = (value: string, setter: (v: string) => void) => {
    setter(sanitizeInput(value));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          ref={userNameRef}
          type="text"
          placeholder="Enter your full name"
          value={userName}
          onChange={(e) => handleNameChange(e.target.value)}
          autoComplete="name"
          maxLength={100}
          className={nameError ? "border-destructive" : ""}
        />
        {nameError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {nameError}
          </p>
        )}
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Email Address <span className="text-destructive">*</span>
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={userEmail}
          onChange={(e) => handleEmailChange(e.target.value)}
          autoComplete="email"
          maxLength={254}
          className={emailError ? "border-destructive" : ""}
        />
        {emailError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {emailError}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
        </label>
        <Input
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>

      {/* Referral Code */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Referral Code <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <Gift className="h-4 w-4 text-primary" />
        </div>
        <Input
          type="text"
          placeholder="Enter a friend's referral code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          autoComplete="off"
          maxLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Get a ₹50 wallet bonus when you subscribe to Premium!
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="Create a strong password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="Confirm your password"
          value={userConfirmPassword}
          onChange={(e) => setUserConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {/* Gender and Age Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Gender <span className="text-destructive">*</span>
          </label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Age <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            placeholder="Your age"
            min="13"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            inputMode="numeric"
            autoComplete="bday-year"
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Country <span className="text-destructive">*</span>
        </label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="india">India</SelectItem>
            <SelectItem value="usa">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="canada">Canada</SelectItem>
            <SelectItem value="australia">Australia</SelectItem>
            <SelectItem value="germany">Germany</SelectItem>
            <SelectItem value="france">France</SelectItem>
            <SelectItem value="japan">Japan</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* State and City Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            State <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="Your state"
            value={state}
            onChange={(e) => handleSanitizedInput(e.target.value, setState)}
            autoComplete="address-level1"
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            City <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="Your city"
            value={city}
            onChange={(e) => handleSanitizedInput(e.target.value, setCity)}
            autoComplete="address-level2"
            maxLength={100}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <a href="#" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}

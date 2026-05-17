import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Check, AlertCircle, Smartphone, Building2, Wallet, Bookmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedMethodCard } from "./SavedMethodCard";
import {
  useSavedPaymentMethods,
  useSavePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  detectCardBrand,
  getCardLastFour,
  createCardDisplayName,
  createUpiDisplayName,
  type SavedPaymentMethod,
} from "@/hooks/useSavedPaymentMethods";
import { useAuth } from "@/hooks/useAuth";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  title: string;
  description?: string;
  onPaymentComplete: (success: boolean, identifier: string, errorMessage?: string) => void;
}

type PaymentMethod = "card" | "upi" | "netbanking" | "wallet";
type PaymentStatus = "idle" | "processing" | "success" | "error";

interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
}

// Test scenarios
const TEST_CARDS = {
  SUCCESS: "4242424242424242",
  DECLINE: "4000000000000002",
  INSUFFICIENT: "4000000000009995",
};

const TEST_UPI = {
  SUCCESS: "success@upi",
  FAILURE: "failure@upi",
};

const BANKS = [
  { id: "sbi", name: "State Bank of India" },
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "axis", name: "Axis Bank" },
  { id: "kotak", name: "Kotak Mahindra Bank" },
  { id: "pnb", name: "Punjab National Bank" },
];

const WALLETS = [
  { id: "paytm", name: "Paytm" },
  { id: "phonepe", name: "PhonePe" },
  { id: "gpay", name: "Google Pay" },
  { id: "amazonpay", name: "Amazon Pay" },
];

const PAYMENT_METHODS = [
  { id: "card" as PaymentMethod, label: "Card", icon: CreditCard },
  { id: "upi" as PaymentMethod, label: "UPI", icon: Smartphone },
  { id: "netbanking" as PaymentMethod, label: "Net Banking", icon: Building2 },
  { id: "wallet" as PaymentMethod, label: "Wallet", icon: Wallet },
];

export function MockPaymentModal({
  isOpen,
  onClose,
  amount,
  currency = "₹",
  title,
  description,
  onPaymentComplete,
}: MockPaymentModalProps) {
  const { user, company } = useAuth();
  const isAuthenticated = !!(user || company);

  // Saved payment methods
  const { data: savedMethods = [], isLoading: loadingSaved } = useSavedPaymentMethods();
  const saveMethod = useSavePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefaultMethod = useSetDefaultPaymentMethod();

  const [selectedSavedMethod, setSelectedSavedMethod] = useState<SavedPaymentMethod | null>(null);
  const [saveThisMethod, setSaveThisMethod] = useState(false);
  const [useNewMethod, setUseNewMethod] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-select default saved method when modal opens
  useEffect(() => {
    if (isOpen && savedMethods.length > 0 && !selectedSavedMethod && !useNewMethod) {
      const defaultMethod = savedMethods.find((m) => m.is_default);
      if (defaultMethod) {
        setSelectedSavedMethod(defaultMethod);
      }
    }
  }, [isOpen, savedMethods, selectedSavedMethod, useNewMethod]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ").substring(0, 19) : "";
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails((prev) => ({
      ...prev,
      cardNumber: formatCardNumber(e.target.value),
    }));
    setSelectedSavedMethod(null); // Clear saved method selection when typing
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails((prev) => ({
      ...prev,
      expiry: formatExpiry(e.target.value),
    }));
  };

  const validateCard = () => {
    const cleanedNumber = cardDetails.cardNumber.replace(/\s/g, "");
    
    if (cleanedNumber.length !== 16) {
      return { valid: false, error: "Invalid card number" };
    }
    
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      return { valid: false, error: "Invalid expiry date" };
    }
    
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      return { valid: false, error: "Invalid CVV" };
    }
    
    if (cardDetails.name.trim().length < 2) {
      return { valid: false, error: "Please enter cardholder name" };
    }

    return { valid: true, error: null };
  };

  const validateUpi = () => {
    const upiRegex = /^[\w.-]+@[\w]+$/;
    if (!upiRegex.test(upiId)) {
      return { valid: false, error: "Invalid UPI ID format (e.g., yourname@upi)" };
    }
    return { valid: true, error: null };
  };

  const validateNetBanking = () => {
    if (!selectedBank) {
      return { valid: false, error: "Please select a bank" };
    }
    return { valid: true, error: null };
  };

  const validateWallet = () => {
    if (!selectedWallet) {
      return { valid: false, error: "Please select a wallet" };
    }
    return { valid: true, error: null };
  };

  const validateSavedMethod = () => {
    if (!selectedSavedMethod) {
      return { valid: false, error: "Please select a payment method" };
    }
    // For saved cards, still require CVV
    if (selectedSavedMethod.method_type === "card" && !/^\d{3,4}$/.test(cardDetails.cvv)) {
      return { valid: false, error: "Please enter CVV" };
    }
    return { valid: true, error: null };
  };

  const simulatePayment = async () => {
    let validation: { valid: boolean; error: string | null };
    let identifier: string;
    let shouldSaveMethod = false;

    // Check if using saved method
    if (selectedSavedMethod) {
      validation = validateSavedMethod();
      identifier = selectedSavedMethod.display_name;
    } else {
      switch (paymentMethod) {
        case "card":
          validation = validateCard();
          identifier = cardDetails.cardNumber.replace(/\s/g, "").slice(-4);
          shouldSaveMethod = saveThisMethod && isAuthenticated;
          break;
        case "upi":
          validation = validateUpi();
          identifier = upiId;
          shouldSaveMethod = saveThisMethod && isAuthenticated;
          break;
        case "netbanking":
          validation = validateNetBanking();
          identifier = BANKS.find(b => b.id === selectedBank)?.name || selectedBank;
          break;
        case "wallet":
          validation = validateWallet();
          identifier = WALLETS.find(w => w.id === selectedWallet)?.name || selectedWallet;
          break;
        default:
          validation = { valid: false, error: "Invalid payment method" };
          identifier = "";
      }
    }

    if (!validation.valid) {
      setErrorMessage(validation.error || "Validation failed");
      return;
    }

    setStatus("processing");
    setErrorMessage("");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check test scenarios based on payment method
    if (!selectedSavedMethod && paymentMethod === "card") {
      const cleanedNumber = cardDetails.cardNumber.replace(/\s/g, "");
      
      if (cleanedNumber === TEST_CARDS.DECLINE) {
        setStatus("error");
        setErrorMessage("Card declined. Please try a different card.");
        onPaymentComplete(false, identifier, "Card declined");
        return;
      }

      if (cleanedNumber === TEST_CARDS.INSUFFICIENT) {
        setStatus("error");
        setErrorMessage("Insufficient funds. Please try a different card.");
        onPaymentComplete(false, identifier, "Insufficient funds");
        return;
      }
    }

    if (!selectedSavedMethod && paymentMethod === "upi" && upiId.toLowerCase() === TEST_UPI.FAILURE) {
      setStatus("error");
      setErrorMessage("UPI payment failed. Please try again.");
      onPaymentComplete(false, identifier, "UPI payment failed");
      return;
    }

    // Save payment method if requested
    if (shouldSaveMethod) {
      try {
        if (paymentMethod === "card") {
          const brand = detectCardBrand(cardDetails.cardNumber);
          const lastFour = getCardLastFour(cardDetails.cardNumber);
          await saveMethod.mutateAsync({
            method_type: "card",
            display_name: createCardDisplayName(brand, lastFour),
            card_last_four: lastFour,
            card_brand: brand,
            card_expiry: cardDetails.expiry,
            is_default: savedMethods.length === 0,
          });
        } else if (paymentMethod === "upi") {
          await saveMethod.mutateAsync({
            method_type: "upi",
            display_name: createUpiDisplayName(upiId),
            upi_id: upiId,
            is_default: savedMethods.length === 0,
          });
        }
      } catch (error) {
        console.error("Failed to save payment method:", error);
        // Continue with payment success even if save fails
      }
    }

    // All other cases succeed
    setStatus("success");
    onPaymentComplete(true, identifier);
  };

  const handleClose = () => {
    if (status === "processing") return;
    setStatus("idle");
    setCardDetails({ cardNumber: "", expiry: "", cvv: "", name: "" });
    setUpiId("");
    setSelectedBank("");
    setSelectedWallet("");
    setErrorMessage("");
    setPaymentMethod("card");
    setSelectedSavedMethod(null);
    setSaveThisMethod(false);
    setUseNewMethod(false);
    onClose();
  };

  const handleSelectSavedMethod = (method: SavedPaymentMethod) => {
    setSelectedSavedMethod(method);
    setUseNewMethod(false);
    // Clear form inputs when selecting saved method
    setCardDetails({ cardNumber: "", expiry: "", cvv: "", name: "" });
    setUpiId("");
  };

  const handleDeleteSavedMethod = async (methodId: string) => {
    await deleteMethod.mutateAsync(methodId);
    if (selectedSavedMethod?.id === methodId) {
      setSelectedSavedMethod(null);
    }
  };

  const renderTestInfo = () => {
    switch (paymentMethod) {
      case "card":
        return (
          <>
            <p>• 4242 4242 4242 4242 - Success</p>
            <p>• 4000 0000 0000 0002 - Declined</p>
            <p>• 4000 0000 0000 9995 - Insufficient funds</p>
          </>
        );
      case "upi":
        return (
          <>
            <p>• success@upi - Success</p>
            <p>• failure@upi - Payment failed</p>
            <p>• Any valid UPI ID - Success</p>
          </>
        );
      case "netbanking":
        return <p>• All banks - Success (simulated redirect)</p>;
      case "wallet":
        return <p>• All wallets - Success (simulated authorization)</p>;
      default:
        return null;
    }
  };

  const renderSavedMethods = () => {
    if (!isAuthenticated || savedMethods.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Bookmark className="h-4 w-4" />
          Saved Payment Methods
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {savedMethods.map((method) => (
            <SavedMethodCard
              key={method.id}
              method={method}
              isSelected={selectedSavedMethod?.id === method.id}
              onSelect={() => handleSelectSavedMethod(method)}
              onDelete={() => handleDeleteSavedMethod(method.id)}
              onSetDefault={() => setDefaultMethod.mutate(method.id)}
              disabled={status === "processing"}
            />
          ))}
        </div>
        <Separator className="my-3" />
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            setSelectedSavedMethod(null);
            setUseNewMethod(true);
          }}
          disabled={status === "processing"}
        >
          <CreditCard className="h-4 w-4" />
          Pay with a new method
        </Button>
      </div>
    );
  };

  const renderPaymentForm = () => {
    // If saved method is selected, show minimal form (just CVV for cards)
    if (selectedSavedMethod) {
      if (selectedSavedMethod.method_type === "card") {
        return (
          <div className="space-y-3">
            <div className="bg-accent/50 rounded-lg p-3 text-sm">
              Using: <span className="font-medium">{selectedSavedMethod.display_name}</span>
            </div>
            <div>
              <Label htmlFor="cvv">Enter CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cvv: e.target.value.replace(/\D/g, "").substring(0, 4),
                  }))
                }
                disabled={status === "processing"}
                maxLength={4}
                type="password"
                className="max-w-[120px]"
              />
            </div>
          </div>
        );
      }
      return (
        <div className="bg-accent/50 rounded-lg p-3 text-sm">
          Using: <span className="font-medium">{selectedSavedMethod.display_name}</span>
        </div>
      );
    }

    switch (paymentMethod) {
      case "card":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) =>
                  setCardDetails((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={status === "processing"}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={cardDetails.cardNumber}
                onChange={handleCardNumberChange}
                disabled={status === "processing"}
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={handleExpiryChange}
                  disabled={status === "processing"}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      cvv: e.target.value.replace(/\D/g, "").substring(0, 4),
                    }))
                  }
                  disabled={status === "processing"}
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveCard"
                  checked={saveThisMethod}
                  onCheckedChange={(checked) => setSaveThisMethod(checked === true)}
                  disabled={status === "processing"}
                />
                <Label htmlFor="saveCard" className="text-sm font-normal cursor-pointer">
                  Save this card for faster checkout
                </Label>
              </div>
            )}
          </div>
        );

      case "upi":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setSelectedSavedMethod(null);
                }}
                disabled={status === "processing"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your UPI ID (e.g., name@paytm, 9876543210@ybl)
              </p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveUpi"
                  checked={saveThisMethod}
                  onCheckedChange={(checked) => setSaveThisMethod(checked === true)}
                  disabled={status === "processing"}
                />
                <Label htmlFor="saveUpi" className="text-sm font-normal cursor-pointer">
                  Save this UPI ID for faster checkout
                </Label>
              </div>
            )}
          </div>
        );

      case "netbanking":
        return (
          <div className="space-y-3">
            <div>
              <Label>Select Your Bank</Label>
              <Select
                value={selectedBank}
                onValueChange={setSelectedBank}
                disabled={status === "processing"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                You will be redirected to your bank's secure page
              </p>
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="space-y-3">
            <div>
              <Label>Select Wallet</Label>
              <Select
                value={selectedWallet}
                onValueChange={setSelectedWallet}
                disabled={status === "processing"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {WALLETS.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                You will be asked to authorize in your wallet app
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
            <p className="text-muted-foreground text-center mt-2">
              Your payment of {currency}{amount.toLocaleString()} has been processed.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}

            <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-xl font-bold text-foreground">
                {currency}{amount.toLocaleString()}
              </span>
            </div>

            {/* Saved Payment Methods */}
            {!loadingSaved && renderSavedMethods()}

            {/* Payment Method Selector - hide if saved method is selected */}
            {!selectedSavedMethod && (
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      disabled={status === "processing"}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      } ${status === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Payment Form */}
            {renderPaymentForm()}

            {errorMessage && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {errorMessage}
              </div>
            )}

            {!selectedSavedMethod && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Test Scenarios:</p>
                {renderTestInfo()}
              </div>
            )}

            <Button
              onClick={simulatePayment}
              disabled={status === "processing"}
              className="w-full"
            >
              {status === "processing" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay {currency}{amount.toLocaleString()}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Secured by Mock Payment Gateway (Test Mode)
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

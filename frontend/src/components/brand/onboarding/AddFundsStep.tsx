import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MockPaymentModal } from "@/components/payment/MockPaymentModal";
import { useCompanyWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

interface AddFundsStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

const suggestedAmounts = [
  { value: 5000, label: "₹5,000", description: "Great for testing" },
  { value: 10000, label: "₹10,000", description: "Popular choice" },
  { value: 25000, label: "₹25,000", description: "Best value" },
];

export function AddFundsStep({ onContinue, onSkip }: AddFundsStepProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10000);
  const [customAmount, setCustomAmount] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [fundsAdded, setFundsAdded] = useState(false);
  const { addFunds } = useCompanyWallet();

  const finalAmount = customAmount ? parseInt(customAmount) : selectedAmount;

  const handlePaymentComplete = async (success: boolean, cardLastFour: string, errorMessage?: string) => {
    if (success && finalAmount) {
      try {
        await addFunds(finalAmount);
        setFundsAdded(true);
        toast.success(`₹${finalAmount.toLocaleString()} added to your cashback pool!`);
        setTimeout(onContinue, 1500);
      } catch (error) {
        toast.error("Failed to add funds. Please try again.");
      }
    }
    setShowPayment(false);
  };

  const handleAddFunds = () => {
    if (!finalAmount || finalAmount < 1000) {
      toast.error("Minimum amount is ₹1,000");
      return;
    }
    setShowPayment(true);
  };

  if (fundsAdded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center max-w-md mx-auto"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Funds Added!</h2>
        <p className="text-muted-foreground">Moving to campaign creation...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center max-w-xl mx-auto"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Wallet className="h-8 w-8 text-primary" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-center">
        Fund Your Cashback Pool
      </h2>

      <p className="text-muted-foreground text-center mb-6">
        Add funds to reward customers who engage with your campaigns. You only pay when customers convert!
      </p>

      <Card className="w-full p-6 mb-6">
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-6">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your cashback pool funds customer rewards. When someone claims a deal, the cashback amount is deducted from your pool.
          </p>
        </div>

        <Label className="text-sm font-medium mb-3 block">Select an amount</Label>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {suggestedAmounts.map((amount) => (
            <button
              key={amount.value}
              onClick={() => {
                setSelectedAmount(amount.value);
                setCustomAmount("");
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedAmount === amount.value && !customAmount
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-bold text-foreground">{amount.label}</div>
              <div className="text-xs text-muted-foreground">{amount.description}</div>
            </button>
          ))}
        </div>

        <div className="relative">
          <Label htmlFor="customAmount" className="text-sm font-medium mb-2 block">
            Or enter custom amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input
              id="customAmount"
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="pl-8"
              min={1000}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Minimum ₹1,000</p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button 
          size="lg" 
          onClick={handleAddFunds} 
          className="flex-1"
          disabled={!finalAmount || finalAmount < 1000}
        >
          Add ₹{(finalAmount || 0).toLocaleString()} to Pool
        </Button>
        <Button variant="outline" size="lg" onClick={onSkip}>
          Add Later
        </Button>
      </div>

      <MockPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={finalAmount || 0}
        title="Add Funds to Cashback Pool"
        description="These funds will be used to reward customers who engage with your campaigns."
        onPaymentComplete={handlePaymentComplete}
      />
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Smartphone, 
  Loader2, 
  Trash2, 
  Edit2,
  Star,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  useSavedPaymentMethods, 
  useSavePaymentMethod, 
  useDeletePaymentMethod, 
  useSetDefaultPaymentMethod,
  useUpdatePaymentMethod,
  detectCardBrand,
  getCardLastFour,
  createCardDisplayName,
  createUpiDisplayName,
  type SavedPaymentMethod 
} from "@/hooks/useSavedPaymentMethods";

type AddMethodType = "card" | "upi" | null;

interface CardForm {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface UpiForm {
  upiId: string;
}

interface EditForm {
  displayName: string;
  cardExpiry: string;
}

export function BrandPaymentMethodsSection() {
  const { data: savedMethods, isLoading } = useSavedPaymentMethods();
  const savePaymentMethod = useSavePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();

  // Dialog states
  const [addMethodType, setAddMethodType] = useState<AddMethodType>(null);
  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<SavedPaymentMethod | null>(null);

  // Form states
  const [cardForm, setCardForm] = useState<CardForm>({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });
  const [upiForm, setUpiForm] = useState<UpiForm>({ upiId: "" });
  const [editForm, setEditForm] = useState<EditForm>({ displayName: "", cardExpiry: "" });

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Validation helpers
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  };

  const validateCard = (): boolean => {
    const cardDigits = cardForm.cardNumber.replace(/\s/g, "");
    if (cardDigits.length !== 16) {
      toast.error("Please enter a valid 16-digit card number");
      return false;
    }
    if (!cardForm.cardholderName.trim()) {
      toast.error("Please enter the cardholder name");
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
      toast.error("Please enter expiry in MM/YY format");
      return false;
    }
    const [month, year] = cardForm.expiry.split("/").map(Number);
    const now = new Date();
    const expDate = new Date(2000 + year, month - 1);
    if (expDate < now) {
      toast.error("Please enter a valid expiry date");
      return false;
    }
    if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      toast.error("Please enter a valid 3 or 4-digit CVV");
      return false;
    }
    return true;
  };

  const validateUpi = (): boolean => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiForm.upiId)) {
      toast.error("Please enter a valid UPI ID (e.g., user@bank)");
      return false;
    }
    return true;
  };

  const handleAddCard = async () => {
    if (!validateCard()) return;

    setIsSaving(true);
    try {
      const cardDigits = cardForm.cardNumber.replace(/\s/g, "");
      const brand = detectCardBrand(cardDigits);
      const lastFour = getCardLastFour(cardDigits);
      
      await savePaymentMethod.mutateAsync({
        method_type: "card",
        display_name: createCardDisplayName(brand, lastFour),
        card_last_four: lastFour,
        card_brand: brand,
        card_expiry: cardForm.expiry,
        is_default: savedMethods?.length === 0
      });

      setAddMethodType(null);
      setCardForm({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUpi = async () => {
    if (!validateUpi()) return;

    setIsSaving(true);
    try {
      await savePaymentMethod.mutateAsync({
        method_type: "upi",
        display_name: createUpiDisplayName(upiForm.upiId),
        upi_id: upiForm.upiId,
        is_default: savedMethods?.length === 0
      });

      setAddMethodType(null);
      setUpiForm({ upiId: "" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (method: SavedPaymentMethod) => {
    setEditingMethod(method);
    setEditForm({
      displayName: method.display_name,
      cardExpiry: method.card_expiry || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMethod) return;
    if (!editForm.displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    // Validate expiry if it's a card
    if (editingMethod.method_type === "card" && editForm.cardExpiry) {
      if (!/^\d{2}\/\d{2}$/.test(editForm.cardExpiry)) {
        toast.error("Please enter expiry in MM/YY format");
        return;
      }
    }

    setIsUpdating(true);
    try {
      await updatePaymentMethod.mutateAsync({
        id: editingMethod.id,
        display_name: editForm.displayName.trim(),
        card_expiry: editingMethod.method_type === "card" ? editForm.cardExpiry : undefined
      });
      setEditingMethod(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMethod) return;

    setIsDeleting(true);
    try {
      await deletePaymentMethod.mutateAsync(deletingMethod.id);
      setDeletingMethod(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    await setDefaultPaymentMethod.mutateAsync(methodId);
  };

  const getMethodIcon = (type: string) => {
    return type === "card" ? CreditCard : Smartphone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <p className="text-muted-foreground">
          Manage your saved cards and UPI IDs for faster wallet top-ups
        </p>
      </div>

      {/* Add New Method Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Method</CardTitle>
          <CardDescription>
            Save a new payment method for quick wallet top-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-2"
              onClick={() => setAddMethodType("card")}
            >
              <CreditCard className="h-6 w-6 text-primary" />
              <span>Add Card</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-2"
              onClick={() => setAddMethodType("upi")}
            >
              <Smartphone className="h-6 w-6 text-primary" />
              <span>Add UPI</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Methods List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Saved Methods ({savedMethods?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedMethods && savedMethods.length > 0 ? (
            <div className="space-y-3">
              {savedMethods.map((method, index) => {
                const Icon = getMethodIcon(method.method_type);
                return (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30 transition-all"
                  >
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{method.display_name}</span>
                        {method.is_default && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Star className="h-3 w-3" fill="currentColor" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.method_type === "card" 
                          ? `${method.card_brand} • Expires ${method.card_expiry}`
                          : `UPI ID: ${method.upi_id}`
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(method)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingMethod(method)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-muted">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No payment methods saved</h3>
              <p className="text-sm text-muted-foreground">
                Add a card or UPI ID to speed up your wallet top-ups
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={addMethodType === "card"} onOpenChange={(open) => !open && setAddMethodType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add New Card
            </DialogTitle>
            <DialogDescription>
              Enter your card details below. Your CVV is only used for verification and won't be stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                placeholder="Name on card"
                value={cardForm.cardholderName}
                onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number *</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry *</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="•••"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your card details are encrypted and securely stored. CVV is never saved.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMethodType(null)}>Cancel</Button>
            <Button onClick={handleAddCard} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add UPI Dialog */}
      <Dialog open={addMethodType === "upi"} onOpenChange={(open) => !open && setAddMethodType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Add UPI ID
            </DialogTitle>
            <DialogDescription>
              Enter your UPI ID to enable quick payments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID *</Label>
              <Input
                id="upiId"
                placeholder="yourname@bank"
                value={upiForm.upiId}
                onChange={(e) => setUpiForm({ upiId: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Enter your UPI ID in the format: username@bankname</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMethodType(null)}>Cancel</Button>
            <Button onClick={handleAddUpi} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add UPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={(open) => !open && setEditingMethod(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Payment Method
            </DialogTitle>
            <DialogDescription>
              Update your payment method details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display Name *</Label>
              <Input
                id="editDisplayName"
                placeholder="Payment method name"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </div>
            {editingMethod?.method_type === "card" && (
              <div className="space-y-2">
                <Label htmlFor="editExpiry">Expiry Date</Label>
                <Input
                  id="editExpiry"
                  placeholder="MM/YY"
                  value={editForm.cardExpiry}
                  onChange={(e) => setEditForm({ ...editForm, cardExpiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMethod(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMethod} onOpenChange={(open) => !open && setDeletingMethod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deletingMethod?.display_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

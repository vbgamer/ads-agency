import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SavedPaymentMethod {
  id: string;
  user_id: string | null;
  company_id: string | null;
  method_type: "card" | "upi";
  display_name: string;
  card_last_four: string | null;
  card_brand: string | null;
  card_expiry: string | null;
  upi_id: string | null;
  is_default: boolean;
  created_at: string;
}

export interface SavePaymentMethodInput {
  method_type: "card" | "upi";
  display_name: string;
  card_last_four?: string;
  card_brand?: string;
  card_expiry?: string;
  upi_id?: string;
  is_default?: boolean;
}

// Detect card brand from number
export function detectCardBrand(cardNumber: string): string {
  const num = cardNumber.replace(/\s/g, "");
  if (/^4/.test(num)) return "Visa";
  if (/^5[1-5]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6(?:011|5)/.test(num)) return "Discover";
  if (/^35/.test(num)) return "JCB";
  if (/^6[0-9]/.test(num)) return "RuPay";
  return "Card";
}

// Get last 4 digits of card
export function getCardLastFour(cardNumber: string): string {
  return cardNumber.replace(/\s/g, "").slice(-4);
}

// Create display name for card
export function createCardDisplayName(brand: string, lastFour: string): string {
  return `${brand} •••• ${lastFour}`;
}

// Create display name for UPI
export function createUpiDisplayName(upiId: string): string {
  return upiId;
}

export function useSavedPaymentMethods() {
  const { user, company } = useAuth();
  const ownerId = user?.id || company?.id;
  const ownerType = company ? "company" : "user";

  return useQuery({
    queryKey: ["saved-payment-methods", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];

      const column = ownerType === "company" ? "company_id" : "user_id";
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .select("*")
        .eq(column, ownerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedPaymentMethod[];
    },
    enabled: !!ownerId,
  });
}

export function useSavePaymentMethod() {
  const queryClient = useQueryClient();
  const { user, company } = useAuth();
  const ownerId = user?.id || company?.id;
  const ownerType = company ? "company" : "user";

  return useMutation({
    mutationFn: async (input: SavePaymentMethodInput) => {
      if (!ownerId) throw new Error("Not authenticated");

      const insertData = {
        ...input,
        [ownerType === "company" ? "company_id" : "user_id"]: ownerId,
      };

      const { data, error } = await supabase
        .from("saved_payment_methods")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-payment-methods", ownerId] });
      toast.success("Payment method saved");
    },
    onError: (error) => {
      console.error("Failed to save payment method:", error);
      toast.error("Failed to save payment method");
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const { user, company } = useAuth();
  const ownerId = user?.id || company?.id;

  return useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase
        .from("saved_payment_methods")
        .delete()
        .eq("id", methodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-payment-methods", ownerId] });
      toast.success("Payment method removed");
    },
    onError: (error) => {
      console.error("Failed to delete payment method:", error);
      toast.error("Failed to remove payment method");
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();

  return useMutation({
    mutationFn: async (methodId: string) => {
      if (!user) throw new Error("User not authenticated");

      const ownerColumn = userType === 'company' ? 'company_id' : 'user_id';

      const { error } = await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods'] });
      toast.success("Default payment method updated");
    },
    onError: (error: Error) => {
      toast.error("Error setting default", { description: error.message });
    },
  });
}

interface UpdatePaymentMethodInput {
  id: string;
  display_name?: string;
  card_expiry?: string;
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, display_name, card_expiry }: UpdatePaymentMethodInput) => {
      const updates: Record<string, string> = {};
      if (display_name !== undefined) updates.display_name = display_name;
      if (card_expiry !== undefined) updates.card_expiry = card_expiry;

      const { error } = await supabase
        .from('saved_payment_methods')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods'] });
      toast.success("Payment method updated");
    },
    onError: (error: Error) => {
      toast.error("Error updating payment method", { description: error.message });
    },
  });
}

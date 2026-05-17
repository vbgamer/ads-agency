import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays, isAfter, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateDispute, DISPUTE_TYPES, type DisputeType } from "@/hooks/useCashbackDisputes";

const disputeSchema = z.object({
  dispute_type: z.enum(["missing_cashback", "incorrect_amount", "delayed_cashback", "rejected_cashback"]),
  brand_name: z.string().min(2, "Brand name must be at least 2 characters").max(100, "Brand name is too long"),
  transaction_date: z.date({
    required_error: "Transaction date is required",
  }),
  order_id: z.string().min(3, "Order ID must be at least 3 characters").max(50, "Order ID is too long"),
  expected_amount: z.number().min(1, "Amount must be at least ₹1").max(10000, "Amount cannot exceed ₹10,000"),
  actual_amount: z.number().min(0, "Amount cannot be negative"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)").max(2000, "Description is too long"),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

export function CashbackDisputeForm() {
  const [open, setOpen] = useState(false);
  const createDispute = useCreateDispute();

  const form = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      dispute_type: "missing_cashback",
      brand_name: "",
      order_id: "",
      expected_amount: 0,
      actual_amount: 0,
      description: "",
    },
  });

  const onSubmit = async (data: DisputeFormData) => {
    await createDispute.mutateAsync({
      dispute_type: data.dispute_type as DisputeType,
      brand_name: data.brand_name.trim(),
      transaction_date: format(data.transaction_date, "yyyy-MM-dd"),
      order_id: data.order_id.trim(),
      expected_amount: data.expected_amount,
      actual_amount: data.actual_amount,
      description: data.description.trim(),
    });
    form.reset();
    setOpen(false);
  };

  const minDate = subDays(new Date(), 180);
  const maxDate = new Date();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <AlertCircle className="mr-2 h-4 w-4" />
          Report Missing Cashback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Missing Cashback</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dispute_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispute Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispute type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DISPUTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand / Store Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Amazon, Flipkart" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            isBefore(startOfDay(date), startOfDay(minDate)) ||
                            isAfter(startOfDay(date), startOfDay(maxDate))
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order / Invoice ID*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AMZ-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Amount (₹)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Amount Received (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your issue in detail. Include any relevant information about your purchase..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDispute.isPending}>
                {createDispute.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Dispute
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

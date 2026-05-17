import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type TicketCategory = 'cashback_issue' | 'account_problem' | 'technical_bug' | 'payment_issue' | 'general_inquiry';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  user_id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface TicketWithMessages extends SupportTicket {
  messages: TicketMessage[];
  user_email?: string;
  user_name?: string;
}

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'cashback_issue', label: 'Cashback Issues' },
  { value: 'account_problem', label: 'Account Problems' },
  { value: 'technical_bug', label: 'Technical Bugs' },
  { value: 'payment_issue', label: 'Payment Issues' },
  { value: 'general_inquiry', label: 'General Inquiry' },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Fetch current user's tickets
export function useUserTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['support-tickets', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });
}

// Fetch single ticket with messages
export function useTicketDetails(ticketId: string | undefined) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError) throw ticketError;
      if (!ticket) return null;

      const { data: messages, error: messagesError } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return {
        ...ticket,
        messages: messages || [],
      } as TicketWithMessages;
    },
    enabled: !!ticketId && !!user,
  });
}

// Create new ticket
export function useCreateTicket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: TicketCategory;
      subject: string;
      description: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: data.category,
          subject: data.subject,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({
        title: 'Ticket created',
        description: 'Your support ticket has been submitted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Add message to ticket
export function useAddTicketMessage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: messageData, error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: data.ticketId,
          sender_id: user.id,
          sender_type: isAdmin ? 'admin' : 'user',
          message: data.message,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.ticketId);

      return messageData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Admin: Fetch all tickets
export function useAdminTickets(filters?: {
  status?: TicketStatus;
  category?: TicketCategory;
  search?: string;
}) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['support-tickets', 'admin', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user emails for each ticket
      const ticketsWithUsers = await Promise.all(
        (data || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', ticket.user_id)
            .maybeSingle();

          return {
            ...ticket,
            user_email: profile?.email || 'Unknown',
            user_name: profile?.name || 'Unknown',
          };
        })
      );

      // Apply search filter client-side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return ticketsWithUsers.filter(
          (ticket) =>
            ticket.subject.toLowerCase().includes(searchLower) ||
            ticket.user_email?.toLowerCase().includes(searchLower) ||
            ticket.user_name?.toLowerCase().includes(searchLower)
        );
      }

      return ticketsWithUsers as (SupportTicket & { user_email?: string; user_name?: string })[];
    },
    enabled: isAdmin,
  });
}

// Admin: Update ticket status
export function useUpdateTicketStatus() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      status: TicketStatus;
      resolvedAt?: string;
    }) => {
      if (!isAdmin) throw new Error('Unauthorized');

      const updates: Partial<SupportTicket> = {
        status: data.status,
      };

      if (data.status === 'resolved' || data.status === 'closed') {
        updates.resolved_at = data.resolvedAt || new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', data.ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket'] });
      toast({
        title: 'Status updated',
        description: 'Ticket status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Admin: Assign ticket
export function useAssignTicket() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; assignedTo?: string }) => {
      if (!isAdmin) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: data.assignedTo || user?.id,
          status: 'in_progress',
        })
        .eq('id', data.ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({
        title: 'Ticket assigned',
        description: 'You have been assigned to this ticket.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error assigning ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Get open tickets count for badge
export function useOpenTicketsCount() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['support-tickets', 'count', 'open'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
  });
}

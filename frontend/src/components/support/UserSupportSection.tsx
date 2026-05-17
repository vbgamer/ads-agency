import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTicketForm } from "./CreateTicketForm";
import { TicketList } from "./TicketList";
import { TicketDetail } from "./TicketDetail";
import { CashbackDisputeForm } from "./CashbackDisputeForm";
import { DisputeList } from "./DisputeList";
import { DisputeDetail } from "./DisputeDetail";
import { KnowledgeBase } from "./KnowledgeBase";

export function UserSupportSection() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("help");

  // Show ticket detail view
  if (selectedTicketId) {
    return (
      <TicketDetail
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  // Show dispute detail view
  if (selectedDisputeId) {
    return (
      <DisputeDetail
        disputeId={selectedDisputeId}
        onBack={() => setSelectedDisputeId(null)}
      />
    );
  }

  const handleCreateTicket = () => {
    setActiveTab("tickets");
  };

  const handleCreateDispute = () => {
    setActiveTab("disputes");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Support</h2>
        <p className="text-muted-foreground">
          Get help with any issues you're experiencing
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="help">Help Center</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="disputes">My Disputes</TabsTrigger>
          </TabsList>
          
          {activeTab === "tickets" && <CreateTicketForm />}
          {activeTab === "disputes" && <CashbackDisputeForm />}
        </div>

        <TabsContent value="help" className="mt-6">
          <KnowledgeBase
            onCreateTicket={handleCreateTicket}
            onCreateDispute={handleCreateDispute}
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <TicketList onSelectTicket={setSelectedTicketId} />
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <DisputeList onSelectDispute={setSelectedDisputeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

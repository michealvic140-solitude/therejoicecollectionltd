import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { MapPin, Plus, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface TrackingEntry {
  id: string;
  order_id: string;
  status: string;
  description: string;
  created_at: string;
}

const trackingStatuses = [
  "Order Received",
  "Orders Being Sorted",
  "Package Being Prepared",
  "Package Out for Delivery",
  "In Transit",
  "Arrived at Local Hub",
  "Out for Final Delivery",
  "Delivered Successfully",
  "Refund: Verifying Payment",
  "Refund: Payment Received",
  "Refund: Approved",
  "Refund: Refund in Progress",
  "Refund: Refunded",
];

export function AdminTracking() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data);
      applyFilters(data, searchQuery, statusFilter);
    }
  };

  const applyFilters = (data: any[], search: string, status: string) => {
    let filtered = data;
    if (status !== "all") {
      filtered = filtered.filter((o: any) => o.status === status);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((o: any) =>
        o.id.toLowerCase().includes(q) || (o.user_name || "").toLowerCase().includes(q)
      );
    }
    setFilteredOrders(filtered);
  };

  useEffect(() => { applyFilters(orders, searchQuery, statusFilter); }, [searchQuery, statusFilter]);

  const fetchTracking = async (orderId: string) => {
    const { data } = await supabase.from("order_tracking").select("*")
      .eq("order_id", orderId).order("created_at", { ascending: true });
    if (data) setTracking(data as TrackingEntry[]);
  };

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { if (selectedOrder) fetchTracking(selectedOrder); }, [selectedOrder]);

  const addUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    await supabase.from("order_tracking").insert({
      order_id: selectedOrder,
      status: newStatus,
      description: newDesc,
    } as any);

    // Update order status
    if (newStatus === "Delivered Successfully") {
      await supabase.from("orders").update({ status: "Delivered" } as any).eq("id", selectedOrder);
    } else if (newStatus.includes("Out for") || newStatus.includes("Transit")) {
      await supabase.from("orders").update({ status: "Shipped" } as any).eq("id", selectedOrder);
    } else if (newStatus.startsWith("Refund:")) {
      const refundStatus = newStatus.replace("Refund: ", "");
      await supabase.from("orders").update({ refund_status: refundStatus } as any).eq("id", selectedOrder);
    } else {
      await supabase.from("orders").update({ status: "Processing" } as any).eq("id", selectedOrder);
    }

    const order = orders.find((o: any) => o.id === selectedOrder);
    if (order) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: "Order Update",
        message: `Order #${selectedOrder.slice(0, 8)}: ${newStatus}. ${newDesc}`,
        type: "info",
        link: "/orders",
      } as any);
    }

    toast.success("Tracking updated");
    setNewStatus("");
    setNewDesc("");
    fetchTracking(selectedOrder);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Order Tracking</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by order ID or customer..." className="bg-secondary border-border pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-secondary border-border">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Payment">Pending Payment</SelectItem>
            <SelectItem value="Payment Confirmed">Payment Confirmed</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order selector */}
      <Select value={selectedOrder} onValueChange={setSelectedOrder}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder={`Select Order (${filteredOrders.length} orders)`} />
        </SelectTrigger>
        <SelectContent>
          {filteredOrders.map((o: any) => (
            <SelectItem key={o.id} value={o.id}>
              {o.id.slice(0, 8)} — {o.user_name || "Unknown"} — {formatPrice(o.total)} [{o.status}]
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOrder && (
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h3 className="font-display text-lg font-semibold text-foreground">Tracking History</h3>
          
          <div className="space-y-4">
            {tracking.map((t, i) => (
              <div key={t.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-gold" />
                  {i < tracking.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold text-foreground text-sm">{t.status}</p>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {tracking.length === 0 && <p className="text-sm text-muted-foreground">No tracking updates yet.</p>}
          </div>

          {/* Add Update */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground text-sm">Add Tracking Update</h4>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select tracking status..." />
              </SelectTrigger>
              <SelectContent>
                {trackingStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Description (optional)..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-secondary border-border min-h-[60px]" />
            <Button onClick={addUpdate} className="gradient-gold text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Add Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

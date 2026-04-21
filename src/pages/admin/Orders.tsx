import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  Search, Trash2, X, Package, Truck, CheckCircle2, Clock, XCircle, Settings2,
  ChevronDown, MapPin, Phone, Mail, User, FileText, Calendar, Hash, ArrowUpDown,
} from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  order_number: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  status: OrderStatus;
  notes: string;
  created_at: string;
}

const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  processing: { label: "Processing", icon: Settings2, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  delivered: { label: "Delivered", icon: Package, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusTabs: { value: string; label: string; }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: sortDir === "asc" });
    if (filterStatus !== "all") query = query.eq("status", filterStatus as OrderStatus);
    if (dateFrom) query = query.gte("created_at", startOfDay(parseISO(dateFrom)).toISOString());
    if (dateTo) query = query.lte("created_at", endOfDay(parseISO(dateTo)).toISOString());
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filterStatus, dateFrom, dateTo, search, sortDir]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
    toast({ title: `Order marked as ${status}` });
  };

  const updateNotes = async (orderId: string) => {
    await supabase.from("orders").update({ notes: editNotes }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notes: editNotes } : o));
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, notes: editNotes });
    toast({ title: "Notes updated" });
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    await supabase.from("orders").delete().eq("id", orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
    toast({ title: "Order deleted" });
  };

  const getNextAction = (status: OrderStatus): { label: string; next: OrderStatus } | null => {
    const flow: Record<string, { label: string; next: OrderStatus }> = {
      pending: { label: "Confirm Order", next: "confirmed" },
      confirmed: { label: "Start Processing", next: "processing" },
      processing: { label: "Mark Shipped", next: "shipped" },
      shipped: { label: "Mark Delivered", next: "delivered" },
    };
    return flow[status] || null;
  };

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}>
          <ArrowUpDown className="h-4 w-4 mr-1" /> {sortDir === "desc" ? "Newest" : "Oldest"}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {statusTabs.map(tab => {
          const isActive = filterStatus === tab.value;
          const count = tab.value === "all" ? orders.length : (statusCounts[tab.value] || 0);
          return (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-primary-foreground/20" : "bg-border"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Date Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Orders List */}
        <div className="flex-1 space-y-2">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground text-sm mt-2">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No orders found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            orders.map(order => {
              const sc = statusConfig[order.status];
              const StatusIcon = sc.icon;
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setEditNotes(order.notes || ""); }}
                  className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg ${sc.bg} border flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`h-4 w-4 ${sc.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{order.order_number}</span>
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} border text-[10px] px-1.5 py-0`}>
                            {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{order.customer_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{order.variant_name} × {order.quantity}</span>
                          <span>·</span>
                          <span>{order.customer_city}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary text-sm">Rs.{order.total_price.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(parseISO(order.created_at), "MMM dd, hh:mm a")}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="lg:w-[400px] flex-shrink-0 self-start lg:sticky lg:top-20">
            <Card className="border-primary/20">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{selectedOrder.order_number}</h3>
                    <p className="text-xs text-muted-foreground">{format(parseISO(selectedOrder.created_at), "MMMM dd, yyyy 'at' hh:mm a")}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedOrder(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <Select value={selectedOrder.status} onValueChange={(v) => updateStatus(selectedOrder.id, v as OrderStatus)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => {
                        const c = statusConfig[s];
                        const Icon = c.icon;
                        return (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                              {c.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CardContent className="p-5 space-y-5">
                {/* Customer Info */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${selectedOrder.customer_phone}`} className="text-primary hover:underline">{selectedOrder.customer_phone}</a>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{selectedOrder.customer_email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{selectedOrder.customer_address}, {selectedOrder.customer_city}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Details</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{selectedOrder.variant_name}</span>
                      <span className="text-muted-foreground">× {selectedOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Unit price</span>
                      <span>Rs.{selectedOrder.unit_price.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">Rs.{selectedOrder.total_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
                  <div className="flex gap-2">
                    <Input
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Add internal notes..."
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => updateNotes(selectedOrder.id)}>Save</Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-border">
                  {(() => {
                    const next = getNextAction(selectedOrder.status);
                    if (!next) return null;
                    return (
                      <Button className="w-full" onClick={() => updateStatus(selectedOrder.id, next.next)}>
                        {next.label}
                      </Button>
                    );
                  })()}
                  {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
                    <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => updateStatus(selectedOrder.id, "cancelled")}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => deleteOrder(selectedOrder.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

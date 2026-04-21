import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import {
  ShoppingCart, DollarSign, Package, TrendingUp, Clock, Truck, CheckCircle2, XCircle, ArrowUp, ArrowDown,
} from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, subDays } from "date-fns";

interface Order {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  variant_name: string;
  quantity: number;
}

const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      let query = supabase.from("orders").select("id, total_price, status, created_at, variant_name, quantity").order("created_at", { ascending: false });
      if (dateFrom) query = query.gte("created_at", startOfDay(parseISO(dateFrom)).toISOString());
      if (dateTo) query = query.lte("created_at", endOfDay(parseISO(dateTo)).toISOString());
      const { data } = await query;
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + o.total_price, 0);
    const delivered = orders.filter(o => o.status === "delivered").length;
    const pending = orders.filter(o => o.status === "pending").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    const shipped = orders.filter(o => o.status === "shipped").length;
    const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const totalUnits = orders.reduce((s, o) => s + o.quantity, 0);
    return { totalOrders, totalSales, delivered, pending, cancelled, shipped, avgOrder, totalUnits };
  }, [orders]);

  const chartData = useMemo(() => {
    const map: Record<string, { date: string; orders: number; sales: number }> = {};
    orders.forEach(o => {
      const d = format(parseISO(o.created_at), "MMM dd");
      if (!map[d]) map[d] = { date: d, orders: 0, sales: 0 };
      map[d].orders++;
      map[d].sales += o.total_price;
    });
    return Object.values(map).reverse();
  }, [orders]);

  const topVariants = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(o => {
      if (!map[o.variant_name]) map[o.variant_name] = { name: o.variant_name, count: 0, revenue: 0 };
      map[o.variant_name].count += o.quantity;
      map[o.variant_name].revenue += o.total_price;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  const statusBreakdown = useMemo(() => [
    { label: "Pending", count: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Shipped", count: stats.shipped, icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Delivered", count: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Cancelled", count: stats.cancelled, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ], [stats]);

  const kpiCards = [
    { title: "Total Revenue", value: `Rs.${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-accent", bg: "bg-accent/10" },
    { title: "Avg Order Value", value: `Rs.${stats.avgOrder.toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
    { title: "Units Sold", value: stats.totalUnits, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your store performance at a glance</p>
        </div>
        <div className="flex gap-2 items-end">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <Card key={k.title} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusBreakdown.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-muted-foreground text-center py-16 text-sm">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(205 100% 40%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(205 100% 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 92%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(210 10% 70%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(210 10% 70%)" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(210 20% 90%)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(205 100% 40%)" fill="url(#salesGrad)" strokeWidth={2} name="Revenue (Rs)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-muted-foreground text-center py-16 text-sm">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 92%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(210 10% 70%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(210 10% 70%)" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(210 20% 90%)", fontSize: 12 }} />
                  <Bar dataKey="orders" fill="hsl(145 60% 40%)" radius={[6, 6, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Variants */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topVariants.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No sales data</p>
            ) : (
              <div className="space-y-3">
                {topVariants.map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.count} units sold</p>
                    </div>
                    <span className="text-sm font-bold text-primary">Rs.{v.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{o.variant_name}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(o.created_at), "MMM dd, hh:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">Rs.{o.total_price.toLocaleString()}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

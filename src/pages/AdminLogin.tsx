import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
        if (data) navigate("/admin/dashboard", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Try sign in first
      let { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // If user doesn't exist, try signup (for first-time admin setup)
      if (error && error.message.includes("Invalid login")) {
        const signup = await supabase.auth.signUp({ email, password });
        if (signup.error) throw signup.error;
        data = signup.data as any;
        if (!data?.user) throw new Error("Signup failed");
        // Re-login after signup
        const relogin = await supabase.auth.signInWithPassword({ email, password });
        if (relogin.error) throw relogin.error;
        data = relogin.data;
      } else if (error) {
        throw error;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data!.user!.id, _role: "admin" });
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "You don't have admin privileges.", variant: "destructive" });
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <img src="/images/logo.png" alt="Logo" className="h-10 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your store</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

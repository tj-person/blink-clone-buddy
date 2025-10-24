import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/PhoneInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactFormProps {
  cardId: string;
  cardOwnerName: string;
}

export const ContactForm = ({ cardId, cardOwnerName }: ContactFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-intro-sms', {
        body: { cardId, name, phone }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Introduction sent! They'll be in touch soon.");
        setName("");
        setPhone("");
      } else {
        toast.error(data?.message || "Failed to send introduction");
      }
    } catch (error) {
      console.error('Error sending intro:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Want to Connect?</CardTitle>
        <CardDescription>
          Send your info to {cardOwnerName} and they'll reach out!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Your Phone Number</Label>
            <PhoneInput
              id="phone"
              value={phone}
              onChange={setPhone}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Introduction"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

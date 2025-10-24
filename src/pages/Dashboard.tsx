import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Edit, Eye, Trash2, Share2, Plus } from "lucide-react";

interface CardData {
  id: string;
  card_name: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  company_name: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  view_count?: number;
}

interface ContactData {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  card_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardData[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadCards(session.user.id);
      await loadContacts(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCards = async (userId: string) => {
    try {
      const { data: cardsData, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cardsError) throw cardsError;

      const cardsWithAnalytics = await Promise.all(
        (cardsData || []).map(async (card) => {
          const { data: analytics } = await supabase
            .from("card_analytics")
            .select("view_count")
            .eq("card_id", card.id)
            .single();

          return {
            ...card,
            view_count: analytics?.view_count || 0,
          };
        })
      );

      setCards(cardsWithAnalytics);
    } catch (error) {
      console.error("Error loading cards:", error);
      toast.error("Failed to load cards");
    }
  };

  const loadContacts = async (userId: string) => {
    try {
      const { data: contactsData, error } = await supabase
        .from("contacts")
        .select(`
          id,
          name,
          phone,
          created_at,
          cards!inner(card_name)
        `)
        .eq("card_owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedContacts = (contactsData || []).map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        created_at: contact.created_at,
        card_name: contact.cards.card_name,
      }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const { error } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;

      setCards(cards.filter(card => card.id !== cardId));
      toast.success("Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    }
  };

  const handleShare = async (cardId: string) => {
    const url = `${window.location.origin}/c/${cardId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Digital Card",
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CardLink
          </h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            {user?.email}
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={() => navigate("/card/create")} 
            variant="hero"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Card
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">
                You don't have any cards yet.
              </p>
              <Button 
                variant="default" 
                onClick={() => navigate("/card/create")}
              >
                Create Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{card.card_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.first_name} {card.last_name}
                      </p>
                      {card.job_title && (
                        <p className="text-sm text-muted-foreground">
                          {card.job_title}
                        </p>
                      )}
                    </div>
                    {card.profile_photo_url && (
                      <img 
                        src={card.profile_photo_url} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Views: {card.view_count || 0}</p>
                    <p>Status: {card.is_active ? "Active" : "Inactive"}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/c/${card.id}`, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(card.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Contact Submissions</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>{contact.card_name}</TableCell>
                        <TableCell>
                          {new Date(contact.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

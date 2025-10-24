import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { ContactForm } from "@/components/ContactForm";
import { Phone, Building2, MapPin, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface CardData {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  company_name: string | null;
  work_address: string | null;
  mobile_number: string | null;
  company_number: string | null;
  profile_photo_url: string | null;
  company_logo_url: string | null;
  theme_color: string;
  card_name: string;
}

const PublicCard = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (cardId) {
      loadCard();
    }
  }, [cardId]);

  const loadCard = async () => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", cardId)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      setCard(data);
      
      if (!viewTracked) {
        trackView();
        setViewTracked(true);
      }
    } catch (error) {
      console.error("Error loading card:", error);
      toast.error("Card not found");
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    if (!cardId) return;
    
    try {
      const { data: analytics } = await supabase
        .from("card_analytics")
        .select("*")
        .eq("card_id", cardId)
        .single();

      if (analytics) {
        await supabase
          .from("card_analytics")
          .update({
            view_count: (analytics.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString(),
          })
          .eq("card_id", cardId);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleAddToContacts = async () => {
    if (!card) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${card.first_name} ${card.last_name}
N:${card.last_name};${card.first_name};;;
${card.job_title ? `TITLE:${card.job_title}` : ''}
${card.company_name ? `ORG:${card.company_name}` : ''}
${card.mobile_number ? `TEL;TYPE=CELL:${card.mobile_number}` : ''}
${card.company_number ? `TEL;TYPE=WORK:${card.company_number}` : ''}
${card.work_address ? `ADR;TYPE=WORK:;;${card.work_address};;;;` : ''}
${card.profile_photo_url ? `PHOTO;VALUE=URI:${card.profile_photo_url}` : ''}
${card.company_logo_url ? `LOGO;VALUE=URI:${card.company_logo_url}` : ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.first_name}_${card.last_name}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Contact saved!");
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card?.first_name} ${card?.last_name}'s Card`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Card Not Found</h1>
          <p className="text-muted-foreground">This card doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const cardUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
          {/* Header */}
          <div 
            className="p-6 flex justify-between items-center"
            style={{ backgroundColor: card.theme_color + '10' }}
          >
            {card.company_logo_url && (
              <img 
                src={card.company_logo_url} 
                alt="Company logo" 
                className="h-12 w-auto object-contain"
              />
            )}
            <span className="text-sm font-medium text-muted-foreground ml-auto">
              CardLink Card
            </span>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {card.first_name} {card.last_name}
                </h1>
                {card.job_title && (
                  <p className="text-lg text-muted-foreground mb-1">{card.job_title}</p>
                )}
                {card.company_name && (
                  <p className="text-base text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {card.company_name}
                  </p>
                )}
              </div>
              {card.profile_photo_url && (
                <img 
                  src={card.profile_photo_url} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-border"
                />
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {card.mobile_number && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{card.mobile_number}</span>
                </div>
              )}
              {card.company_number && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{card.company_number} (Work)</span>
                </div>
              )}
              {card.work_address && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <span className="flex-1">{card.work_address}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button onClick={handleAddToContacts} variant="default" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Add to Contacts
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Contact Form */}
            <ContactForm 
              cardId={card.id} 
              cardOwnerName={`${card.first_name} ${card.last_name}`}
            />

            {/* QR Code */}
            <div className="bg-background rounded-lg p-6 mt-6">
              <QRCodeDisplay url={cardUrl} size={250} className="flex flex-col items-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCard;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ImageUpload";
import { PhoneInput } from "@/components/PhoneInput";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const cardSchema = z.object({
  cardName: z.string().min(1, "Card name is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  jobTitle: z.string().max(100).optional(),
  companyName: z.string().max(100).optional(),
  workAddress: z.string().max(500).optional(),
  mobileNumber: z.string().max(20).optional(),
  companyNumber: z.string().max(20).optional(),
  themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

type CardFormData = z.infer<typeof cardSchema>;

const CardCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<string>("");

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardName: "My Card",
      firstName: "",
      lastName: "",
      jobTitle: "",
      companyName: "",
      workAddress: "",
      mobileNumber: "",
      companyNumber: "",
      themeColor: "#4F46E5",
    },
  });

  const uploadImage = async (base64: string, bucket: string, fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const base64Data = base64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const filePath = `${user.id}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const onSubmit = async (data: CardFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a card");
        navigate("/auth");
        return;
      }

      let profilePhotoUrl = "";
      let companyLogoUrl = "";

      if (profilePhoto) {
        profilePhotoUrl = await uploadImage(profilePhoto, "profile-photos", `${Date.now()}-profile.png`);
      }

      if (companyLogo) {
        companyLogoUrl = await uploadImage(companyLogo, "company-logos", `${Date.now()}-logo.png`);
      }

      const { data: cardData, error } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          card_name: data.cardName,
          first_name: data.firstName,
          last_name: data.lastName,
          job_title: data.jobTitle || null,
          company_name: data.companyName || null,
          work_address: data.workAddress || null,
          mobile_number: data.mobileNumber || null,
          company_number: data.companyNumber || null,
          profile_photo_url: profilePhotoUrl || null,
          company_logo_url: companyLogoUrl || null,
          theme_color: data.themeColor,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Card created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating card:", error);
      toast.error(error.message || "Failed to create card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Digital Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Name (Internal)</FormLabel>
                      <FormControl>
                        <Input placeholder="My Work Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Technology Designer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="SSR-Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, City, State 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <PhoneInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Number</FormLabel>
                        <FormControl>
                          <PhoneInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <ImageUpload
                  label="Profile Photo"
                  value={profilePhoto}
                  onChange={setProfilePhoto}
                  onRemove={() => setProfilePhoto("")}
                />

                <ImageUpload
                  label="Company Logo"
                  value={companyLogo}
                  onChange={setCompanyLogo}
                  onRemove={() => setCompanyLogo("")}
                />

                <FormField
                  control={form.control}
                  name="themeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" {...field} className="w-20 h-10" />
                          <Input {...field} placeholder="#4F46E5" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Card...
                    </>
                  ) : (
                    "Create Card"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CardCreate;
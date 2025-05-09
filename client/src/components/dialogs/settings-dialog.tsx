import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsIcon } from "@/components/ui/icons";
import { useTheme } from "@/lib/theme-provider";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, DEFAULT_PLAYER_SETTINGS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

// Define form schema
const playerFormSchema = z.object({
  volume: z.number().min(0).max(100),
  autoplay: z.boolean().default(true),
  rememberLastChannel: z.boolean().default(true),
  bufferingTime: z.number().min(1000).max(10000),
});

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("dark"),
});

export default function SettingsDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("player");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  // Fetch player settings
  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: [`${API_ENDPOINTS.SETTINGS}/playerSettings`],
  });
  
  // Initialize player form
  const playerForm = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      volume: DEFAULT_PLAYER_SETTINGS.volume,
      autoplay: DEFAULT_PLAYER_SETTINGS.autoplay,
      rememberLastChannel: DEFAULT_PLAYER_SETTINGS.rememberLastChannel,
      bufferingTime: DEFAULT_PLAYER_SETTINGS.bufferingTime,
    },
  });
  
  // Initialize appearance form
  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
    },
  });
  
  // Update form values when settings are loaded
  useEffect(() => {
    if (settingsData?.value) {
      const settings = settingsData.value;
      playerForm.reset({
        volume: settings.volume ?? DEFAULT_PLAYER_SETTINGS.volume,
        autoplay: settings.autoplay ?? DEFAULT_PLAYER_SETTINGS.autoplay,
        rememberLastChannel: settings.rememberLastChannel ?? DEFAULT_PLAYER_SETTINGS.rememberLastChannel,
        bufferingTime: settings.bufferingTime ?? DEFAULT_PLAYER_SETTINGS.bufferingTime,
      });
    }
  }, [settingsData, playerForm]);
  
  // Handle player form submission
  const onPlayerSubmit = async (values: z.infer<typeof playerFormSchema>) => {
    setIsLoading(true);
    
    try {
      await apiRequest("PUT", `${API_ENDPOINTS.SETTINGS}/playerSettings`, {
        value: values,
      });
      
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.SETTINGS}/playerSettings`] });
      
      toast({
        title: "Settings saved",
        description: "Player settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle appearance form submission
  const onAppearanceSubmit = (values: z.infer<typeof appearanceFormSchema>) => {
    setTheme(values.theme as "light" | "dark");
    
    toast({
      title: "Theme updated",
      description: "Application theme has been updated.",
    });
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <SettingsIcon className="mr-2 h-5 w-5" />
          Settings
        </DialogTitle>
        <DialogDescription>
          Configure your IPTV player preferences
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="player" value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="player">Player</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="player" className="space-y-6 py-4">
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-6">
              <FormField
                control={playerForm.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Volume ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the default volume level for video playback
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={playerForm.control}
                name="autoplay"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <FormLabel>Autoplay</FormLabel>
                      <FormDescription>
                        Automatically start playing channels when opened
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={playerForm.control}
                name="rememberLastChannel"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <FormLabel>Remember Last Channel</FormLabel>
                      <FormDescription>
                        Resume the last channel you were watching
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={playerForm.control}
                name="bufferingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffering Time ({field.value / 1000}s)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1000}
                        max={10000}
                        step={1000}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Adjust buffering time for smoother playback on slower connections
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6 py-4">
          <Form {...appearanceForm}>
            <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
              <FormField
                control={appearanceForm.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Change the application theme
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </>
  );
}

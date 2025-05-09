import { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseM3U } from "@/lib/utils/m3u-parser";
import { API_ENDPOINTS } from "@/lib/constants";
import { usePlaylist } from "@/hooks/use-playlist";

// Define form schema
const formSchema = z.object({
  playlistName: z.string().min(1, "Playlist name is required"),
  playlistUrl: z.string().url("Please enter a valid URL"),
  makeActive: z.boolean().default(true),
});

export default function ImportPlaylist() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { importPlaylist } = usePlaylist();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistName: "",
      playlistUrl: "",
      makeActive: true,
    },
  });
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an M3U or M3U8 file",
        variant: "destructive",
      });
      return;
    }
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setFileContent(content);
        setFileName(file.name);
        
        // Update form values
        form.setValue("playlistName", file.name.replace(/\.(m3u|m3u8)$/i, ""));
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          title: "Error reading file",
          description: "The selected file could not be read. Please try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      let playlistContent: string | null = null;
      
      if (activeTab === "url") {
        playlistContent = null; // We'll use the URL directly
      } else if (activeTab === "file" && fileContent) {
        // For file upload, we need to validate M3U format
        playlistContent = fileContent;
      } else {
        toast({
          title: "Missing content",
          description: "Please provide a valid playlist URL or file",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Create playlist in database
      const createPlaylistData = {
        name: values.playlistName,
        url: activeTab === "url" ? values.playlistUrl : "local_file", // For file upload, we'll handle content separately
        isActive: values.makeActive,
      };
      
      // Import the playlist
      await importPlaylist(
        createPlaylistData,
        activeTab === "file" ? playlistContent : null
      );
      
      // Reset form
      form.reset();
      setFileContent(null);
      setFileName(null);
      
      // Close dialog
      document.getElementById("close-dialog-btn")?.click();
      
    } catch (error) {
      console.error("Error importing playlist:", error);
      toast({
        title: "Import failed",
        description: "Failed to import playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Import IPTV Playlist</DialogTitle>
        <DialogDescription>
          Add an M3U playlist by URL or upload a local file
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="playlistName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My IPTV Playlist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <TabsContent value="url" className="space-y-6">
              <FormField
                control={form.control}
                name="playlistUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/playlist.m3u" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="file" className="space-y-6">
              <FormItem>
                <FormLabel>Upload M3U File</FormLabel>
                <FormControl>
                  <div className="border border-input rounded-md p-2">
                    <Input
                      type="file"
                      accept=".m3u,.m3u8"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                </FormControl>
                {fileName && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {fileName}
                  </p>
                )}
              </FormItem>
            </TabsContent>
            
            <FormField
              control={form.control}
              name="makeActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Make this the active playlist
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                id="close-dialog-btn"
                type="button"
                variant="outline"
                onClick={() => document.getElementById("close-dialog-btn")?.click()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Importing..." : "Import Playlist"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </Tabs>
    </>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlaylist } from "@/hooks/use-playlist";
import { useToast } from "@/hooks/use-toast";
import { PlaylistInsert } from "@shared/schema";
import { cn } from "@/lib/utils";

// Formulario para validar la URL de la lista de reproducción
const urlFormSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio" }),
  url: z.string().url({ message: "URL no válida" }).min(1, { message: "La URL es obligatoria" }),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Formulario para validar el archivo de lista de reproducción
const fileFormSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio" }),
  file: z.any().refine((file) => file instanceof File, {
    message: "Debe seleccionar un archivo",
  }),
});

type UrlFormValues = z.infer<typeof urlFormSchema>;
type FileFormValues = z.infer<typeof fileFormSchema>;

export default function Setup() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { importPlaylist } = usePlaylist();
  const { toast } = useToast();

  // Configurar formulario para URL
  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      name: "",
      url: "",
      username: "",
      password: "",
    },
  });

  // Configurar formulario para archivo
  const fileForm = useForm<FileFormValues>({
    resolver: zodResolver(fileFormSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

  // Manejar envío del formulario de URL
  const onUrlSubmit = async (data: UrlFormValues) => {
    setIsLoading(true);
    try {
      // Crear el objeto de lista de reproducción
      const playlist: PlaylistInsert = {
        name: data.name,
        url: data.url,
        username: data.username || undefined,
        password: data.password || undefined,
        isActive: true, // Lo establecemos como activo por defecto
      };

      // Intentar cargar el contenido de la URL
      const response = await fetch(data.url);
      
      if (!response.ok) {
        throw new Error("No se pudo cargar la URL. Comprueba que sea una URL válida de M3U.");
      }
      
      const content = await response.text();
      
      // Importar la lista de reproducción con el contenido
      await importPlaylist(playlist, content);
      
      // Redirigir a la página de inicio
      toast({
        title: "¡Configuración completada!",
        description: `Se ha importado correctamente la lista ${data.name}`,
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Error al importar la lista de reproducción:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo importar la lista de reproducción",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío del formulario de archivo
  const onFileSubmit = async (data: FileFormValues) => {
    setIsLoading(true);
    try {
      // Leer el contenido del archivo
      const file = data.file as File;
      const content = await file.text();
      
      // Crear el objeto de lista de reproducción
      const playlist: PlaylistInsert = {
        name: data.name,
        url: "", // No hay URL cuando se sube un archivo
        username: undefined,
        password: undefined,
        isActive: true, // Lo establecemos como activo por defecto
      };
      
      // Importar la lista de reproducción con el contenido
      await importPlaylist(playlist, content);
      
      // Redirigir a la página de inicio
      toast({
        title: "¡Configuración completada!",
        description: `Se ha importado correctamente la lista ${data.name}`,
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Error al importar el archivo:", error);
      toast({
        title: "Error",
        description: "No se pudo importar el archivo. Asegúrate de que es un archivo M3U válido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-red-900">
      <div className="mb-8">
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-lg shadow-lg text-white font-bold text-4xl inline-block">
          CABLE UNO PLAY
        </div>
      </div>
      
      <Card className="w-full max-w-md mx-auto bg-black bg-opacity-70 border-red-600">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Bienvenido a Cable Uno Play</CardTitle>
          <CardDescription className="text-gray-300">
            Configura tu servicio IPTV para comenzar
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid grid-cols-2 mx-4">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="file">Archivo</TabsTrigger>
          </TabsList>
          
          {/* Formulario para agregar por URL */}
          <TabsContent value="url">
            <Form {...urlForm}>
              <form onSubmit={urlForm.handleSubmit(onUrlSubmit)} className="space-y-4">
                <CardContent className="space-y-4">
                  <FormField
                    control={urlForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Nombre de la lista</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mi lista IPTV" 
                            {...field} 
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={urlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">URL de la lista M3U</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/mi-lista.m3u" 
                            {...field} 
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Ingresa la URL de tu lista M3U
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={urlForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Usuario</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Usuario" 
                            {...field} 
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Opcional: Si tu proveedor IPTV requiere usuario
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={urlForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Contraseña</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Contraseña" 
                            {...field} 
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Opcional: Si tu proveedor IPTV requiere contraseña
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? "Cargando..." : "Continuar"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Formulario para subir archivo */}
          <TabsContent value="file">
            <Form {...fileForm}>
              <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-4">
                <CardContent className="space-y-4">
                  <FormField
                    control={fileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Nombre de la lista</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mi lista IPTV" 
                            {...field} 
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={fileForm.control}
                    name="file"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">Archivo M3U</FormLabel>
                        <FormControl>
                          <Input 
                            type="file"
                            accept=".m3u,.m3u8,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            {...field}
                            className={cn(
                              "bg-gray-800 text-white border-gray-700 cursor-pointer file:cursor-pointer",
                              "file:bg-red-600 file:text-white file:border-0 file:mr-2 file:px-4 file:py-2 file:rounded"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Sube un archivo con formato M3U o M3U8
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? "Cargando..." : "Continuar"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
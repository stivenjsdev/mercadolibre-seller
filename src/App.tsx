import { searchTerm } from "@/api/mercadolibreAPI";
import { getSuggestions } from "@/api/mercadolibreStaticAPI";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageFormData, TermFormData } from "@/types";
import { gptQuery } from "@/utils/gptQuery";
import { useMutation } from "@tanstack/react-query";
import { OpenAI } from "openai";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  // Response for the gpt request
  const [response, setResponse] = useState<string | null | undefined>("");

  // Image Description Response for the gpt request
  const [imageDescriptionResponse, setImageDescriptionResponse] = useState<
    string | null | undefined
  >("");

  // Image Keywords Response for the gpt request
  const [imageKeywordsResponse, setImageKeywordsResponse] = useState<
    string | null | undefined
  >("");

  // Image URL to display
  const [url, setUrl] = useState("");

  // Status for the gpt request
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "success"
  );

  // Status for the image gpt request
  const [imageStatus, setImageStatus] = useState<
    "loading" | "success" | "error"
  >("success");

  // Get Suggestions by term Query
  const { data: dataSuggestions, mutate: mutateSuggestions } = useMutation({
    mutationFn: getSuggestions,
    onError: (error) => {
      console.error("Error:", error);
    },
    onSuccess: (data) => {
      console.log("getSuggestions Success");
      if (!data) return;
      // doing something when get suggestions
    },
  });

  // Get Product Searches by term Query
  const { data: dataSearch, mutate: mutateSearch } = useMutation({
    mutationFn: searchTerm,
    onError: (error) => {
      console.error("Error:", error);
    },
    onSuccess: (data) => {
      console.log("getSearch Success");
      if (!data) return;
      // doing something when get searches
    },
  });

  // Term Form
  const form = useForm<TermFormData>({
    defaultValues: {
      message: "",
    },
  });

  // Image Form
  const imageForm = useForm<ImageFormData>({
    defaultValues: {
      url: "",
    },
  });

  // Suggest Titles Handler
  const handleSuggestTitles = async () => {
    if (!dataSuggestions && !dataSearch) return;
    setStatus("loading");

    // Map products founded titles in string
    const examples = dataSearch?.results.map((item) => item.title).join(", "); // todo: remove repeated titles

    // Map suggested queries in string
    const values = dataSuggestions?.suggested_queries
      .map((item) => item.q)
      .join(", ");

    // Generate titles for the product
    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: "gpt-4o-mini", // gpt-4o-mini gpt-3.5-turbo
        messages: [
          {
            role: "system",
            content:
              "Eres un experto generador de listas de títulos para productos destinados a plataformas de e-commerce como eBay, Amazon y MercadoLibre. Sigue las siguientes pautas: 1. Usa la mayor cantidad posible de palabras clave proporcionadas por el usuario. 2. Los títulos deben ser concisos, atractivos y optimizados para mejorar la visibilidad en motores de búsqueda (SEO). 3. No incluyas signos de puntuación, conectores, conjunciones, preposiciones, tildes, guiones ni caracteres especiales. 4. Los títulos deben estar formados por 8 a 12 palabras clave relevantes, utilizando sinónimos cuando sea necesario. 5. Cada título debe estar separado por un salto de línea obligatorio.",
          },
          {
            role: "user",
            content: `10 títulos, palabras claves: ${values}. Ejemplos de títulos de ese producto o similares: ${examples}`,
          },
        ],
      };

    try {
      // Generate
      const response = await gptQuery(body);
      setResponse(response.message);
      setStatus("success");
    } catch (error) {
      console.error("Error in gptQuery: ", error);
      setStatus("error");
    }
  };

  const onSubmitConsult: SubmitHandler<TermFormData> = async (formData) => {
    if (!formData.message) return;
    console.log("consulting term...");
    mutateSuggestions(formData.message);
    mutateSearch(formData.message);
    form.reset();
  };

  const onSubmitGenerate: SubmitHandler<ImageFormData> = async (formData) => {
    if (!formData.url) return;
    console.log("generating description/keywords...");
    setImageStatus("loading");

    // set image url to display the product image preview
    setUrl(formData.url);

    // Create body for keywords and description
    const bodyKeywords: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: "gpt-4o-mini", // gpt-4o-mini gpt-3.5-turbo
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Cree una lista de palabras clave relevantes para un producto, suponiendo que el objetivo sea mejorar la visibilidad en las búsquedas y atraer tráfico a plataformas de comercio electrónico como eBay, Amazon y MercadoLibre. Proporcione una lista completa de palabras clave, separadas por comas, que describan con precisión el producto y sus características. Tenga en cuenta factores como la categoría del producto, las descripciones y el público objetivo. responde me directamente con el listado de palabras clave.",
              },
              {
                type: "image_url",
                image_url: {
                  url: formData.url,
                },
              },
            ],
          },
        ],
      };
    const bodyDescription: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: "gpt-4o-mini", // gpt-4o-mini gpt-3.5-turbo
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Genera una descripción para el siguiente producto, para ser utilizada en plataformas de e-commerce como eBay, Amazon y MercadoLibre",
              },
              {
                type: "image_url",
                image_url: {
                  url: formData.url,
                },
              },
            ],
          },
        ],
      };

    try {
      // Generate
      const [keywordsResponse, descriptionResponse] = await Promise.all([
        gptQuery(bodyKeywords),
        gptQuery(bodyDescription),
      ]);

      // Set responses
      setImageKeywordsResponse(keywordsResponse.message);
      setImageDescriptionResponse(descriptionResponse.message);
      setImageStatus("success");
    } catch (error) {
      console.error("Error in gptQuery: ", error);
      setImageStatus("error");
    }
  };

  return (
    <main className="p-4">
      {/* Title */}
      <h1 className="text-2xl text-center py-2 font-bold">
        Vendedores Mercadolibre Pro
        <span className="text-xs block font-light">
          Generador palabras claves de productos
        </span>
      </h1>
      <div className="w-full max-w-md mx-auto space-y-4">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="account">Títulos Productos</TabsTrigger>
            <TabsTrigger value="password">Imagen Producto</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <div className="space-y-4">
              {/* term form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitConsult)}
                  className="space-y-5 pb-2"
                >
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Termino de Búsqueda</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Que deseas buscar?..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Este es tu termino de búsqueda para buscar productos
                          en ML.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Consultar</Button>
                </form>
              </Form>

              {/* suggestions card */}
              <Card>
                <CardHeader>
                  <CardTitle>Sugerencias</CardTitle>
                  <CardDescription>
                    Estas son las sugerencias de búsqueda generadas por ML.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dataSuggestions &&
                    dataSuggestions.suggested_queries.map(
                      (suggested_query, index) => (
                        <p key={index}>{suggested_query.q}</p>
                      )
                    )}
                </CardContent>
              </Card>

              {/* Searches card */}
              <Card>
                <CardHeader>
                  <CardTitle>Búsquedas</CardTitle>
                  <CardDescription>
                    Estos son los títulos de los productos encontrados en ML.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dataSearch &&
                    dataSearch.results.map((result) => (
                      <p key={result.id} className="py-2">
                        {result.title}{" "}
                        <span className="text-xs">
                          ({result.title.length} caracteres)
                        </span>
                      </p>
                    ))}
                </CardContent>
              </Card>

              {/* suggested product title card */}
              <Card>
                <CardHeader>
                  <CardTitle>Titulo de Producto Sugerido</CardTitle>
                  <CardDescription>
                    Estas son las sugerencias generadas por IA para los títulos
                    de los productos en ML.
                  </CardDescription>
                  {/* Button Suggest Titles */}
                  <Button
                    type="button"
                    onClick={handleSuggestTitles}
                    // disabled={!dataSuggestions && !dataSearch}
                  >
                    Generar
                  </Button>
                </CardHeader>
                <CardContent>
                  {status === "loading" && <p>Cargando...</p>}
                  {status === "error" && <p>Error...</p>}
                  {status === "success" &&
                    response &&
                    response.split("\n").map((title, index) => {
                      if (title)
                        return (
                          <div className="p-3" key={index}>
                            <p>{title.trim()} </p>
                            <p className="text-xs">
                              ({title.length} caracteres)
                            </p>
                          </div>
                        );
                    })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="password">
            <div className="space-y-4">
              {/* Generate Image Form */}
              <Form {...imageForm}>
                <form
                  onSubmit={imageForm.handleSubmit(onSubmitGenerate)}
                  className="space-y-5 pb-2"
                >
                  <FormField
                    control={imageForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL imagen del Producto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="URL imagen del producto..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Genera Keywords y Descripción sobre el Producto.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Generar</Button>
                </form>
              </Form>

              {/* Image */}
              <div className="flex justify-center">
                {url && <img src={url} alt="product" className="w-28" />}
              </div>

              {imageStatus === "loading" && <p>Cargando...</p>}
              {imageStatus === "error" && <p>Error...</p>}
              {imageStatus === "success" &&
                imageKeywordsResponse &&
                imageDescriptionResponse && (
                  <>
                    {/* Generate Keywords card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Palabras Claves Generadas</CardTitle>
                        <CardDescription>
                          Estas son las keywords generadas por IA para el
                          producto.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{imageKeywordsResponse}</p>
                      </CardContent>
                    </Card>

                    {/* Generate Description card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Descripción de Producto Generada</CardTitle>
                        <CardDescription>
                          Esta es la descripción generada por IA para el
                          producto.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          className="space-y-4"
                        >
                          {imageDescriptionResponse}
                        </Markdown>
                      </CardContent>
                    </Card>
                  </>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default App;

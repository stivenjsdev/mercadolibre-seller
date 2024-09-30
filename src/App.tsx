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
import { SearchResponse, SuggestionsResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { OpenAI } from "openai";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FormData = {
  message: string;
};

type DescriptionFormData = {
  url: string;
};

function App() {
  // Response for the gpt request
  const [response, setResponse] = useState<string | null>("");

  // Description Response for the gpt request
  const [descriptionResponse, setDescriptionResponse] = useState<string | null>(
    ""
  );

  // Status for the gpt request
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "success"
  );

  // Status for the description gpt request
  const [descriptionStatus, setDescriptionStatus] = useState<
    "loading" | "success" | "error"
  >("success");

  // Image URL
  const [url, setUrl] = useState("")

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

  const form = useForm<FormData>({
    defaultValues: {
      message: "",
    },
  });

  const descriptionForm = useForm<DescriptionFormData>({
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(formData: FormData) {
    mutateSuggestions(formData.message);
    mutateSearch(formData.message);
    form.reset();
  }

  const handleGenerateDescription: SubmitHandler<DescriptionFormData> = async (
    data
  ) => {
    if (!data.url) return;
    console.log("generating description...");
    setDescriptionStatus("loading");

    try {
      setUrl(data.url)

      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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
                  url: data.url,
                },
              },
            ],
          },
        ],
      });
      console.log(completion.choices[0]);
      setDescriptionResponse(completion.choices[0].message.content);
      setDescriptionStatus("success");
    } catch (error) {
      console.log(error);
      setDescriptionStatus("error");
    }
  };

  async function askGpt(
    dataSuggestion: SuggestionsResponse,
    dataSearch: SearchResponse
  ) {
    if (!dataSuggestions && !dataSearch) return;

    setStatus("loading");

    try {
      const examples = dataSearch.results.map((item) => item.title).join(", ");
      console.log({ examples });
      const values = dataSuggestion.suggested_queries
        .map((item) => item.q)
        .join(", ");
      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // gpt-4o-mini
        messages: [
          {
            role: "system",
            content:
              "Eres un experto generador de listas de títulos para productos destinados a plataformas de e-commerce como eBay, Amazon y MercadoLibre. Sigue las siguientes pautas: 1. Usa la mayor cantidad posible de palabras clave proporcionadas por el usuario. 2. Los títulos deben ser concisos, atractivos y optimizados para mejorar la visibilidad en motores de búsqueda (SEO). 3. No incluyas signos de puntuación, conectores, conjunciones, preposiciones, tildes, guiones ni caracteres especiales. 4. Los títulos deben estar formados por 8 a 12 palabras clave relevantes, utilizando sinónimos cuando sea necesario. 5. Cada título debe estar separado por un salto de línea obligatorio. 6. El último titulo debe ser obligatoriamente una combinación de todos los títulos generados sin limite de palabras",
          },
          {
            role: "user",
            content: `10 títulos, palabras claves: ${values}. Ejemplos de títulos de ese producto o similares: ${examples}`,
          },
        ],
      });
      console.log("key words: ", values);
      console.log("gpt response: ", completion.choices[0].message);
      setResponse(completion.choices[0].message.content);
      setStatus("success");
    } catch (error) {
      console.log(error);
      setStatus("error");
    }
  }

  const handleSuggestTitles = () => {
    if (dataSuggestions && dataSearch) askGpt(dataSuggestions, dataSearch);
  };

  return (
    <main className="p-4">
      {/* Title */}
      <h1 className="text-2xl text-center py-2 font-bold">
        Vendedores Mercadolibre Pro
        <span className="text-xs block font-light">
          Generador de títulos de productos
        </span>
      </h1>
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* term form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pb-2"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Termino de Búsqueda</FormLabel>
                  <FormControl>
                    <Input placeholder="Que deseas buscar?..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Este es tu termino de búsqueda para buscar productos en ML.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="uppercase">
              Consultar
            </Button>
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
              Estas son las sugerencias generadas por IA para los títulos de los
              productos en ML.
            </CardDescription>
            {/* Button Suggest Titles */}
            <Button
              className="uppercase"
              type="button"
              onClick={handleSuggestTitles}
              // disabled={!dataSuggestions && !dataSearch}
            >
              Generar Sugerencias de Títulos
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
                      <p className="text-xs">({title.length} caracteres)</p>
                    </div>
                  );
              })}
          </CardContent>
        </Card>

        {/* Generate Description Form */}
        <Form {...descriptionForm}>
          <form
            onSubmit={descriptionForm.handleSubmit(handleGenerateDescription)}
            className="space-y-5 pb-2"
          >
            <FormField
              control={descriptionForm.control}
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
                    Genera una descripción para el producto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="uppercase">
              Generar Descripción
            </Button>
          </form>
        </Form>

        {/* Image */}
        <div className="flex justify-center">
          {url && <img src={url} alt="product" className="w-1/3" />}
        </div>

        {/* Generate Description card */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción de Producto Generada</CardTitle>
            <CardDescription>
              Esta es la descripción generada por IA para el producto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {descriptionStatus === "loading" && <p>Cargando...</p>}
            {descriptionStatus === "error" && <p>Error...</p>}
            {descriptionStatus === "success" && descriptionResponse && (
              <Markdown remarkPlugins={[remarkGfm]} className="space-y-4">
                {descriptionResponse}
              </Markdown>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;

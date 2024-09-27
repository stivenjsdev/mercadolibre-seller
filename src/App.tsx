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
import { useForm } from "react-hook-form";

type FormData = {
  message: string;
};

function App() {
  // Response for the gpt request
  const [response, setResponse] = useState<string | null>("");

  // Status for the gpt request
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "success"
  );

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

  async function onSubmit(formData: FormData) {
    mutateSuggestions(formData.message);
    mutateSearch(formData.message);
    form.reset();
  }

  async function askGpt(dataSuggestion: SuggestionsResponse, dataSearch: SearchResponse) {
    if (!dataSuggestions && !dataSearch) return;

    setStatus("loading");

    try {
      const examples = dataSearch.results.map((item) => item.title).join(", ");
      console.log({examples});
      const values = dataSuggestion.suggested_queries.map((item) => item.q).join(", ");
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
              "You are an expert copywriter specializing in creating catchy and effective product titles for e-commerce platforms. Your goal is to generate concise, engaging, and keyword-rich titles that attract potential buyers and improve search engine visibility. These are some examples of product titles that you have created for a client: " + examples + ". Include in the titles all possible words from both the examples and the keywords",
          },
          {
            role: "user",
            content: `Genera 6 títulos de productos únicos, sin utilizar signos de puntuación, dos puntos, conectores, conjunciones, preposiciones, tildes y guiones ni caracteres especiales. Para cada título, selecciona palabras de una lista de palabras clave y utiliza todas las palabras claves y sus sinónimos que tengan sentido. Cada título debe ser claro, atractivo, y reflejar la idea de un producto real. la lista de palabras claves es la siguiente: ${values}`,
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
        Vendedores Mercadolibre
        <span className="text-xs block font-light">Generador de títulos de productos</span>
      </h1>
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* term form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
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
            <Button type="submit">Consultar</Button>
          </form>
        </Form>

        {/* suggestions card */}
        <Card>
          <CardHeader>
            <CardTitle>Sugerencias</CardTitle>
            <CardDescription>Estas son las sugerencias de búsqueda generadas por ML.</CardDescription>
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
            <CardDescription>Estos son los títulos de los productos encontrados en ML.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataSearch &&
              dataSearch.results.map((result) => (
                <p key={result.id} className="py-2">
                  {result.title} <span className="text-xs">({result.title.length} characters)</span>
                </p>
              ))}
          </CardContent>
        </Card>

        {/* suggested product title card */}
        <Card>
          <CardHeader>
            <CardTitle>Titulo de Producto Sugerido</CardTitle>
            <CardDescription>
              Estas son las sugerencias generadas por IA para los títulos de los productos en ML.
            </CardDescription>
            {/* Button Suggest Titles */}
            <Button type="button" onClick={handleSuggestTitles} disabled={!dataSuggestions && !dataSearch}>
              Sugerir Títulos
            </Button>
          </CardHeader>
          <CardContent>
            {status === "loading" && <p>Loading...</p>}
            {status === "error" && <p>Error...</p>}
            {status === "success" &&
              response &&
              response.split("\n").map((title, index) => {
                if (title)
                  return (
                    <div className="p-3" key={index}>
                      <p>{title.trim()} </p>
                      <p className="text-xs">({title.length} characters)</p>
                    </div>
                  );
              })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;

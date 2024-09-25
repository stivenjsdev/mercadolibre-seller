import { getSuggestions } from "@/api/MLSuggestAPI";
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
import { SuggestionsResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { OpenAI } from "openai";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  message: string;
};

function App() {
  const [response, setResponse] = useState<string | null>("");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "success"
  );
  const { data, mutate } = useMutation({
    mutationFn: getSuggestions,
    onError: (error) => {
      console.error("Error:", error);
    },
    onSuccess: (data) => {
      console.log("getSuggestions Success");
      if (!data) return;
      console.log("asking gpt");
      askGpt(data);
    },
  });

  const form = useForm<FormData>({
    defaultValues: {
      message: "",
    },
  });

  async function onSubmitSuggestions(formData: FormData) {
    mutate(formData.message);
    form.reset();
  }

  async function askGpt(data: SuggestionsResponse) {
    if (!data) return;

    setStatus("loading");

    try {
      const values = data.suggested_queries.map((item) => item.q).join(", ");
      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert copywriter specializing in creating catchy and effective product titles for e-commerce platforms. Your goal is to generate concise, engaging, and keyword-rich titles that attract potential buyers and improve search engine visibility, remove connectors int the responses and signs, maximum 60 characters.",
          },
          {
            role: "user",
            content: `Generate four titles for a product with the following keywords: ${values}. In Spanish`,
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

  return (
    <main className="p-4">
      <h1 className="text-2xl text-center py-2 font-bold">
        MercadoLibre Sellers
      </h1>
      <div className="w-full max-w-md mx-auto space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitSuggestions)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Term</FormLabel>
                  <FormControl>
                    <Input placeholder="search term..." {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your search term to search products in ML.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>

        <Card>
          <CardHeader>
            <CardTitle>Suggestions</CardTitle>
            <CardDescription>This is your suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            {data &&
              data.suggested_queries.map((suggested_query, index) => (
                <p key={index}>{suggested_query.q}</p>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Product Title</CardTitle>
            <CardDescription>
              This is your suggested product title
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && <p>Loading...</p>}
            {status === "error" && <p>Error...</p>}
            {status === "success" && <p>{response}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;

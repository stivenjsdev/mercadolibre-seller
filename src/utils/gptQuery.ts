import { OpenAI } from "openai";

export const gptQuery = async (
  body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => {
  try {
    // create a OpenAI API client
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    });

    // make a request to the OpenAI API, recibe an output/completion
    const completion = await openai.chat.completions.create(body);
    console.log("gpt completion: ", completion.choices[0].message);

    // return the response from the API
    return {
      message: completion.choices[0].message.content,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Unknown Error in gptQuery");
    }
  }
};

import axios from "axios";
import { workspace } from "vscode";

let cache: {
  [language: string]: {
    [text: string]: TranslatorResponse;
  };
} = {};

export interface TranslatorResponse {
  detectedLanguage: {
    language: string;
    score: number;
  };
  translations: [
    {
      to: string;
      text: string;
    }
  ];
}

export const translateString = async (
  text: string,
  language: string
): Promise<TranslatorResponse | undefined> => {
  const key = workspace.getConfiguration("vs-babelfish").get("key");
  const region = workspace.getConfiguration("vs-babelfish").get("region");

  if (!key || !region) return Promise.resolve(undefined)
  if (!(language in cache)) {
    cache[language] = {};
  } else if (language in cache && text in cache[language]) {
    return cache[language][text];
  }

  const result = await axios.post(
    `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${language}`,
    JSON.stringify([{ text: text }]),
    {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-type": "application/json",
        "Ocp-Apim-Subscription-Region": region,
      },
    }
  );
  console.log(`Queried for ${text}`);

  cache[language][text] = result.data[0];
  return result.data[0];
};

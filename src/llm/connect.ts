import OpenAI from "openai";
import dotenv from "dotenv"

dotenv.config();

export const openai = new OpenAI({
      baseURL: process.env.BASE_URL,
      apiKey: process.env.API_KEY,
});
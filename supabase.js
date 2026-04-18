import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file or deployment environment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

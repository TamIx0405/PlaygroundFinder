import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xmaoeawdylighfwllrwa.supabase.cotps://your-project-url.supabase.co";
const supabaseAnonKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYW9lYXdkeWxpZ2hmd2xscndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyOTg0MTEsImV4cCI6MjA1Nzg3NDQxMX0.jRrQLGbmGWxk1h8R7qVfjiLQy974hWQXE6HheFpnKwI
;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


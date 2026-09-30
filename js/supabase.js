const SUPABASE_URL =
    "https://bhurwlmyamicgdcfuoyp.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXJ3bG15YW1pY2dkY2Z1b3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MzM0NTgsImV4cCI6MjEwNjMwOTQ1OH0.xj4VxUKTWwvU_OgbDCYjA6TyWAvP1IT_GLzUreIO6Sk";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
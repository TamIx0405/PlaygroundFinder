import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    const deletionResults = [];

    // Delete each user
    for (const user of users.users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      deletionResults.push({
        id: user.id,
        email: user.email,
        success: !deleteError,
        error: deleteError?.message
      });
    }

    return new Response(
      JSON.stringify({
        message: `Deleted ${users.users.length} users`,
        results: deletionResults
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }
});
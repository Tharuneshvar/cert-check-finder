/// <reference types="https://deno.land/x/service_worker@0.1.0/lib.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificationId } = await req.json();

    if (!certificationId) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: 'Certification ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the certifications table
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('certification_id', certificationId)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: 'Error checking certification' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (data) {
      return new Response(
        JSON.stringify({ 
          verified: true, 
          message: '🔒 Zer0 Trace Found! This certification has been verified in our secure database.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: '❌ No matching certification found. This certificate may be invalid or not registered.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in verify-certification function:', error);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        message: 'An error occurred during verification' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
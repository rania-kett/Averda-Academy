import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, language, speed = 1.0 } = body;

    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required and must be a string' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: 'Text too long (max 5000 characters)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (language && typeof language !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid language parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof speed !== 'number' || speed < 0.5 || speed > 2.0) {
      return new Response(JSON.stringify({ error: 'Speed must be a number between 0.5 and 2.0' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const getVoiceId = (lang: string) => {
      switch (lang) {
        case 'ar':
        case 'ma':
          return 'JBFqnCBsd6RMkjVDRZzb';
        case 'fr':
        default:
          return 'EXAVITQu4vr4xnSDxMaL';
      }
    };
    
    const voiceId = getVoiceId(language);
    const clampedSpeed = Math.max(0.7, Math.min(1.2, speed));
    
    console.log(`Generating speech for language: ${language}, speed: ${clampedSpeed}, text length: ${text.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: clampedSpeed,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(arrayBuffer);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in text-to-speech function:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


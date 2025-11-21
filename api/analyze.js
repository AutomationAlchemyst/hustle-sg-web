export const config = {
    runtime: 'edge', // Runs on Vercel's global edge network (faster, cheaper)
};

export default async function handler(req) {
    console.log("--- ANALYZE FUNCTION STARTED ---");
    // 1. CORS Headers (Optional but good practice if you expand later)
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle OPTIONS request (Preflight)
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Only allow POST requests
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
        // 3. Parse the incoming data from the game
        const { prompt } = await req.json();
        
        // 4. Get the secret key from Vercel's environment (The Safe)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server misconfigured' }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        // 5. Call Google Gemini securely from the server
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${errorText}`);
        }

        // 6. Send the result back to the game
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to fetch intel' }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
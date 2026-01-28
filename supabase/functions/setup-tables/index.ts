Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const createMoodsTable = `
      CREATE TABLE IF NOT EXISTS moods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        mood_type TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "moods_all" ON moods;
      CREATE POLICY "moods_all" ON moods FOR ALL USING (true) WITH CHECK (true);
    `;

    const createLikesTable = `
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        post_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT likes_unique UNIQUE(user_id, post_id)
      );
      ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "likes_all" ON likes;
      CREATE POLICY "likes_all" ON likes FOR ALL USING (true) WITH CHECK (true);
    `;

    const results = [];

    for (const sql of [createMoodsTable, createLikesTable]) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        // Try direct postgres query
        const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        results.push({ sql: sql.substring(0, 50), status: pgResponse.status });
      } else {
        results.push({ sql: sql.substring(0, 50), status: response.status });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

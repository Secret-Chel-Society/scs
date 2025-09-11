export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No or invalid authorization header")
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "")
    
    if (!token) {
      console.error("No token found in authorization header")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Create Supabase client with the token
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {},
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    )
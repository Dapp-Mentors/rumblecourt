// Opik API route for evaluation and tracing
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    // TODO: Implement Opik evaluation functionality
    return Response.json({
      message: "Opik evaluation endpoint not yet implemented",
      received: body
    });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
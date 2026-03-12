import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 })
  }

  const { messages, language, weatherContext } = await req.json()

  const systemPrompt = `You are Farm Sage, an expert AI agricultural assistant dedicated to helping farmers.
Your expertise covers:
- Crop disease identification and treatment
- Weather-based farming advice
- Pest and weed control
- Fertilizer and irrigation recommendations
- Soil health and crop rotation
- Harvest timing and post-harvest care
- Local farming best practices

Current environmental conditions at the farmer's location:
${weatherContext.location ? `Location: ${weatherContext.location}` : ""}
${weatherContext.temperature !== null ? `Temperature: ${weatherContext.temperature}°C` : ""}
${weatherContext.humidity !== null ? `Humidity: ${weatherContext.humidity}%` : ""}
${weatherContext.rainfall !== null ? `Recent Rainfall: ${weatherContext.rainfall}mm` : ""}

Always give practical, actionable advice tailored to these conditions.
Respond in ${language}. Keep responses concise and easy to understand for farmers.`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://farm-sage.app",
      "X-Title": "Farm Sage AI Assistant",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 512,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: response.status })
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response."
  return NextResponse.json({ reply })
}

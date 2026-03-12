"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Camera, Leaf, MessageCircle, CloudRain, Mic, Send, Upload, Thermometer, Droplets, MapPin, Navigation } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface WeatherData {
  temperature: number | null
  humidity: number | null
  rainfall: number | null
}

export default function FarmSagePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherData>({ temperature: null, humidity: null, rainfall: null })
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [locationMode, setLocationMode] = useState<"auto" | "manual">("auto")
  const [manualCoords, setManualCoords] = useState("")
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! I'm Farm Sage. How can I help you today?" },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchWeatherAndPlace = async (latitude: number, longitude: number) => {
    setWeatherLoading(true)
    setWeatherError(null)
    setPlaceName(null)
    try {
      const [weatherRes, geoRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`
        ),
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        ),
      ])
      const data = await weatherRes.json()
      const geoData = await geoRes.json()
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        rainfall: data.current.precipitation,
      })
      const addr = geoData.address
      const parts = [addr?.village, addr?.town, addr?.city, addr?.county, addr?.state, addr?.country].filter(Boolean)
      setPlaceName(parts.length > 0 ? parts.join(", ") : null)
    } catch {
      setWeatherError("Failed to fetch weather")
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleManualFetch = () => {
    const [rawLat, rawLng] = manualCoords.split(",").map((s) => s.trim())
    const lat = parseFloat(rawLat)
    const lng = parseFloat(rawLng)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setWeatherError("Invalid format. Paste as: 10.600734, 77.544934")
      return
    }
    fetchWeatherAndPlace(lat, lng)
  }

  useEffect(() => {
    if (locationMode !== "auto") return
    if (!navigator.geolocation) {
      setWeatherError("Geolocation not supported")
      setWeatherLoading(false)
      return
    }
    setWeatherLoading(true)
    setWeatherError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherAndPlace(position.coords.latitude, position.coords.longitude)
      },
      () => {
        setWeatherError("Location access denied")
        setWeatherLoading(false)
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationMode])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async () => {
    const text = inputMessage.trim()
    if (!text || isChatLoading) return
    const updatedMessages = [...messages, { role: "user", content: text }]
    setMessages(updatedMessages)
    setInputMessage("")
    setIsChatLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          language: selectedLanguage,
          weatherContext: {
            location: placeName,
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
          },
        }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.error ? `Error: ${data.error}` : data.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect to the AI. Please try again." },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isChatLoading])

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Voice recording logic would go here
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Farm Sage</h1>
              <p className="text-xs text-muted-foreground">AI Agricultural Assistant</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Environmental Context Widget */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Environmental Context</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {weatherLoading ? "Fetching..." : weatherError ? "Unavailable" : "Live Data"}
              </Badge>
            </div>
            {/* Location Mode Toggle */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={locationMode === "auto" ? "default" : "outline"}
                className={`flex-1 h-8 text-xs ${locationMode !== "auto" ? "bg-transparent" : ""}`}
                onClick={() => { setLocationMode("auto"); setWeatherError(null) }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                My Location
              </Button>
              <Button
                size="sm"
                variant={locationMode === "manual" ? "default" : "outline"}
                className={`flex-1 h-8 text-xs ${locationMode !== "manual" ? "bg-transparent" : ""}`}
                onClick={() => { setLocationMode("manual"); setWeatherError(null) }}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Enter Coordinates
              </Button>
            </div>
            {locationMode === "manual" && (
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Paste coordinates (e.g. 10.6007, 77.5449)"
                  value={manualCoords}
                  onChange={(e) => setManualCoords(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualFetch()}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleManualFetch}
                  disabled={weatherLoading}
                >
                  Go
                </Button>
              </div>
            )}
            <CardDescription className="text-xs pt-1">
              {weatherError ? (
                <span className="text-destructive">{weatherError}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {weatherLoading ? "Detecting location..." : placeName ?? "Real-time weather conditions"}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 rounded-lg bg-muted p-3">
                <Thermometer className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">
                    {weatherLoading ? "--" : weather.temperature !== null ? `${weather.temperature}°C` : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg bg-muted p-3">
                <Droplets className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">
                    {weatherLoading ? "--" : weather.humidity !== null ? `${weather.humidity}%` : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg bg-muted p-3">
                <CloudRain className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">
                    {weatherLoading ? "--" : weather.rainfall !== null ? `${weather.rainfall}mm` : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Rainfall</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disease Diagnosis */}
        <Card className="border-primary/20 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Disease Diagnosis</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Upload or capture leaf images for AI-powered disease detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedImage ? (
              <div className="space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt="Uploaded leaf"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Analysis Result</p>
                    <Badge className="bg-primary text-primary-foreground">95% Confidence</Badge>
                  </div>
                  <p className="text-sm text-foreground font-medium">Early Blight Detected</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recommendation: Remove affected leaves, apply copper-based fungicide, and ensure proper spacing for
                    air circulation.
                  </p>
                </div>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setSelectedImage(null)}>
                  Analyze Another Image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-3 p-6">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">Upload or capture a leaf image</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label htmlFor="camera-input">
                    <Button
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <span>
                        <Camera className="mr-2 h-4 w-4" />
                        Camera
                      </span>
                    </Button>
                    <input
                      id="camera-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <label htmlFor="upload-input">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </span>
                    </Button>
                    <input
                      id="upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multilingual Chat Interface */}
        <Card className="border-primary/20 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">AI Assistant Chat</CardTitle>
            </div>
            <CardDescription className="text-xs">Ask questions in your language with voice or text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[85%] ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-3 bg-muted text-foreground">
                    <div className="flex gap-1 items-center">
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`shrink-0 ${isRecording ? "bg-destructive text-destructive-foreground" : ""}`}
                onClick={handleVoiceInput}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type your question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
                disabled={isChatLoading}
              />
              <Button
                size="icon"
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSendMessage}
                disabled={isChatLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Language Selection */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "English", value: "English" },
                { label: "हिन्दी", value: "Hindi" },
                { label: "తెలుగు", value: "Telugu" },
                { label: "தமிழ்", value: "Tamil" },
                { label: "मराठी", value: "Marathi" },
              ].map(({ label, value }) => (
                <Badge
                  key={value}
                  variant={selectedLanguage === value ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedLanguage === value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary hover:text-primary-foreground"
                  }`}
                  onClick={() => setSelectedLanguage(value)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

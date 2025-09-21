// Dynamic, time-aware greetings for Bob that adapt to Oliver's context
export function getBobGreeting(): string {
  const hour = new Date().getHours()
  const day = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = day === 0 || day === 6

  // Late night (11 PM - 3 AM) - Developer hours
  if (hour >= 23 || hour < 3) {
    const lateNightGreetings = [
      "happy late night, oliver ✨",
      "bob here - burning the midnight oil again?",
      "late night coding with bob?",
      "hey oliver, the best ideas come after midnight",
      "bob's nocturnal mode: activated for oliver",
      "oliver & bob's witching hour workspace",
    ]
    return lateNightGreetings[Math.floor(Math.random() * lateNightGreetings.length)]
  }

  // Early morning (3 AM - 6 AM) - The dedicated hours
  if (hour >= 3 && hour < 6) {
    const earlyMorningGreetings = [
      "incredibly early start, oliver",
      "bob's impressed - you're up before the sun ☀️",
      "oliver & bob: dedication level maximum",
      "the world is still sleeping, but bob's here",
      "early bird oliver gets the breakthrough",
    ]
    return earlyMorningGreetings[Math.floor(Math.random() * earlyMorningGreetings.length)]
  }

  // Morning (6 AM - 10 AM)
  if (hour >= 6 && hour < 10) {
    const morningGreetings = [
      "morning, oliver ☕",
      "bob's ready - let's build something amazing?",
      "fresh coffee, fresh code, fresh bob",
      "oliver & bob: let's make today productive",
      "morning energy activated with bob",
      "what's first on the agenda, oliver?",
    ]
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)]
  }

  // Late morning/Early afternoon (10 AM - 2 PM)
  if (hour >= 10 && hour < 14) {
    const midDayGreetings = [
      "hey oliver, what are we building today?",
      "midday momentum - bob & oliver time",
      "ready to tackle challenges together?",
      "productivity hours with your pal bob",
      "let's dive into something interesting, oliver",
      "what's capturing oliver's attention?",
    ]
    return midDayGreetings[Math.floor(Math.random() * midDayGreetings.length)]
  }

  // Afternoon (2 PM - 6 PM)
  if (hour >= 14 && hour < 18) {
    const afternoonGreetings = [
      "afternoon focus session with bob?",
      "bob & oliver: let's solve something together",
      "afternoon innovation time",
      "what's capturing oliver's attention?",
      "ready for some deep work together?",
      "time for oliver & bob to make progress",
    ]
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)]
  }

  // Evening (6 PM - 11 PM)
  if (hour >= 18 && hour < 23) {
    const eveningGreetings = isWeekend ? [
      "weekend evening vibes with bob ✨",
      "relaxed weekend coding session?",
      "weekend project time - oliver & bob",
      "evening creativity session",
      "weekend oliver has arrived (bob's excited)",
    ] : [
      "evening, oliver",
      "winding down or ramping up with bob?",
      "evening innovation hour",
      "time for some side projects, oliver?",
      "after-hours genius time with bob",
      "let's build something cool together",
    ]
    return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)]
  }

  // Fallback - should never hit this but just in case
  return "hey oliver, bob's here - what's brewing?"
}

// Dynamic placeholders for the chat input
export function getBobPlaceholder(): string {
  const hour = new Date().getHours()

  if (hour >= 23 || hour < 6) {
    const placeholders = [
      "night owl thoughts...",
      "what's keeping you up?",
      "late night inspiration?",
      "midnight ideas welcome",
    ]
    return placeholders[Math.floor(Math.random() * placeholders.length)]
  }

  if (hour >= 6 && hour < 12) {
    const placeholders = [
      "morning thoughts?",
      "today's mission?",
      "what shall we build?",
      "coffee and code ideas...",
    ]
    return placeholders[Math.floor(Math.random() * placeholders.length)]
  }

  if (hour >= 12 && hour < 18) {
    const placeholders = [
      "afternoon challenges?",
      "what's interesting today?",
      "ready to dive deep?",
      "innovation on your mind?",
    ]
    return placeholders[Math.floor(Math.random() * placeholders.length)]
  }

  // Evening
  const placeholders = [
    "evening projects?",
    "what's brewing?",
    "creative ideas?",
    "time to experiment?",
  ]
  return placeholders[Math.floor(Math.random() * placeholders.length)]
}
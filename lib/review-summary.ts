import 'server-only'

const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export type BranchSummary = {
  /** Two or three sentences a manager can read at a glance. */
  summary: string
  /** What customers consistently praise. */
  praise: string[]
  /** Recurring problems worth acting on. */
  issues: string[]
  sentiment: 'Excellent' | 'Good' | 'Mixed' | 'Poor' | ''
}

export type ReviewForSummary = {
  rating: number
  comment: string
  createdAt: string
}

// Enough reviews to be representative without an unbounded prompt. Newest
// first, because what a branch is like now matters more than three years ago.
const MAX_REVIEWS_IN_PROMPT = 60
const MAX_COMMENT_CHARS = 300

function sentimentFromAverage(average: number): BranchSummary['sentiment'] {
  if (average >= 4.6) return 'Excellent'
  if (average >= 4.2) return 'Good'
  if (average >= 3.4) return 'Mixed'
  return 'Poor'
}

/**
 * Summarises one branch's Google reviews for the admin dashboard.
 *
 * Returns null when the model is unavailable — almost always the free tier's
 * per-minute cap. Null means "try again later": a caller should keep whatever
 * summary is already stored rather than overwrite a real summary with a
 * placeholder.
 */
export async function summariseBranchReviews(params: {
  branchName: string
  averageRating: number
  reviews: ReviewForSummary[]
}): Promise<BranchSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const withText = params.reviews.filter((review) => review.comment.trim())
  const sentiment = sentimentFromAverage(params.averageRating)

  // Nothing to read. Star ratings alone still give a usable verdict, so report
  // that rather than calling the model with an empty prompt.
  if (!apiKey || withText.length === 0) {
    return {
      summary: withText.length === 0 && params.reviews.length > 0
        ? `${params.reviews.length} rating${params.reviews.length === 1 ? '' : 's'} with no written comments, averaging ${params.averageRating.toFixed(1)} stars.`
        : 'Not enough reviews to summarise yet.',
      praise: [],
      issues: [],
      sentiment: params.reviews.length > 0 ? sentiment : '',
    }
  }

  const sample = withText
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_REVIEWS_IN_PROMPT)
    .map((review) => `- [${review.rating}/5] ${review.comment.trim().slice(0, MAX_COMMENT_CHARS)}`)
    .join('\n')

  const prompt = `You are analysing Google reviews for one branch of HME, a licensed Malaysian currency exchange and money transfer business. Summarise what customers actually say, for the business owner.

Branch: ${params.branchName}
Average rating: ${params.averageRating.toFixed(2)} out of 5 across ${params.reviews.length} review(s)

Reviews (newest first, some may be in Malay, Chinese or other languages — read them all and answer in English):
${sample}

Return ONLY a JSON object, no markdown fence, in exactly this shape:
{"summary": "2-3 sentences describing what customers experience at this branch", "praise": ["short phrase", "short phrase"], "issues": ["short phrase", "short phrase"]}

Rules:
- "praise" lists what customers repeatedly compliment. "issues" lists recurring problems. Two to four short phrases each, three or four words apiece.
- Base everything on what the reviews say. Do not invent problems that are not mentioned, and do not soften real complaints.
- If there are no recurring complaints, return an empty array for "issues". Do not pad it.
- Never name individual staff members.`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // gemini-flash-latest resolves to a reasoning model that spends output
        // tokens thinking before it emits anything. The budget must clear that
        // with headroom or the JSON comes back truncated and unparseable.
        generationConfig: { temperature: 0.3, maxOutputTokens: 3000, responseMimeType: 'application/json' },
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') return null
    const text = candidate?.content?.parts?.[0]?.text
    if (typeof text !== 'string' || !text.trim()) return null

    const parsed = JSON.parse(text) as { summary?: unknown; praise?: unknown; issues?: unknown }
    const list = (value: unknown) => Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4)
      : []
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    if (!summary) return null

    return { summary, praise: list(parsed.praise), issues: list(parsed.issues), sentiment }
  } catch {
    // Bad JSON or a network failure — treat it as "try again later".
    return null
  }
}

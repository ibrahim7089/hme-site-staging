import 'server-only'

const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export type ReviewForReply = {
  branchName: string
  reviewerName: string
  rating: number
  comment: string
}

function templateReply({ branchName, reviewerName, rating, comment }: ReviewForReply) {
  const name = reviewerName?.trim() || 'there'
  const branch = branchName?.trim() || 'HME'
  if (rating >= 5) {
    return `Hi ${name}, thank you so much for the 5-star review and for choosing ${branch}! We're delighted to hear about your experience and look forward to serving you again. — HME Team`
  }
  if (rating >= 4) {
    return `Hi ${name}, thank you for your feedback and for visiting ${branch}. We're glad you had a good experience overall, and we'll keep working to make it even better next time. — HME Team`
  }
  const acknowledgement = comment?.trim()
    ? "We're sorry to hear about your experience and take your feedback seriously."
    : "We're sorry your visit didn't meet expectations."
  return `Hi ${name}, ${acknowledgement} Please reach out to us at info@hmeremit.com.my so we can look into this and make things right. — HME Team`
}

export async function draftReviewReply(review: ReviewForReply): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return templateReply(review)

  const prompt = `You are replying, as HME (a licensed Malaysian currency exchange and money transfer business), to a public Google review on one of our branches. Write a short, warm, professional reply (2-3 sentences max, no hashtags, no emojis, no markdown).

Branch: ${review.branchName || 'HME'}
Reviewer name: ${review.reviewerName || 'a customer'}
Star rating: ${review.rating} out of 5
Review text: ${review.comment ? `"${review.comment}"` : '(no written comment, star rating only)'}

Rules:
- If 4-5 stars: thank them warmly and briefly, mention the branch name naturally.
- If 3 stars or below: acknowledge their concern sincerely, apologise briefly, and invite them to contact info@hmeremit.com.my to resolve it. Do not get defensive or make excuses.
- Sign off as "— HME Team".
- Output ONLY the reply text, nothing else.`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 200 },
      }),
    })
    if (!response.ok) return templateReply(review)
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const trimmed = typeof text === 'string' ? text.trim() : ''
    return trimmed || templateReply(review)
  } catch {
    return templateReply(review)
  }
}

import 'server-only'

// Where unhappy customers are directed to take a complaint further.
const COMPLAINT_CONTACT_EMAIL = 'admin@hmeremit.com.my'

const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export type ReviewForReply = {
  branchName: string
  reviewerName: string
  rating: number
  comment: string
}

// Fixed list so the dashboard can actually aggregate "most common complaint".
// Free-text themes would splinter into hundreds of near-duplicates.
export const COMPLAINT_THEMES = [
  'Waiting time',
  'Exchange rate or fees',
  'Staff attitude',
  'Service mistake',
  'Opening hours',
  'Branch or facilities',
  'Cash availability',
  'Other',
] as const

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
  return `Hi ${name}, ${acknowledgement} Please reach out to us at ${COMPLAINT_CONTACT_EMAIL} so we can look into this and make things right. — HME Team`
}

/**
 * Returns the reply to post, or null when the model was unavailable (usually
 * the free tier's 20-requests-per-minute cap). Null means "try again later" —
 * deliberately not the template, because silently posting generic text to a
 * customer who wrote a detailed review is worse than replying a bit later.
 */
export async function draftReviewReply(review: ReviewForReply): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  // A star rating with no written comment gives the model nothing to respond
  // to and no language to match, so the template is equivalent — and skipping
  // the call matters at backlog scale, where thousands of ratings have no text.
  if (!apiKey || !review.comment.trim()) return templateReply(review)

  const prompt = `You are replying, as HME (a licensed Malaysian currency exchange and money transfer business), to a public Google review on one of our branches. Write a short, warm, professional reply (2-3 sentences max, no hashtags, no emojis, no markdown).

Branch: ${review.branchName || 'HME'}
Reviewer name: ${review.reviewerName || 'a customer'}
Star rating: ${review.rating} out of 5
Review text: ${review.comment ? `"${review.comment}"` : '(no written comment, star rating only)'}

Rules:
- Reply in the SAME language the reviewer used. A Malay review gets a Malay reply, a Chinese review a Chinese reply, an English review an English reply. Google sometimes supplies both a translation and the original text — match the original language the customer actually wrote in, and reply only in that one language.
- If 5 stars: thank them warmly and briefly, mention the branch name naturally.
- If 4 stars: thank them, and briefly acknowledge there is room to do better without being negative about the branch.
- If 3 stars or below: acknowledge their concern sincerely, apologise briefly, and invite them to contact ${COMPLAINT_CONTACT_EMAIL} to resolve it. Do not get defensive or make excuses.
- Whenever the review raises a complaint of any kind — at any star rating, and especially about a staff member or how the customer was treated — include ${COMPLAINT_CONTACT_EMAIL} so it reaches management directly, and say it will be looked into. Never name, blame or defend the staff member.
- Sign off as "— HME Team".
- Output ONLY the reply text, nothing else.`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // gemini-flash-latest resolves to a reasoning model that spends output
        // tokens on internal thinking before emitting any reply text — measured
        // between ~500 (5-star) and ~1000 (detailed complaint). The budget must
        // clear that with headroom, or the visible reply comes back empty or
        // cut off mid-sentence.
        generationConfig: { temperature: 0.6, maxOutputTokens: 2500 },
      }),
    })
    // Rate limited or otherwise unavailable — defer rather than downgrade.
    if (!response.ok) return null
    const data = await response.json()

    // A truncated draft must never reach a customer — 5-star replies post to
    // Google automatically, so half a sentence would go out publicly under the
    // HME name. Anything short of a clean stop is retried later instead.
    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') return null
    const text = candidate?.content?.parts?.[0]?.text
    const trimmed = typeof text === 'string' ? text.trim() : ''
    return trimmed || null
  } catch {
    return null
  }
}

/**
 * Buckets a negative review into one of COMPLAINT_THEMES so the dashboard can
 * report what customers complain about most. Returns '' when it cannot be
 * determined, which keeps the review out of the theme breakdown rather than
 * inventing a category for it.
 */
export async function classifyComplaint(review: ReviewForReply): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey || !review.comment.trim()) return ''

  const prompt = `Classify the main complaint in this customer review of a Malaysian currency exchange branch.

Review (${review.rating} out of 5 stars): "${review.comment}"

Choose exactly ONE category from this list, copied verbatim:
${COMPLAINT_THEMES.join('\n')}

The review may be in English, Malay or Chinese. Output ONLY the chosen category, nothing else.`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 2000 },
      }),
    })
    if (!response.ok) return ''
    const data = await response.json()
    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') return ''
    const raw = String(candidate?.content?.parts?.[0]?.text || '').trim()
    // Only accept an exact known theme — a hallucinated label would pollute the
    // aggregation it exists to feed.
    return COMPLAINT_THEMES.find((theme) => theme.toLowerCase() === raw.toLowerCase()) || ''
  } catch {
    return ''
  }
}

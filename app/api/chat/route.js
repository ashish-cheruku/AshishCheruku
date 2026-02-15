import Groq from 'groq-sdk';
import { portfolioData } from '@/lib/portfolio-data';

// ===================== RATE LIMITER =====================
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;     // per window per IP
const ipRequestMap = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    if (!ipRequestMap.has(ip)) {
        ipRequestMap.set(ip, []);
    }
    const timestamps = ipRequestMap.get(ip).filter(t => now - t < WINDOW_MS);
    ipRequestMap.set(ip, timestamps);

    if (timestamps.length >= MAX_REQUESTS) {
        return true;
    }
    timestamps.push(now);
    return false;
}

// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequestMap.entries()) {
        const active = timestamps.filter(t => now - t < WINDOW_MS);
        if (active.length === 0) {
            ipRequestMap.delete(ip);
        } else {
            ipRequestMap.set(ip, active);
        }
    }
}, 5 * 60 * 1000);

// ===================== PORTFOLIO CONTEXT =====================
function buildPortfolioContext() {
    let context = `Name: Ashish Kumar Cheruku\nEmail: ${portfolioData.contact.email}\n`;
    context += `LinkedIn: ${portfolioData.contact.linkedin}\nGitHub: ${portfolioData.contact.github}\nX/Twitter: ${portfolioData.contact.twitter}\n\n`;
    context += `About:\n${portfolioData.about}\n\n`;

    context += `Education:\n`;
    portfolioData.education.forEach(edu => {
        context += `- ${edu.school}: ${edu.degree} (${edu.details})\n`;
    });

    context += `\nExperience:\n`;
    portfolioData.experience.forEach(exp => {
        context += `- ${exp.role}${exp.company ? ' at ' + exp.company : ''} (${exp.period})\n`;
        exp.desc.forEach(d => { context += `  • ${d.replace(/<[^>]*>/g, '')}\n`; });
    });

    context += `\nProjects:\n`;
    portfolioData.projects.forEach(p => {
        context += `- ${p.name} (${p.tech})\n`;
        p.desc.forEach(d => { context += `  • ${d.replace(/<[^>]*>/g, '')}\n`; });
    });

    context += `\nSkills:\n`;
    for (const category in portfolioData.skills) {
        context += `- ${category}: ${portfolioData.skills[category].join(', ')}\n`;
    }

    context += `\nHobbies: ${portfolioData.hobbies}\n`;
    return context;
}

const portfolioContext = buildPortfolioContext();

// ===================== ROUTE HANDLER =====================
export async function POST(request) {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    if (isRateLimited(ip)) {
        return Response.json(
            { error: 'Rate limit exceeded. Please try again in a minute.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { prompt, conversationHistory } = body;

        // Input validation
        if (!prompt || typeof prompt !== 'string') {
            return Response.json({ error: 'Prompt is required.' }, { status: 400 });
        }
        if (prompt.length > 500) {
            return Response.json({ error: 'Prompt too long (max 500 characters).' }, { status: 400 });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const messages = [
            {
                role: 'system',
                content: `You are an AI assistant for Ashish Kumar Cheruku's portfolio website, displayed inside a terminal/console interface. Answer questions about Ashish's background, experience, skills, projects, and interests based on the following information. Be concise, friendly, and helpful.

IMPORTANT RULES:

1. SCOPE: You ONLY answer questions related to Ashish Kumar Cheruku — his background, experience, skills, projects, education, hobbies, and contact info. If someone asks about anything unrelated (e.g., general knowledge, coding questions, math, news, other people), politely decline and redirect. Example: "I'm Ashish's portfolio assistant, so I can only help with questions about him! Try asking about his experience, skills, or projects."

2. RESUME: If someone asks for Ashish's resume or CV, respond with: "You can download Ashish's resume here: /CV_Ashish.pdf" — always include this exact path.

3. IMAGE/PHOTO: If someone asks to see Ashish, his photo, image, picture, or what he looks like, respond with EXACTLY this text on its own line, nothing else before or after it: [SHOW_CREATOR_ART]
Do NOT attempt to create or reproduce any ASCII art yourself. Just respond with [SHOW_CREATOR_ART] and the terminal will display it automatically.

4. FORMATTING:
- Do NOT use markdown formatting like **bold**, *italic*, ##headers, or code blocks
- Use plain text only. The terminal does not render markdown.
- For lists, use simple dashes or numbers (1. 2. 3.)
- For emphasis, just use CAPS or put the word in context
- Keep responses concise and terminal-friendly

Portfolio Data:
${portfolioContext}`
            }
        ];

        // Add conversation history (limit to last 6 turns to save tokens)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recentHistory = conversationHistory.slice(-6);
            recentHistory.forEach(item => {
                messages.push({
                    role: item.role === 'assistant' ? 'assistant' : 'user',
                    content: String(item.text).slice(0, 500)
                });
            });
        }

        messages.push({ role: 'user', content: prompt });

        // Get response from Groq (compound-beta doesn't support streaming)
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'compound-beta',
            temperature: 0.7,
            max_completion_tokens: 1024,
        });

        const content = chatCompletion.choices[0]?.message?.content || '';

        return new Response(content, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Error in Groq chat:', error);
        return Response.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}

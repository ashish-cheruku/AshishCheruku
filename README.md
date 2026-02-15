# Ashish Kumar Cheruku — Interactive AI Portfolio

A terminal-style portfolio website built with **Next.js 14**, featuring an AI assistant powered by **Groq (Llama 3.3 70B)** that can answer questions about my professional background in real-time.

---

## Key Features

* **🤖 AI Chat Assistant** — Powered by **Groq** with inline portfolio context. Ask natural-language questions and get streamed, conversational answers.
* **💻 Dual Interface** — Switch between a retro **Terminal View** (commands like `help`, `projects`, `skills`) and a modern **GUI View** with tabs.
* **🎨 Dark Mode** — Toggle between light and dark themes. Dark mode features a hacker-style black background with green text and orange accents.
* **🛡️ API Abuse Protection** — In-memory sliding-window rate limiter (10 req/min per IP) + input validation.
* **🌐 Live Data** — Real-time clock and local weather display.
* **✨ Dynamic UI** — Animated network-particle background, CRT scanlines, and retro sound effects.
* **📱 Fully Responsive** — Works across desktop, tablet, and mobile.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Frontend** | React, Vanilla CSS |
| **AI** | Groq SDK — Llama 3.3 70B Versatile |
| **Backend** | Next.js API Routes (serverless) |
| **Hosting** | Vercel (recommended) |

---

## Project Structure

```
Portfolio/
├── app/
│   ├── api/chat/route.js    # Groq AI endpoint + rate limiter
│   ├── globals.css           # All styles (light + dark mode)
│   ├── layout.js             # Root layout + metadata
│   └── page.js               # Renders Terminal component
├── components/
│   └── Terminal.jsx          # Full terminal UI (client component)
├── lib/
│   └── portfolio-data.js    # Portfolio data (edit this to customize)
├── public/
│   ├── CV_Ashish.pdf         # Resume PDF
│   └── headshot.png          # Headshot image
├── next.config.mjs
├── jsconfig.json
└── package.json
```

---

## Local Setup 🚀

### Prerequisites

* **Node.js** (v18+) — [nodejs.org](https://nodejs.org/)
* **Groq API Key** — Get a free key from [console.groq.com](https://console.groq.com/)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashish-cheruku/Portfolio.git
   cd Portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List all available commands |
| `about` | About me |
| `education` | Education details |
| `experience` | Work experience |
| `projects` | Project showcase |
| `skills` | Technical skills |
| `hobbies` | Hobbies & interests |
| `resume` | Download resume link |
| `contact` | Contact information |
| `creator` | ASCII art |
| `all` | Show everything |
| `clear` | Clear the terminal |

You can also type **any question in plain English** and the AI assistant will respond.

---

## Deployment

Deploy to **Vercel** with one click:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add `GROQ_API_KEY` as an environment variable
4. Deploy

---

## Contact

* **LinkedIn:** [linkedin.com/in/ashish-k-cheruku](https://www.linkedin.com/in/ashish-k-cheruku/)
* **GitHub:** [github.com/ashish-cheruku](https://github.com/ashish-cheruku)
* **X / Twitter:** [x.com/Ashish_Cheruku](https://x.com/Ashish_Cheruku)
* **Email:** [achicheruku@gmail.com](mailto:achicheruku@gmail.com)
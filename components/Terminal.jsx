'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { portfolioData } from '@/lib/portfolio-data';

export default function Terminal() {
    const outputRef = useRef(null);
    const inputRef = useRef(null);
    const terminalRef = useRef(null);
    const guiModeRef = useRef(null);
    const canvasRef = useRef(null);
    const footerRef = useRef(null);
    const livePromptRef = useRef(null);
    const clockRef = useRef(null);

    const bootOverlayRef = useRef(null);

    // Refs for mutable state that persists across renders
    const commandHistoryRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const conversationHistoryRef = useRef([]);
    const audioCtxRef = useRef(null);
    const soundsReadyRef = useRef(false);
    const networkColorRef = useRef('74, 63, 54');
    const nodesRef = useRef([]);
    const mouseRef = useRef({ x: undefined, y: undefined });
    const hasBootedRef = useRef(false);
    const cursorRef = useRef(null);
    const konamiRef = useRef([]);
    const cwdRef = useRef('~');
    const completionDropdownRef = useRef(null);
    const isPartyModeRef = useRef(false);

    // GUI Mode State
    const [isGuiMode, setIsGuiMode] = useState(false);
    const [bootComplete, setBootComplete] = useState(false);

    const promptText = 'Ashish@linux ~ % ';

    const appendOutput = useCallback((html, isCommand = false) => {
        const outputEl = outputRef.current;
        if (!outputEl) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'output-entry';
        if (isCommand) {
            const promptSpan = `<span class="prompt-live">${promptText.replace(/ /g, '&nbsp;')}</span>`;
            const commandSpan = `<span class="command" style="white-space: pre-wrap; word-break: break-all;">${html}</span>`;
            const promptLine = document.createElement('div');
            promptLine.className = 'prompt-line-wrapper';
            promptLine.innerHTML = `${promptSpan}${commandSpan}`;
            wrapper.appendChild(promptLine);
        } else {
            wrapper.innerHTML = html.replace(/\\n\\n/g, '<br><br>').replace(/\\n/g, '<br>');
        }
        outputEl.appendChild(wrapper);
        window.scrollTo(0, document.body.scrollHeight);
    }, []);

    const handleThemeToggle = useCallback(() => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
        networkColorRef.current = isDark ? '0, 255, 65' : '74, 63, 54';
    }, []);

    const handleEmailCopy = useCallback(() => {
        navigator.clipboard.writeText('achicheruku@gmail.com').then(() => {
            appendOutput('<span class="command">✓ Email copied to clipboard:</span> achicheruku@gmail.com');
        });
    }, [appendOutput]);

    // ===================== GUI MODE LOGIC =====================
    const generateGuiContent = useCallback(() => {
        const guiModeEl = guiModeRef.current;
        if (!guiModeEl) return;
        guiModeEl.innerHTML = '';

        const skillIcons = {
            Fundamentals: '[]',
            Programming: '</>',
            'Web (Backend)': '{ }',
            'Web (Frontend)': '<UI>',
            DevOps: '>>'
        };

        const sections = {
            'About': portfolioData.about,
            'Experience': portfolioData.experience,
            'Projects': portfolioData.projects,
            'Skills': portfolioData.skills,
            'Education': portfolioData.education,
            'Hobbies': portfolioData.hobbies,
        };

        const hero = document.createElement('div');
        hero.className = 'gui-hero';
        const stats = [
            { label: 'Projects', value: portfolioData.projects.length },
            { label: 'Roles', value: portfolioData.experience.length },
            { label: 'Skill Tracks', value: Object.keys(portfolioData.skills).length },
        ];
        hero.innerHTML = `
            <div class="gui-hero-mark">
                <span class="gui-hero-monogram">AK</span>
                <span class="gui-hero-status">Open To Work</span>
            </div>
            <div class="gui-hero-copy">
                <h2 class="glitch-hover">Ashish Kumar Cheruku</h2>
                <p>AI + DevOps Engineer building high-performance, production-grade systems.</p>
            </div>
            <div class="gui-hero-stats">
                ${stats.map((stat) => `<div class="hero-stat"><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join('')}
            </div>
        `;

        const nav = document.createElement('div');
        nav.className = 'gui-tabs-nav';
        const contentContainer = document.createElement('div');
        contentContainer.className = 'gui-tabs-content';

        let isFirst = true;
        for (const sectionTitle in sections) {
            const sectionId = `gui-content-${sectionTitle.toLowerCase().replace(/ & /g, '-')}`;
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.textContent = sectionTitle;
            button.dataset.target = sectionId;
            nav.appendChild(button);

            const contentPanel = document.createElement('div');
            contentPanel.id = sectionId;
            contentPanel.className = 'tab-content';

            let html = '';
            if (sectionTitle === 'About') {
                const paragraphs = sections[sectionTitle]
                    .split('\n\n')
                    .map((text) => `<p>${text.replace(/\n/g, '<br>')}</p>`)
                    .join('');
                html = `<section class="gui-card about-panel">${paragraphs}</section>`;
            } else if (sectionTitle === 'Experience') {
                html = `<div class="timeline">`;
                sections[sectionTitle].forEach(e => {
                    html += `<div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content gui-card timeline-card">
                            <div class="gui-item-title glitch-hover">${e.role}${e.company ? ' @ ' + e.company : ''}</div>
                            <div class="gui-item-meta">${e.period}</div>
                            <ul class="gui-list">`;
                    e.desc.forEach(point => { html += `<li>${point}</li>`; });
                    html += `</ul></div></div>`;
                });
                html += `</div>`;
            } else if (sectionTitle === 'Projects') {
                sections[sectionTitle].forEach((p, index) => {
                    html += `<article class="gui-card project-card ${index === 0 ? 'project-featured' : ''}"><div class="gui-item-title glitch-hover">${p.name}</div><div class="gui-item-meta">${p.tech}</div><ul class="gui-list">`;
                    p.desc.forEach(d => { html += `<li>${d}</li>`; });
                    html += `</ul><a href="${p.url}" target="_blank" rel="noopener noreferrer" class="link project-link">View project -></a></article>`;
                });
            } else if (sectionTitle === 'Skills') {
                const skillLevels = {
                    'Python': 90, 'C/C++': 75, 'Javascript/Typescript': 85,
                    'Next.js': 88, 'React.js': 85, 'Node.js': 80, 'Express.js': 78,
                    'Django': 70, 'FastAPI': 72, 'HTML': 90, 'CSS': 82, 'Tailwind': 80,
                    'Docker': 82, 'Kubernetes': 78, 'Git & GitHub': 92, 'Nginx': 75,
                    'Keycloak': 70, 'Terraform': 65, 'Jenkins': 68, 'CI/CD': 80,
                    'DSA': 78, 'Operating Systems': 72, 'DBMS': 75,
                };
                for (const category in sections[sectionTitle]) {
                    html += `<article class="gui-card skills-panel"><div class="skills-subcategory-title"><span class="skill-icon">${skillIcons[category] || '::'}</span>${category}</div><div class="skills-grid">`;
                    sections[sectionTitle][category].forEach(skill => {
                        const level = skillLevels[skill] || 70;
                        html += `<div class="skill-box-wrap" title="${skill}: ${level}%">${skill}<div class="skill-bar-track"><div class="skill-bar-fill" style="--target-width:${level}%"></div></div></div>`;
                    });
                    html += '</div></article>';
                }
            } else if (sectionTitle === 'Education') {
                sections[sectionTitle].forEach(edu => {
                    html += `<article class="gui-card edu-card"><div class="gui-item-title">${edu.school}</div><div class="gui-item-meta">${edu.degree}</div><p>${edu.details}</p></article>`;
                });
            } else if (sectionTitle === 'Hobbies') {
                const hobbyChips = sections[sectionTitle]
                    .split(',')
                    .map((hobby) => `<span class="hobby-chip">${hobby.trim()}</span>`)
                    .join('');
                html = `<section class="gui-card hobbies-panel"><p>${sections[sectionTitle]}</p><div class="hobbies-grid">${hobbyChips}</div></section>`;
            }

            contentPanel.innerHTML = html;
            contentContainer.appendChild(contentPanel);

            if (isFirst) {
                button.classList.add('active');
                contentPanel.classList.add('active');
                isFirst = false;
            }
        }

        guiModeEl.appendChild(hero);
        guiModeEl.appendChild(nav);
        guiModeEl.appendChild(contentContainer);

        const footerClone = document.createElement('div');
        footerClone.id = 'gui-footer';
        footerClone.innerHTML = `&copy; ${new Date().getFullYear()} Ashish Kumar Cheruku. All rights reserved. | <a href="mailto:achicheruku@gmail.com" class="link">Contact Me</a>`;
        guiModeEl.appendChild(footerClone);

        // Skill bar + timeline IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        guiModeEl.querySelectorAll('.skill-bar-fill').forEach(el => observer.observe(el));
        guiModeEl.querySelectorAll('.timeline-item').forEach((el, i) => {
            el.style.transitionDelay = `${i * 0.1}s`;
            observer.observe(el);
        });

        // 3D tilt on project cards
        guiModeEl.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const rx = ((e.clientY - cy) / (rect.height / 2)) * 6;
                const ry = -((e.clientX - cx) / (rect.width / 2)) * 6;
                card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }, []);

    const handleGuiToggle = useCallback(() => {
        setIsGuiMode(prev => !prev);
    }, []);

    // Generate content when GUI mode is activated
    useEffect(() => {
        if (isGuiMode) generateGuiContent();
    }, [isGuiMode, generateGuiContent]);

    // Handle Tab Clicks (Delegation)
    useEffect(() => {
        const guiModeEl = guiModeRef.current;
        if (!guiModeEl) return;

        const handleTabClick = (e) => {
            if (!e.target.matches('.tab-button')) return;
            const buttons = guiModeEl.querySelectorAll('.tab-button');
            const contents = guiModeEl.querySelectorAll('.tab-content');
            buttons.forEach(btn => btn.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            const targetContent = document.getElementById(e.target.dataset.target);
            if (targetContent) targetContent.classList.add('active');
        };

        guiModeEl.addEventListener('click', handleTabClick);
        return () => guiModeEl.removeEventListener('click', handleTabClick);
    }, []);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // ===================== AUDIO =====================
        function initAudio() {
            if (soundsReadyRef.current) return;
            try {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                soundsReadyRef.current = true;
            } catch (e) { console.error('Web Audio API error:', e); }
        }

        function playSound(frequency, type, duration = 0.08, volume = 0.2) {
            if (!soundsReadyRef.current) return;
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
        }

        // ===================== PARTICLES =====================
        function createParticles(x, y, count = 20) {
            const container = document.getElementById('particles-container');
            if (!container) return;
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 80;
                p.style.setProperty('--dx', Math.cos(angle) * dist);
                p.style.setProperty('--dy', Math.sin(angle) * dist);
                p.style.left = x + 'px';
                p.style.top = y + 'px';
                container.appendChild(p);
                p.addEventListener('animationend', () => p.remove(), { once: true });
            }
        }

        function playTypingSound() {
            if (!soundsReadyRef.current) return;
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1900, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
        }

        // ===================== COMMANDS =====================
        function showHelp() {
            const cmds = [
                ['about', 'education', 'experience', 'projects', 'skills', 'hobbies'],
                ['resume', 'contact', 'creator', 'all', 'clear', 'history'],
                ['neofetch', 'whois', 'ping', 'ls', 'cd', 'cat', 'pwd'],
                ['hack', 'matrix', 'party', 'coffee', 'sudo', 'exit'],
            ];
            let helpText = `Available commands:<br>`;
            cmds.forEach(row => {
                helpText += '  ' + row.map(c => `<span class="command">${c}</span>`).join(', ') + '<br>';
            });
            helpText += `<br>Try the <span class="command">Konami code</span> for a surprise. Or just ask me anything in plain English.`;
            appendOutput(helpText);
        }
        function showAbout() { appendOutput(`<div class="skills-category-title">About Me</div>${portfolioData.about}`); }
        function showEducation() {
            let html = '<div class="skills-category-title">Education</div>';
            portfolioData.education.forEach(edu => {
                html += `<span class="command">${edu.school}</span><br>${edu.degree}<br><i>${edu.details}</i>\n\n`;
            });
            appendOutput(html.trim());
        }
        function showExperience() {
            let html = '<div class="skills-category-title">Experience</div>';
            portfolioData.experience.forEach(e => {
                html += `<span class="command">${e.role}</span>${e.company ? ' @ ' + e.company : ''} (${e.period})<br>`;
                e.desc.forEach(point => { html += `- ${point}<br>`; });
                html += '\n';
            });
            appendOutput(html.trim());
        }
        function showProjects() {
            let html = '<div class="skills-category-title">Projects</div>';
            portfolioData.projects.forEach(p => {
                html += `<span class="command">${p.name}</span><br>  Tech: ${p.tech}<br>`;
                p.desc.forEach(point => { html += `  - ${point}<br>`; });
                html += `  <a href="${p.url}" target="_blank" class="link">View on GitHub -></a>\n\n`;
            });
            appendOutput(html.trim());
        }
        function showSkills() {
            let html = '<div class="skills-container"><div class="skills-category-title">Skills</div>';
            for (const category in portfolioData.skills) {
                html += `<div class="skills-subcategory-title">${category}</div><div class="skills-grid">`;
                portfolioData.skills[category].forEach(skill => { html += `<div class="skill-box">${skill}</div>`; });
                html += '</div>';
            }
            html += '</div>';
            appendOutput(html);
        }
        function showHobbies() {
            appendOutput(`<div class="skills-category-title">Hobbies</div>${portfolioData.hobbies}`);
        }
        function showResume() {
            appendOutput(`<div class="skills-category-title">Resume</div><a href="/CV_Ashish.pdf" target="_blank" class="link">📄 Download my Resume (PDF)</a>`);
        }
        function showContact() {
            let html = '<div class="skills-category-title">Contact</div>';
            const prefilledEmail = "mailto:achicheruku@gmail.com?subject=Connecting%20with%20you&body=Hi%20Ashish,%0A%0AI%20came%20across%20your%20portfolio%20and%20wished%20to%20reach%20out.%0A%0APlease%20let%20me%20know%20a%20convenient%20time%20to%20connect.%0A%20Sincerely,%0A%0A[Your%20Name]";
            html += `Email: <a href="${prefilledEmail}" class="link">${portfolioData.contact.email}</a><br>Phone: <a href="tel:+919553237751" class="link">+91 9553237751</a><br>LinkedIn: <a href="${portfolioData.contact.linkedin}" target="_blank" class="link">${portfolioData.contact.linkedin}</a><br>GitHub: <a href="${portfolioData.contact.github}" target="_blank" class="link">${portfolioData.contact.github}</a><br>X/Twitter: <a href="${portfolioData.contact.twitter}" target="_blank" class="link">${portfolioData.contact.twitter}</a>`;
            appendOutput(html);
        }
        function showCreator() {
            if (portfolioData.creatorArt) {
                appendOutput(`<div class="ascii-art">${portfolioData.creatorArt}</div>`);
            } else {
                appendOutput('Creator art not available. Run img2ascii.py to generate it.');
            }
        }

        function showAllInfo() {
            const sectionNames = ['about', 'education', 'experience', 'projects', 'skills', 'hobbies', 'resume', 'contact'];
            let jumpLinks = 'Jump to: ';
            sectionNames.forEach(sec => {
                jumpLinks += `<a href="#${sec}" class="link" onclick="document.getElementById('${sec}').scrollIntoView(); return false;">${sec}</a> | `;
            });
            appendOutput(jumpLinks.slice(0, -2));
            sectionNames.forEach(sec => {
                const el = document.createElement('div');
                el.id = sec;
                outputRef.current.appendChild(el);
                commands[sec]();
            });
        }

        function clearTerminal() {
            outputRef.current.innerHTML = '';
            conversationHistoryRef.current = [];
            appendOutput(`Welcome to <span class="command">Ashish Kumar Cheruku</span>'s interactive portfolio.\nType <span class="command">'help'</span> for a list of commands, or ask me a question in plain English.`);
        }

        // ===================== VIRTUAL FILE SYSTEM =====================
        const virtualFS = {
            '~': {
                'about.txt': portfolioData.about,
                'contact.txt': `Email: achicheruku@gmail.com\nLinkedIn: ${portfolioData.contact.linkedin}\nGitHub: ${portfolioData.contact.github}`,
                projects: {
                    'lms-erp': {
                        'README.md': 'Full-stack LMS/ERP for a Government College. Built with Next.js, PostgreSQL, Prisma.',
                        'stack.txt': 'Next.js · PostgreSQL · Prisma · NextAuth · Vercel',
                    },
                    portfolio: { 'README.md': 'This website. Terminal-style portfolio with AI chat.' },
                },
                experience: {
                    'smarttrak.txt': 'DevOps Engineer Intern @ SmartTrak AI (Jan–Apr 2025). Keycloak OIDC, Kubernetes RBAC, Nginx.',
                    'freelance.txt': 'Freelance SWE (Aug–Nov 2025). Agent systems, Go backend, LangGraph Text-to-SQL.',
                },
            }
        };

        function fsResolve(path) {
            if (path === '~' || path === '/') return virtualFS['~'];
            const parts = path.replace(/^~\//, '').split('/').filter(Boolean);
            let node = virtualFS['~'];
            for (const p of parts) {
                if (!node || typeof node !== 'object' || node[p] === undefined) return null;
                node = node[p];
            }
            return node;
        }

        function cwdJoin(rel) {
            if (rel === '..') {
                const parts = cwdRef.current.split('/').filter(Boolean);
                if (parts.length <= 1) return '~';
                parts.pop();
                return parts.join('/');
            }
            return cwdRef.current === '~' ? `~/${rel}` : `${cwdRef.current}/${rel}`;
        }

        function cmdLs(args) {
            const target = args[0] ? cwdJoin(args[0]) : cwdRef.current;
            const node = fsResolve(target);
            if (!node) return appendOutput(`<span class="error">ls: ${args[0]}: No such file or directory</span>`);
            if (typeof node === 'string') return appendOutput(node);
            const entries = Object.keys(node).map(name =>
                typeof node[name] === 'object'
                    ? `<span class="command">${name}/</span>`
                    : `<span style="color:var(--text)">${name}</span>`
            ).join('  ');
            appendOutput(entries || '(empty)');
        }

        function cmdCd(args) {
            if (!args[0] || args[0] === '~') { cwdRef.current = '~'; updatePrompt(); return; }
            const target = cwdJoin(args[0]);
            const node = fsResolve(target);
            if (!node) return appendOutput(`<span class="error">cd: ${args[0]}: No such directory</span>`);
            if (typeof node === 'string') return appendOutput(`<span class="error">cd: ${args[0]}: Not a directory</span>`);
            cwdRef.current = target;
            updatePrompt();
        }

        function cmdCat(args) {
            if (!args[0]) return appendOutput('<span class="error">cat: missing file operand</span>');
            const target = cwdJoin(args[0]);
            const node = fsResolve(target);
            if (!node) return appendOutput(`<span class="error">cat: ${args[0]}: No such file</span>`);
            if (typeof node === 'object') return appendOutput(`<span class="error">cat: ${args[0]}: Is a directory</span>`);
            appendOutput(node.replace(/\n/g, '<br>'));
        }

        function cmdPwd() { appendOutput(cwdRef.current); }

        function updatePrompt() {
            const display = cwdRef.current === '~' ? '~' : cwdRef.current;
            if (livePromptRef.current) {
                livePromptRef.current.innerHTML = `Ashish@linux&nbsp;${display}&nbsp;%&nbsp;`;
            }
        }

        // ===================== EXTRA COMMANDS =====================
        function showNeofetch() {
            const art = `<span class="command">      .-.      </span>
<span class="command">     (o o)     </span>
<span class="command">    | O O |    </span>
<span class="command">     '---'     </span>`;
            appendOutput(`<div style="display:flex;gap:24px;font-family:var(--font-mono);font-size:0.85rem;line-height:1.7">
<div>${art}</div>
<div>
<span class="command">ashish@portfolio</span><br>
<span style="color:var(--border)">────────────────</span><br>
<span class="command">OS:</span>       Ashish OS 23.0 LTS<br>
<span class="command">Host:</span>     Earth, India<br>
<span class="command">Shell:</span>    ambition 5.0<br>
<span class="command">Uptime:</span>   23 years, 4 months<br>
<span class="command">Packages:</span> 47 skills installed<br>
<span class="command">CPU:</span>      Brain @ 3.6GHz (overclocked)<br>
<span class="command">Memory:</span>   ∞ curiosity / 8GB RAM<br>
<span class="command">Terminal:</span> this one<br>
<span class="command">Theme:</span>    Hacker Green<br>
</div></div>`);
        }

        function showWhois() {
            appendOutput(`<pre style="font-family:var(--font-mono);font-size:0.85rem;line-height:1.7">% WHOIS ashish-cheruku
<span style="color:var(--border)">──────────────────────────────</span>
<span class="command">Domain:</span>     ashish-cheruku
<span class="command">Registered:</span> 2001-07-15
<span class="command">Status:</span>     ACTIVE
<span class="command">Nameserver:</span> bits-pilani.ac.in
<span class="command">Interests:</span>  AI, DevOps, Football, 3D Printing
<span class="command">Email:</span>      achicheruku@gmail.com</pre>`);
        }

        function showPing() {
            const lines = [
                `PING ashish.dev (127.0.0.1): 56 bytes`,
                `64 bytes from ashish.dev: icmp_seq=0 ttl=64 time=${(0.3 + Math.random() * 0.3).toFixed(2)} ms`,
                `64 bytes from ashish.dev: icmp_seq=1 ttl=64 time=${(0.3 + Math.random() * 0.2).toFixed(2)} ms`,
                `64 bytes from ashish.dev: icmp_seq=2 ttl=64 time=${(0.3 + Math.random() * 0.15).toFixed(2)} ms`,
                `<span class="command">--- ashish.dev ping statistics ---</span> 3 packets transmitted, 3 received, 0% packet loss`,
            ];
            lines.forEach((line, i) => {
                setTimeout(() => appendOutput(`<span style="font-family:var(--font-mono);font-size:0.85rem">${line}</span>`), i * 400);
            });
        }

        function showHistory() {
            if (commandHistoryRef.current.length === 0) return appendOutput('No command history yet.');
            const html = commandHistoryRef.current.slice().reverse()
                .map((cmd, i) => `<span style="color:var(--muted);font-family:var(--font-mono)">${String(i + 1).padStart(3, ' ')}  ${cmd}</span>`)
                .join('<br>');
            appendOutput(html);
        }

        function triggerParty() {
            isPartyModeRef.current = !isPartyModeRef.current;
            const term = terminalRef.current;
            if (term) term.classList.toggle('party-mode', isPartyModeRef.current);
            appendOutput(isPartyModeRef.current
                ? '🎉 PARTY MODE ON — type <span class="command">party</span> again to stop'
                : '🎉 Party mode off. Back to hacking.');
            if (isPartyModeRef.current) {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        createParticles(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 15);
                    }, i * 200);
                }
            }
        }

        function triggerHack() {
            const wrapper = document.createElement('div');
            wrapper.className = 'output-entry';
            outputRef.current.appendChild(wrapper);
            const ips = Array.from({ length: 8 }, () =>
                Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.')
            );
            ips.forEach((ip, i) => {
                setTimeout(() => {
                    const line = document.createElement('div');
                    line.className = 'hack-line';
                    line.style.animationDelay = i * 0.05 + 's';
                    line.innerHTML = `<span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--text)">Scanning ${ip}... <span style="color:var(--accent-2)">OPEN</span></span>`;
                    wrapper.appendChild(line);
                    window.scrollTo(0, document.body.scrollHeight);
                }, i * 120);
            });
            setTimeout(() => {
                appendOutput(`<span class="error" style="font-family:var(--font-mono)">ACCESS DENIED: target hardened. Nice try.</span>`);
            }, ips.length * 120 + 200);
        }

        function triggerMatrix() {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden;opacity:0;transition:opacity 0.3s';
            const chars = 'アイウエオ0123456789ABCDEF';
            for (let i = 0; i < 20; i++) {
                const col = document.createElement('div');
                col.className = 'matrix-column';
                col.style.left = `${(i / 20) * 100}%`;
                col.style.animationDuration = `${2 + Math.random() * 3}s`;
                let text = '';
                for (let j = 0; j < 30; j++) text += chars[Math.floor(Math.random() * chars.length)];
                col.textContent = text;
                overlay.appendChild(col);
            }
            document.body.appendChild(overlay);
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });
            appendOutput('<span style="color:#00ff41;font-family:var(--font-mono)">Wake up, Neo...</span>');
            setTimeout(() => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); }, 4000);
        }

        function triggerRmRf() {
            appendOutput('<span style="font-family:var(--font-mono)">Deleting everything</span>');
            let dots = 0;
            const iv = setInterval(() => {
                dots++;
                if (outputRef.current?.lastChild) {
                    outputRef.current.lastChild.innerHTML = `<span style="font-family:var(--font-mono)">Deleting everything${'.'.repeat(dots)}</span>`;
                }
                if (dots >= 5) {
                    clearInterval(iv);
                    appendOutput('<span style="color:var(--accent);font-family:var(--font-mono)">Just kidding. I like my files.</span>');
                }
            }, 400);
        }

        function showCoffee() {
            appendOutput(`<pre style="font-family:var(--font-mono);color:var(--accent);line-height:1.4">    ( (
     ) )
  ........
  |      |]
  \\      /
   \`----'
Fuel: 3 cups/day</pre>`);
        }

        const commands = {
            'help': showHelp, 'about': showAbout, 'education': showEducation,
            'experience': showExperience, 'projects': showProjects, 'skills': showSkills,
            'hobbies': showHobbies, 'resume': showResume, 'contact': showContact,
            'clear': clearTerminal, 'all': showAllInfo, 'creator': showCreator,
            // New commands
            'neofetch': showNeofetch,
            'whois ashish': showWhois,
            'whois': showWhois,
            'ping ashish': showPing,
            'ping ashish.dev': showPing,
            'ping': showPing,
            'history': showHistory,
            'party': triggerParty,
            'hack': triggerHack,
            'matrix': triggerMatrix,
            'exit': () => appendOutput('"You can check out any time you like, but you can never leave."'),
            'sudo': () => appendOutput('<span class="error">Nice try. You are not root. This incident will be reported.</span>'),
            'sudo su': () => appendOutput('<span class="error">Nice try. You are not root. This incident will be reported.</span>'),
            'rm -rf /': triggerRmRf,
            'rm -rf': triggerRmRf,
            'coffee': showCoffee,
            'ls': (args) => cmdLs(args || []),
            'ls -la': (args) => cmdLs([]),
            'pwd': cmdPwd,
            'cd': (args) => cmdCd(args || []),
            'cat': (args) => cmdCat(args || []),
        };

        // ===================== AI CHAT =====================
        function parseMarkdown(text) {
            return text
                // Bold: **text** → <span class="command">text</span>
                .replace(/\*\*(.*?)\*\*/g, '<span class="command">$1</span>')
                // Italic: *text* → <i>text</i>
                .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<i>$1</i>')
                // Markdown headers: ### text → bold text
                .replace(/^#{1,3}\s+(.+)$/gm, '<span class="command">$1</span>')
                // Bullet lists: - text or * text → • text
                .replace(/^[\-\*]\s+(.+)$/gm, '  • $1')
                // Numbered lists: 1. text → clean numbered
                .replace(/^(\d+)\.\s+(.+)$/gm, '  $1. $2')
                // Newlines
                .replace(/\n/g, '<br>');
        }

        async function getAIResponse(userInput) {
            const thinkingMessage = document.createElement('div');
            thinkingMessage.className = 'output-entry ai-thinking';
            thinkingMessage.textContent = '⬡ thinking';
            outputRef.current.appendChild(thinkingMessage);
            window.scrollTo(0, document.body.scrollHeight);

            conversationHistoryRef.current.push({ role: 'user', text: userInput });

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: userInput,
                        conversationHistory: conversationHistoryRef.current.slice(0, -1)
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
                }

                thinkingMessage.remove();

                const responseEntry = document.createElement('div');
                responseEntry.className = 'output-entry';
                const responseTextSpan = document.createElement('span');
                responseEntry.appendChild(responseTextSpan);
                outputRef.current.appendChild(responseEntry);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponseText = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    fullResponseText += chunk;
                    // Re-render full text through parseMarkdown each chunk
                    responseTextSpan.innerHTML = parseMarkdown(fullResponseText);
                    for (const char of chunk) {
                        if (char.trim() !== '') playTypingSound();
                    }
                    window.scrollTo(0, document.body.scrollHeight);
                    await new Promise(resolve => setTimeout(resolve, 1));
                }

                // Check if AI wants to show creator art
                if (fullResponseText.includes('[SHOW_CREATOR_ART]')) {
                    // Remove the streamed text response
                    responseEntry.remove();
                    // Show creator art properly with the ascii-art class
                    if (portfolioData.creatorArt) {
                        // Strip the token and show any surrounding text the AI may have added
                        const otherText = fullResponseText.replace('[SHOW_CREATOR_ART]', '').trim();
                        if (otherText) {
                            appendOutput(parseMarkdown(otherText));
                        }
                        appendOutput(`<div class="ascii-art">${portfolioData.creatorArt}</div>`);
                    } else {
                        appendOutput('Creator art not available.');
                    }
                }

                conversationHistoryRef.current.push({ role: 'assistant', text: fullResponseText });

            } catch (error) {
                if (thinkingMessage.parentNode) thinkingMessage.remove();
                appendOutput(`<span class='error'>Error: ${error.message || 'Could not connect to the AI assistant.'}</span>`);
                console.error('AI Fetch Error:', error);
            }
        }

        // ===================== INPUT HANDLING =====================
        const inputEl = inputRef.current;

        function moveCursorToEnd(el) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // ===================== COMPLETION DROPDOWN =====================
        function updateDropdown() {
            const existing = document.getElementById('completion-dropdown');
            if (existing) existing.remove();
            const val = inputEl.textContent.trim();
            if (!val) return;
            const allCmds = Object.keys(commands).filter(c => !c.includes(' '));
            const matches = allCmds.filter(c => c.startsWith(val) && c !== val).slice(0, 5);
            if (!matches.length) return;
            const dd = document.createElement('div');
            dd.id = 'completion-dropdown';
            dd.className = 'completion-dropdown';
            matches.forEach((m, i) => {
                const item = document.createElement('div');
                item.className = 'completion-item' + (i === 0 ? ' active' : '');
                item.textContent = m;
                item.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    inputEl.textContent = m;
                    moveCursorToEnd(inputEl);
                    dd.remove();
                });
                dd.appendChild(item);
            });
            const inputLine = document.getElementById('input-line');
            if (inputLine) inputLine.style.position = 'relative';
            inputLine?.appendChild(dd);
            completionDropdownRef.current = dd;
        }

        function hideDropdown() {
            const dd = document.getElementById('completion-dropdown');
            if (dd) dd.remove();
        }

        function handleKeyDown(e) {
            if (!soundsReadyRef.current) initAudio();
            if (e.key === 'Tab') {
                e.preventDefault();
                playSound(600, 'sine', 0.02, 0.06);
                const currentInput = inputEl.textContent.trim();
                const allCmds = Object.keys(commands).filter(c => !c.includes(' '));
                const potentialCommands = allCmds.filter(cmd => cmd.startsWith(currentInput));
                if (potentialCommands.length > 0) {
                    inputEl.textContent = potentialCommands[0];
                    moveCursorToEnd(inputEl);
                    hideDropdown();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                hideDropdown();
                e.preventDefault();
                playSound(200, 'triangle', 0.05, 0.12);
                // Particle burst at input position
                const rect = inputEl.getBoundingClientRect();
                createParticles(rect.left, rect.top + rect.height / 2, 18);
                const userInput = inputEl.innerText.trim();
                if (!userInput) return;
                appendOutput(userInput, true);
                const lower = userInput.toLowerCase().trim();
                const [cmd, ...args] = lower.split(/\s+/);
                // Try exact match first (e.g. "sudo su", "rm -rf /")
                if (commands[lower]) {
                    typeof commands[lower] === 'function' && commands[lower].length > 0
                        ? commands[lower](args)
                        : commands[lower]();
                } else if (commands[cmd]) {
                    typeof commands[cmd] === 'function' && commands[cmd].length > 0
                        ? commands[cmd](args)
                        : commands[cmd]();
                } else {
                    getAIResponse(userInput);
                }
                commandHistoryRef.current.unshift(userInput);
                historyIndexRef.current = -1;
                inputEl.textContent = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
                    historyIndexRef.current++;
                    inputEl.textContent = commandHistoryRef.current[historyIndexRef.current];
                    moveCursorToEnd(inputEl);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    inputEl.textContent = commandHistoryRef.current[historyIndexRef.current];
                    moveCursorToEnd(inputEl);
                } else {
                    historyIndexRef.current = -1;
                    inputEl.textContent = '';
                }
            } else if (e.key === 'Tab') {
                // handled above
            } else {
                playSound(800, 'square', 0.03, 0.08);
                // Update dropdown after keypress settles
                setTimeout(updateDropdown, 0);
            }
        }

        inputEl.addEventListener('keydown', handleKeyDown);

        // ===================== KONAMI CODE =====================
        const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        function handleKonami(e) {
            konamiRef.current.push(e.key);
            if (konamiRef.current.length > KONAMI.length) konamiRef.current.shift();
            if (konamiRef.current.join(',') === KONAMI.join(',')) {
                konamiRef.current = [];
                const ov = document.createElement('div');
                ov.className = 'konami-overlay';
                ov.innerHTML = '<div class="konami-text">⚡ CHEAT CODE ACTIVATED ⚡</div>';
                document.body.appendChild(ov);
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => createParticles(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 25), i * 150);
                }
                setTimeout(() => ov.remove(), 3000);
            }
        }
        window.addEventListener('keydown', handleKonami);

        // Global key handler: focus input on any keydown
        function handleGlobalKeyDown(e) {
            if (e.ctrlKey || e.metaKey || e.altKey || document.activeElement === inputEl) return;
            // Only intercept printable character keys (skip arrows, function keys, etc.)
            if (e.key.length !== 1) return;
            e.preventDefault();
            inputEl.focus();
            // Manually insert the character that would otherwise be lost
            document.execCommand('insertText', false, e.key);
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        window.addEventListener('keydown', handleGlobalKeyDown);

        // Click terminal to focus input
        function handleTerminalClick(event) {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest('a, button')) return;
            inputEl.focus();
        }
        terminalRef.current.addEventListener('click', handleTerminalClick);
        terminalRef.current.addEventListener('click', initAudio, { once: true });

        // ===================== BOOT SEQUENCE =====================
        let cancelled = false;

        async function startBootSequence() {
            const overlay = bootOverlayRef.current;
            if (!overlay) {
                // Fallback if overlay not available
                appendOutput(`Welcome to Ashish Kumar Cheruku's interactive portfolio.\nType <span class="command">'help'</span> for a list of commands.`);
                inputEl.focus();
                return;
            }

            overlay.style.display = 'flex';

            // Boot skip hint + listener
            const skipHint = document.createElement('div');
            skipHint.className = 'boot-skip-hint';
            skipHint.textContent = '[ Press any key to skip ]';
            overlay.appendChild(skipHint);

            function finishBoot() {
                cancelled = true;
                skipHint.remove();
                overlay.style.transition = 'opacity 0.3s ease-out';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '';
                    appendOutput(`Welcome to <span class="command">Ashish Kumar Cheruku</span>'s interactive portfolio.\nType <span class="command">'help'</span> for a list of commands, or ask me a question in plain English.`);
                    setBootComplete(true);
                    inputEl.focus();
                }, 320);
            }
            function skipHandler(e) {
                window.removeEventListener('keydown', skipHandler);
                finishBoot();
            }
            window.addEventListener('keydown', skipHandler);

            const bootSpeed = prefersReducedMotion ? 0.2 : 0.55;

            // --- Create Matrix rain columns ---
            const rainContainer = overlay.querySelector('.matrix-rain');
            const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
            if (!prefersReducedMotion) {
                for (let i = 0; i < 30; i++) {
                    const col = document.createElement('div');
                    col.className = 'matrix-column';
                    col.style.left = `${(i / 30) * 100}%`;
                    col.style.animationDuration = `${3 + Math.random() * 5}s`;
                    col.style.animationDelay = `${Math.random() * 3}s`;
                    col.style.fontSize = `${10 + Math.random() * 6}px`;
                    let text = '';
                    for (let j = 0; j < 40; j++) text += chars[Math.floor(Math.random() * chars.length)];
                    col.textContent = text;
                    rainContainer.appendChild(col);
                }
            }

            // --- Helpers ---
            const wait = (ms) => new Promise((r) => {
                setTimeout(r, ms * bootSpeed);
                // Check cancelled flag after wait resolves
            });
            const checkCancelled = () => { if (cancelled) throw new Error('BOOT_CANCELLED'); };
            const bootLog = overlay.querySelector('.boot-log');
            const progressBar = overlay.querySelector('.boot-progress');
            const progressFill = overlay.querySelector('.boot-progress-fill');
            const progressText = overlay.querySelector('.boot-progress-text');
            const glitchEl = overlay.querySelector('.boot-glitch');

            function triggerGlitch() {
                if (prefersReducedMotion) return;
                glitchEl.classList.remove('active');
                void glitchEl.offsetWidth; // force reflow
                glitchEl.classList.add('active');
            }

            async function typeLine(text, speed = 5) {
                const line = document.createElement('div');
                line.className = 'boot-line visible typing';
                bootLog.appendChild(line);
                for (const char of text) {
                    line.innerHTML += char;
                    await wait(speed + Math.random() * speed);
                }
                line.classList.remove('typing');
                // Auto-scroll boot log
                bootLog.scrollTop = bootLog.scrollHeight;
                return line;
            }

            function addLine(html) {
                const line = document.createElement('div');
                line.className = 'boot-line visible';
                line.innerHTML = html;
                bootLog.appendChild(line);
                bootLog.scrollTop = bootLog.scrollHeight;
            }

            function randomHex(count) {
                let s = '';
                for (let i = 0; i < count; i++) s += Math.floor(Math.random() * 16).toString(16);
                return s;
            }

            // --- Boot sequence ---
            try {
                await wait(80); checkCancelled();
                await typeLine('BIOS v3.7.1 — System POST...', 8); checkCancelled();
                await wait(50); checkCancelled();
                addLine('Memory check: <span class="ok">2048 MB OK</span>');
                await wait(30); checkCancelled();
                addLine('CPU: Intel(R) Core(TM) i9-13900K @ 5.80GHz — <span class="ok">OK</span>');
                await wait(30); checkCancelled();
                triggerGlitch();
                addLine('GPU: NVIDIA RTX 4090 — <span class="ok">DETECTED</span>');
                await wait(60); checkCancelled();
                addLine('');
                await typeLine('Loading kernel modules...', 6); checkCancelled();
                await wait(50); checkCancelled();

                // Rapid hex dump
                for (let i = 0; i < 3; i++) {
                    addLine(`<span class="cyan">0x${randomHex(4)}</span>  ${randomHex(8)} ${randomHex(8)} ${randomHex(8)} ${randomHex(8)}`);
                    await wait(20); checkCancelled();
                }
                triggerGlitch();
                await wait(40); checkCancelled();

                addLine('');
                await typeLine('Initializing network interfaces...', 5); checkCancelled();
                await wait(30); checkCancelled();
                addLine('  eth0: <span class="ok">UP</span> — 10.0.0.42/24');
                addLine('  wlan0: <span class="ok">UP</span> — 192.168.1.137/24');
                await wait(30); checkCancelled();

                await typeLine('Scanning ports...', 6); checkCancelled();
                await wait(30); checkCancelled();
                const ports = [22, 80, 443, 5432];
                for (const port of ports) {
                    addLine(`  PORT ${port} — <span class="${port === 5432 ? 'warn' : 'ok'}">${port === 5432 ? 'FILTERED' : 'OPEN'}</span>`);
                    await wait(15); checkCancelled();
                }
                triggerGlitch();
                await wait(40); checkCancelled();

                addLine('');
                await typeLine('Decrypting secure payload...', 5); checkCancelled();
                progressBar.classList.add('visible');

                // Animated progress bar
                for (let p = 0; p <= 100; p += 5) {
                    progressFill.style.width = `${p}%`;
                    progressText.textContent = `${p}%`;
                    if (p === 40 || p === 70) triggerGlitch();
                    await wait(8); checkCancelled();
                }
                await wait(50); checkCancelled();
                progressBar.classList.remove('visible');

                addLine('<span class="ok">Payload decrypted successfully.</span>');
                await wait(40); checkCancelled();

                addLine('');
                await typeLine('Mounting filesystem...', 6); checkCancelled();
                await wait(30); checkCancelled();
                addLine('  /dev/sda1 on / type ext4 — <span class="ok">OK</span>');
                addLine('  /dev/sdb1 on /data type btrfs — <span class="ok">OK</span>');
                await wait(30); checkCancelled();

                await typeLine('Loading portfolio modules...', 5); checkCancelled();
                await wait(30); checkCancelled();
                const modules = ['experience.so', 'projects.so', 'skills.so', 'education.so', 'ai_chat.so', 'gui_engine.so'];
                for (const mod of modules) {
                    addLine(`  [<span class="ok">✓</span>] ${mod}`);
                    await wait(20); checkCancelled();
                }
                triggerGlitch();
                await wait(50); checkCancelled();

                addLine('');
                addLine('<span class="highlight">═══════════════════════════════════════</span>');
                await wait(30); checkCancelled();

                // ACCESS GRANTED
                const accessEl = overlay.querySelector('.access-granted');
                // Hide log and show ACCESS GRANTED
                bootLog.style.transition = 'opacity 0.3s';
                bootLog.style.opacity = '0';
                progressBar.style.opacity = '0';
                await wait(100); checkCancelled();
                accessEl.classList.add('visible');
                triggerGlitch();
                await wait(400); checkCancelled();

                // Fade out entire overlay
                overlay.classList.add('fade-out');
                await wait(400); checkCancelled();
                overlay.style.display = 'none';
                overlay.classList.remove('fade-out');

                // Now show the terminal welcome
                window.removeEventListener('keydown', skipHandler);
                skipHint.remove();
                appendOutput(`Welcome to <span class="command">Ashish Kumar Cheruku</span>'s interactive portfolio.\nType <span class="command">'help'</span> for a list of commands, or ask me a question in plain English.`);
                setBootComplete(true);
                inputEl.focus();
            } catch (e) {
                if (e.message === 'BOOT_CANCELLED') return; // Silently abort
                throw e;
            }
        }

        // ===================== CLOCK =====================
        function updateClock() {
            const timeString = new Date().toLocaleTimeString();
            if (clockRef.current) clockRef.current.textContent = timeString;
        }
        const clockInterval = setInterval(updateClock, 1000);
        updateClock();

        // ===================== FOOTER =====================
        const copyrightText = `&copy; ${new Date().getFullYear()} Ashish Kumar Cheruku. All rights reserved. | <a href="mailto:achicheruku@gmail.com" class="link">Contact Me</a>`;
        if (footerRef.current) footerRef.current.innerHTML = copyrightText;

        // ===================== DARK MODE (initial load) =====================
        // Default to dark mode. If no preference (null), set it to true.
        const storedTheme = localStorage.getItem('darkMode');
        if (storedTheme === 'true' || storedTheme === null) {
            document.body.classList.add('dark');
            networkColorRef.current = '0, 255, 65';
            if (storedTheme === null) localStorage.setItem('darkMode', 'true');
        } else {
            // User explicitly prefers light mode
            document.body.classList.remove('dark');
            networkColorRef.current = '74, 63, 54';
        }

        // ===================== PROMPT =====================
        if (livePromptRef.current) {
            livePromptRef.current.innerHTML = promptText.replace(/ /g, '&nbsp;');
        }


        // ===================== NETWORK CANVAS =====================
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        const densityDivisor = window.innerWidth <= 768 ? 40000 : 28000;
        const nodeCount = Math.max(18, Math.floor((window.innerWidth * window.innerHeight) / densityDivisor));

        function setupNetwork() {
            nodesRef.current = [];
            for (let i = 0; i < nodeCount; i++) {
                nodesRef.current.push({
                    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 1
                });
            }
        }

        function drawNetwork() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const interactionRadius = 150;
            const nodes = nodesRef.current;
            const mouse = mouseRef.current;
            const networkColor = networkColorRef.current;

            nodes.forEach(node => {
                node.x += node.vx; node.y += node.vy;
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
                let mouseDistance = mouse.x === undefined ? Infinity : Math.hypot(node.x - mouse.x, node.y - mouse.y);
                const opacity = Math.max(0, 1 - mouseDistance / interactionRadius);
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${networkColor}, ${0.5 + opacity * 0.5})`;
                ctx.fill();
            });

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                    if (dist < 120) {
                        const mouseDistance = mouse.x === undefined ? Infinity : Math.hypot(((nodes[i].x + nodes[j].x) / 2) - mouse.x, ((nodes[i].y + nodes[j].y) / 2) - mouse.y);
                        const opacity = Math.max(0.1, 1 - mouseDistance / interactionRadius);
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(${networkColor}, ${(1 - dist / 120) * 0.5 * opacity})`;
                        ctx.stroke();
                    }
                }
            }
        }

        let animId;
        function animate() { drawNetwork(); animId = requestAnimationFrame(animate); }

        function handleMouseMove(event) { mouseRef.current = { x: event.x, y: event.y }; }
        window.addEventListener('mousemove', handleMouseMove);

        function handleResize() { resizeCanvas(); setupNetwork(); }
        window.addEventListener('resize', handleResize);

        resizeCanvas();
        setupNetwork();
        if (prefersReducedMotion) {
            drawNetwork();
        } else {
            animate();
        }



        // ===================== BOOT =====================
        if (!hasBootedRef.current) {
            hasBootedRef.current = true;
            startBootSequence();
        }

        // ===================== CLEANUP =====================
        return () => {
            clearInterval(clockInterval);
            cancelAnimationFrame(animId);
            inputEl.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('keydown', handleKonami);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (outputRef.current) outputRef.current.innerHTML = '';
            cancelled = true;
            hasBootedRef.current = false;
        };
    }, [appendOutput]);

    // ===================== CUSTOM CURSOR =====================
    useEffect(() => {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-dot"></div>';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        const onMove = (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        const onOver = (e) => {
            if (e.target.closest('a, button, [contenteditable]')) {
                cursor.classList.add('hovering');
            } else {
                cursor.classList.remove('hovering');
            }
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseover', onOver);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOver);
            cursor.remove();
        };
    }, []);

    return (
        <>
            {/* Particles Container */}
            <div id="particles-container"></div>
            {/* Boot Overlay */}
            <div id="boot-overlay" ref={bootOverlayRef} style={{ display: 'none' }}>
                <div className="matrix-rain"></div>
                <div className="boot-scanlines"></div>
                <div className="boot-glitch"></div>
                <div className="boot-log"></div>
                <div className="boot-progress">
                    <div className="boot-progress-bar"><div className="boot-progress-fill"></div></div>
                    <div className="boot-progress-text">0%</div>
                </div>
                <div className="access-granted">ACCESS GRANTED</div>
            </div>

            <canvas id="network-canvas" ref={canvasRef}></canvas>
            <div id="scanlines"></div>
            <div className="terminal-container">
                <div id="contact-icons-wrapper" style={{ opacity: bootComplete ? 1 : 0, transition: 'opacity 0.5s ease-in', pointerEvents: bootComplete ? 'auto' : 'none' }}>
                    <div id="contact-icons-container">
                        <div className="brand-group">
                            <div className="brand-mark">AK</div>
                            <div className="brand-copy">
                                <span className="brand-title glitch-hover">Ashish Kumar Cheruku</span>
                                <span className="brand-subtitle">{isGuiMode ? 'Profile Mode' : 'Terminal Mode'}</span>
                            </div>
                        </div>
                        <div id="contact-icons">
                            {/* Theme Toggle */}
                            <button type="button" id="theme-toggle-button" className="icon-button control-pill" title="Toggle Dark Mode" onClick={handleThemeToggle}>
                                <svg id="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                                <svg id="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            </button>
                            {/* Email Copy */}
                            <button type="button" id="email-copy-button" className="icon-button control-pill" title="Copy Email" onClick={handleEmailCopy}>
                                <svg viewBox="0 0 24 24"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" /></svg>
                            </button>
                            {/* LinkedIn */}
                            <a href="https://www.linkedin.com/in/ashish-k-cheruku/" target="_blank" rel="noopener noreferrer" className="icon-button control-pill" title="LinkedIn">
                                <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </a>
                            {/* GitHub */}
                            <a href="https://github.com/ashish-cheruku" target="_blank" rel="noopener noreferrer" className="icon-button control-pill" title="GitHub">
                                <svg viewBox="0 0 25 25"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.72c0 .27.18.58.69.48A10 10 0 0 0 22 12 10 10 0 0 0 12 2Z" /></svg>
                            </a>
                            {/* X / Twitter */}
                            <a href="https://x.com/Ashish_Cheruku" target="_blank" rel="noopener noreferrer" className="icon-button control-pill" title="X / Twitter">
                                <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                            {/* Resume */}
                            <a href="/CV_Ashish.pdf" target="_blank" className="icon-button control-pill" title="Download Resume">
                                <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
                            </a>
                            {/* GUI Toggle */}
                            <button type="button" id="gui-toggle-button" className="icon-button control-pill" title={isGuiMode ? 'Switch to Terminal View' : 'Switch to Standard View'} onClick={handleGuiToggle}>
                                <svg id="gui-icon-standard" className="icon-button" viewBox="0 0 240 330" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{ display: isGuiMode ? 'none' : 'block' }}>
                                    <g stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="12" y="12" width="216" height="306" rx="20" ry="20" />
                                        <circle cx="120" cy="125" r="72" />
                                        <circle cx="120" cy="105" r="22" />
                                        <path d="M 60 230 Q 120 170 180 230" />
                                        <line x1="45" y1="270" x2="195" y2="270" />
                                    </g>
                                </svg>
                                <svg id="gui-icon-terminal" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: isGuiMode ? 'block' : 'none' }}>
                                    <polyline points="4 17 10 11 4 5"></polyline>
                                    <line x1="12" y1="19" x2="20" y2="19"></line>
                                </svg>
                            </button>
                        </div>

                        <div id="status-bar" style={{ pointerEvents: bootComplete ? 'auto' : 'none', visibility: isGuiMode ? 'hidden' : 'visible', opacity: bootComplete ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                            <span className="status-pill">LIVE</span>
                            <span id="clock" ref={clockRef}>--:--:--</span>
                        </div>
                    </div>
                </div>

                <div id="terminal" ref={terminalRef} className="main-panel" style={{ display: isGuiMode ? 'none' : 'flex', opacity: bootComplete ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    <div id="output" ref={outputRef} style={{ flexGrow: 1 }}></div>
                    <div id="input-line" className="prompt-line-wrapper">
                        <span className="prompt-live" ref={livePromptRef}></span>
                        <div id="terminal-input" ref={inputRef} contentEditable="true" spellCheck="false" suppressContentEditableWarning={true}></div>
                    </div>
                    <div id="footer" ref={footerRef}></div>
                </div>

                <div id="gui-mode" ref={guiModeRef} className="main-panel" style={{ display: isGuiMode ? 'block' : 'none' }}>
                </div>
            </div>
        </>
    );
}

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
    const guiFooterRef = useRef(null);
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
            const promptSpan = `<span class="prompt-live text-lg">${promptText.replace(/ /g, '&nbsp;')}</span>`;
            const commandSpan = `<span class="command text-lg" style="white-space: pre-wrap; word-break: break-all;">${html}</span>`;
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

        const sections = {
            'About': portfolioData.about,
            'Experience': portfolioData.experience,
            'Projects': portfolioData.projects,
            'Skills': portfolioData.skills,
            'Education': portfolioData.education,
            'Hobbies': portfolioData.hobbies,
        };

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
                html = `<p>${sections[sectionTitle].replace(/\n/g, '<br>')}</p>`;
            } else if (sectionTitle === 'Experience') {
                sections[sectionTitle].forEach(e => {
                    html += `<div class="gui-item"><div class="gui-item-title">${e.role}${e.company ? ' @ ' + e.company : ''} (${e.period})</div><ul>`;
                    e.desc.forEach(point => { html += `<li>${point}</li>`; });
                    html += `</ul></div>`;
                });
            } else if (sectionTitle === 'Projects') {
                sections[sectionTitle].forEach(p => {
                    html += `<div class="gui-item"><div class="gui-item-title">${p.name} (${p.tech})</div><ul>`;
                    p.desc.forEach(d => { html += `<li>${d}</li>`; });
                    html += `</ul><a href="${p.url}" target="_blank" class="link">View on GitHub -></a></div>`;
                });
            } else if (sectionTitle === 'Skills') {
                for (const category in sections[sectionTitle]) {
                    html += `<div class="skills-subcategory-title">${category}</div><div class="skills-grid">`;
                    sections[sectionTitle][category].forEach(skill => { html += `<div class="skill-box">${skill}</div>`; });
                    html += '</div>';
                }
            } else if (sectionTitle === 'Education') {
                sections[sectionTitle].forEach(edu => {
                    html += `<div class="gui-item"><div class="gui-item-title">${edu.school}</div>${edu.degree}<br><i>${edu.details}</i></div>`;
                });
            } else if (sectionTitle === 'Hobbies') {
                html = `<p>${sections[sectionTitle]}</p>`;
            }

            contentPanel.innerHTML = html;
            contentContainer.appendChild(contentPanel);

            if (isFirst) {
                button.classList.add('active');
                contentPanel.classList.add('active');
                isFirst = false;
            }
        }

        guiModeEl.appendChild(nav);
        guiModeEl.appendChild(contentContainer);

        const footerClone = document.createElement('div');
        footerClone.id = 'gui-footer';
        footerClone.innerHTML = `&copy; ${new Date().getFullYear()} Ashish Kumar Cheruku. All rights reserved. | <a href="mailto:achicheruku@gmail.com" class="link">Contact Me</a>`;
        guiModeEl.appendChild(footerClone);
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
            let helpText = `Available commands:<br>  <span class="command">about</span>, <span class="command">education</span>, <span class="command">experience</span>, <span class="command">projects</span>, <span class="command">skills</span>, <span class="command">hobbies</span>, <span class="command">resume</span>, <span class="command">contact</span>, <span class="command">creator</span>, <span class="command">all</span>, <span class="command">clear</span>`;
            helpText += `<br><br>You can also ask me a question, like: <i>"What are his most recent projects?"</i>`;
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

        const commands = {
            'help': showHelp, 'about': showAbout, 'education': showEducation,
            'experience': showExperience, 'projects': showProjects, 'skills': showSkills,
            'hobbies': showHobbies, 'resume': showResume, 'contact': showContact,
            'clear': clearTerminal, 'all': showAllInfo, 'creator': showCreator
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
            thinkingMessage.className = 'output-entry';
            thinkingMessage.textContent = 'Thinking...';
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

        function handleKeyDown(e) {
            if (!soundsReadyRef.current) initAudio();
            if (e.key === 'Tab') {
                e.preventDefault();
                const currentInput = inputEl.textContent.trim();
                const potentialCommands = Object.keys(commands).filter(cmd => cmd.startsWith(currentInput));
                if (potentialCommands.length > 0) {
                    inputEl.textContent = potentialCommands[0];
                    moveCursorToEnd(inputEl);
                }
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                playSound(440, 'square', 0.08, 0.2);
                const userInput = inputEl.innerText.trim();
                if (!userInput) return;
                appendOutput(userInput, true);
                if (commands[userInput.toLowerCase()]) {
                    commands[userInput.toLowerCase()]();
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
            } else {
                playSound(880, 'sine', 0.08, 0.2);
            }
        }

        inputEl.addEventListener('keydown', handleKeyDown);

        // Global key handler: focus input on any keydown
        function handleGlobalKeyDown(e) {
            if (e.ctrlKey || e.metaKey || e.altKey || document.activeElement === inputEl) return;
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputEl.focus();
        }
        window.addEventListener('keydown', handleGlobalKeyDown);

        // Click terminal to focus input
        function handleTerminalClick(event) {
            if (event.target.tagName.toLowerCase() !== 'a') inputEl.focus();
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

            // --- Create Matrix rain columns ---
            const rainContainer = overlay.querySelector('.matrix-rain');
            const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
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

            // --- Helpers ---
            const wait = (ms) => new Promise((r, rej) => {
                const id = setTimeout(r, ms);
                // Check cancelled flag after wait resolves
            });
            const checkCancelled = () => { if (cancelled) throw new Error('BOOT_CANCELLED'); };
            const bootLog = overlay.querySelector('.boot-log');
            const progressBar = overlay.querySelector('.boot-progress');
            const progressFill = overlay.querySelector('.boot-progress-fill');
            const progressText = overlay.querySelector('.boot-progress-text');
            const glitchEl = overlay.querySelector('.boot-glitch');

            function triggerGlitch() {
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
        if (guiFooterRef.current) guiFooterRef.current.innerHTML = copyrightText;

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
        const nodeCount = Math.floor((window.innerWidth * window.innerHeight) / 25000);

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
        animate();



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
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (outputRef.current) outputRef.current.innerHTML = '';
            cancelled = true;
            hasBootedRef.current = false;
        };
    }, [appendOutput]);

    return (
        <>
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
                        <div id="contact-icons">
                            {/* Theme Toggle */}
                            <div id="theme-toggle-button" className="icon-button" title="Toggle Dark Mode" style={{ cursor: 'pointer' }} onClick={handleThemeToggle}>
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
                            </div>
                            {/* Email Copy */}
                            <div id="email-copy-button" className="icon-button" title="Copy Email" style={{ cursor: 'pointer' }} onClick={handleEmailCopy}>
                                <svg viewBox="0 0 24 24"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" /></svg>
                            </div>
                            {/* LinkedIn */}
                            <a href="https://www.linkedin.com/in/ashish-k-cheruku/" target="_blank" title="LinkedIn">
                                <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </a>
                            {/* GitHub */}
                            <a href="https://github.com/ashish-cheruku" target="_blank" title="GitHub">
                                <svg viewBox="0 0 25 25"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.72c0 .27.18.58.69.48A10 10 0 0 0 22 12 10 10 0 0 0 12 2Z" /></svg>
                            </a>
                            {/* X / Twitter */}
                            <a href="https://x.com/Ashish_Cheruku" target="_blank" title="X / Twitter">
                                <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                            {/* Resume */}
                            <a href="/CV_Ashish.pdf" target="_blank" title="Download Resume">
                                <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
                            </a>
                            {/* GUI Toggle */}
                            <div id="gui-toggle-button" className="icon-button" title={isGuiMode ? "Switch to Terminal View" : "Switch to Standard View"} onClick={handleGuiToggle} style={{ cursor: 'pointer' }}>
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
                            </div>
                        </div>

                        <div id="status-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', pointerEvents: bootComplete ? 'auto' : 'none', paddingRight: '1rem', visibility: isGuiMode ? 'hidden' : 'visible', opacity: bootComplete ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>

                            <span id="clock" ref={clockRef}>--:--:--</span>
                        </div>
                    </div>
                </div>

                <div id="terminal" ref={terminalRef} className="w-full rounded-lg shadow-2xl p-4" style={{ display: isGuiMode ? 'none' : 'flex', flexDirection: 'column', opacity: bootComplete ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    <div id="output" ref={outputRef} style={{ flexGrow: 1 }}></div>
                    <div id="input-line" className="prompt-line-wrapper" style={{ flexShrink: 0, marginTop: '1rem', display: 'flex' }}>
                        <span className="prompt-live text-lg" ref={livePromptRef}></span>
                        <div id="terminal-input" ref={inputRef} className="text-lg" contentEditable="true" spellCheck="false" suppressContentEditableWarning={true}></div>
                    </div>
                    <div id="footer" ref={footerRef}></div>
                </div>

                <div id="gui-mode" ref={guiModeRef} className="w-full rounded-lg shadow-2xl p-8 overflow-y-auto" style={{ display: isGuiMode ? 'block' : 'none' }}>
                </div>
            </div>
        </>
    );
}

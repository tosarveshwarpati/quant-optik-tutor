// Core AI Integration
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer YOUR_DEEPSEEK_API_KEY`
};

async function queryAI(prompt, context = "") {
    try {
        const response = await fetch(DEEPSEEK_ENDPOINT, {
            method: 'POST',
            headers: DEEPSEEK_HEADERS,
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{
                    role: "system",
                    content: `You are a Quantum Optics expert teaching through a terminal interface. 
                    ${context}
                    Format responses for monospace display with max 80 columns. Use unicode math symbols.`
                }, {
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return `AI Error: ${error.message}`;
    }
}

// AI-Powered Command Definitions
const commands = {
    help: {
        description: "Show available commands",
        execute: async () => {
            const maxLength = Math.max(...Object.keys(commands).map(c => c.length));
            return "Available commands:\n" + 
                Object.entries(commands).map(([cmd, {description}]) => 
                    `  ${cmd.padEnd(maxLength + 2)}${description}`
                ).join('\n');
        }
    },
    ask: {
        description: "Ask anything about quantum optics",
        execute: async (args) => {
            if (!args.length) return "Please enter your question";
            return await queryAI(args.join(' '), "Provide detailed technical answer.");
        }
    },
    explain: {
        description: "Explain a quantum optics concept",
        execute: async (args) => {
            if (!args.length) return "Please specify a concept";
            return await queryAI(`Explain ${args.join(' ')} in quantum optics`, 
                "Include mathematical formalism and practical applications.");
        }
    },
    quiz: {
        description: "Generate interactive quiz",
        execute: async (args) => {
            const topic = args.join(' ') || "random quantum optics topic";
            return await queryAI(`Create 3 multiple choice questions about ${topic}`, 
                "Format with letters (A-D). Include answers at the end.");
        }
    },
    derive: {
        description: "Derive a quantum optics formula",
        execute: async (args) => {
            if (!args.length) return "Please specify a formula/effect";
            return await queryAI(`Derive ${args.join(' ')} step-by-step`,
                "Use proper mathematical notation with numbered steps.");
        }
    },
    papers: {
        description: "Find and summarize recent papers",
        execute: async (args) => {
            const query = args.join(' ') || "quantum optics";
            const results = await fetchArxivPapers(query);
            return await queryAI(`Summarize these papers: ${results}`, 
                "Provide bullet-point summaries with key equations.");
        }
    },
    // Core system commands
    clear: {
        description: "Clear terminal history",
        execute: () => {
            document.querySelectorAll('.output').forEach(el => el.remove());
            return "";
        }
    },
    login: {
        description: "Authenticate user session",
        execute: () => {
            document.getElementById('login-modal').style.display = 'block';
            return "Please use the login form";
        }
    },
    logout: {
        description: "End current session",
        execute: () => {
            currentUser = null;
            return "Logged out successfully";
        }
    },
    register: {
        description: "Create new account",
        execute: () => {
            document.getElementById('login-modal').style.display = 'block';
            return "Please use the registration form";
        }
    },
    theme: {
        description: "Change interface color theme",
        execute: (args) => {
            const colors = ['green', 'amber', 'blue'];
            const color = colors.includes(args[0]) ? args[0] : 'green';
            document.documentElement.style.setProperty('--primary-color', `var(--${color})`);
            return `Theme set to ${color}`;
        }
    }
};

// Enhanced User Interface
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --green: #00FF00;
            --amber: #FFBF00;
            --blue: #00BFFF;
            --primary-color: var(--green);
        }
        body {
            background: #000;
            color: var(--primary-color);
            font-family: 'Courier New', monospace;
            padding: 20px;
            line-height: 1.4;
        }
        #terminal {
            max-width: 800px;
            margin: 0 auto;
        }
        .output {
            white-space: pre-wrap;
            margin: 10px 0;
        }
        .prompt {
            color: var(--primary-color);
            margin-right: 10px;
        }
        #command-input {
            background: transparent;
            border: none;
            color: var(--primary-color);
            font-family: inherit;
            width: 80%;
            outline: none;
        }
        #login-modal {
            /* Add your modal styles */
        }
    `;
    document.head.appendChild(style);
    document.getElementById('command-input').focus();
});

// Terminal Core Functionality
document.getElementById('command-input').addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        const input = this.value.trim();
        this.value = '';
        const [command, ...args] = input.split(' ');
        
        const outputDiv = document.createElement('div');
        outputDiv.className = 'output';
        outputDiv.innerHTML = `
            <span class="prompt">⟩⟩</span>
            <span>${input}</span>
        `;
        document.getElementById('terminal').appendChild(outputDiv);
        
        if (commands[command]) {
            try {
                const result = await commands[command].execute(args);
                if (result) {
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'output';
                    resultDiv.textContent = result;
                    document.getElementById('terminal').appendChild(resultDiv);
                }
            } catch (error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'output';
                errorDiv.style.color = '#FF0000';
                errorDiv.textContent = `Error: ${error.message}`;
                document.getElementById('terminal').appendChild(errorDiv);
            }
        }
        
        window.scrollTo(0, document.body.scrollHeight);
    }
});



// Terminal Core
document.getElementById('command-input').addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        const input = this.value.trim();
        this.value = '';
        
        const [command, ...args] = input.split(' ');
        addOutput(input, true);
        
        if (commands[command]) {
            try {
                const result = await Promise.resolve(commands[command].execute(args));
                if (result) addOutput(result);
            } catch (error) {
                addOutput(`Error: ${error.message}`, true);
            }
        } else {
            addOutput(`Command not found: ${command}`, true);
        }
    }
});

// User System
let currentUser = null;
let users = JSON.parse(localStorage.getItem('quant-optik-users')) || {};

document.getElementById('auth-login').addEventListener('click', () => {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    
    if (users[username]?.password === password) {
        currentUser = username;
        document.getElementById('login-modal').style.display = 'none';
        addOutput(`Welcome back, ${username}!`);
    } else {
        addOutput("Invalid credentials", true);
    }
});

document.getElementById('auth-register').addEventListener('click', () => {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    
    if (users[username]) {
        addOutput("Username taken", true);
    } else if (username.length >= 3 && password.length >= 6) {
        users[username] = { password, preferences: {} };
        localStorage.setItem('quant-optik-users', JSON.stringify(users));
        currentUser = username;
        document.getElementById('login-modal').style.display = 'none';
        addOutput(`Account created for ${username}!`);
    } else {
        addOutput("Username (3+) and password (6+) too short", true);
    }
});

// Helper Functions
async function fetchArxivPapers(query) {
    try {
        const response = await fetch(`https://export.arxiv.org/api/query?search_query=all:${query}`);
        const text = await response.text();
        return text.match(/<title>[^<]+/g).slice(1,6).map(t => t.replace('<title>','')).join('\n');
    } catch (error) {
        return "arXiv API Error";
    }
}

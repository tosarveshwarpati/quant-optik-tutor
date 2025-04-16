// ======================
// Quantum Optics AI Terminal
// ======================

// Core Configuration
const config = {
  aiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  aiContext: `You are a Quantum Optics Professor teaching through a terminal interface.
              - Format responses for 80-column monospace
              - Use Unicode math symbols (ħ, ψ, â⁺, etc.)
              - Wrap LaTeX equations in $$ (e.g., $$\\hbar\\omega$$)
              - Include technical depth with clear explanations
              - Break complex concepts into steps`,
  themeColors: {
    green: '#00FF00',
    amber: '#FFBF00',
    blue: '#00BFFF',
    white: '#FFFFFF'
  },
  arxivEndpoint: 'http://export.arxiv.org/api/query',
  scholarAIEndpoint: 'https://api.scholarai.io/api/fast_paper_search',
  scispaceEndpoint: 'https://api.typeset.io/v1/literature/summary', // Verify with SciSpace
  apiKeys: {
    deepseek: 'sk-f55f5ed5130b478e8e268a361e13bca0',
    scholarAI: 'W17GFvnoJ6OdwfXmlK2g2HxffzOHt4bMOVzehSZMVcsipa2bSt13Os3xInZ6kj1Q',
    scispace: 'YOUR_ACTUAL_SCISPACE_API_KEY' // Replace with actual key
  }
};

// AI Command Handler
async function handleAICommand(prompt, context = "") {
  try {
    const response = await fetch(config.aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKeys.deepseek}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "system",
          content: `${config.aiContext}\n${context}`
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    const data = await response.json();
    return data.choices[0]?.message?.content || "No response from AI";
  } catch (error) {
    console.error("AI Error:", error);
    return `AI Service Error: ${error.message}`;
  }
}

// New Helper: Fetch arXiv Papers
async function fetchArxivPapers(query) {
  try {
    const response = await fetch(`${config.arxivEndpoint}?search_query=${encodeURIComponent(query)}&max_results=5`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    let output = 'arXiv Papers:\n';
    entries.forEach(entry => {
      const title = entry.querySelector('title')?.textContent || 'No title';
      const id = entry.querySelector('id')?.textContent || 'No ID';
      const summary = entry.querySelector('summary')?.textContent.slice(0, 100) + '...';
      output += `  Title: ${title.slice(0, 70)}\n  DOI: ${id}\n  Summary: ${summary}\n\n`;
    });
    return output || 'No papers found.';
  } catch (error) {
    return `arXiv Error: ${error.message}`;
  }
}

// New Helper: Fetch Scholar AI Papers
async function fetchScholarAIPapers(query) {
  try {
    const response = await fetch(config.scholarAIEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ScholarAI-API-Key': config.apiKeys.scholarAI
      },
      body: JSON.stringify({ query, max_results: 5 })
    });
    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      return 'No papers found or invalid response format.';
    }
    let output = 'Scholar AI Papers:\n';
    data.results.forEach(paper => {
      output += `  Title: ${paper.title?.slice(0, 70) || 'No title'}\n  DOI: ${paper.doi || 'N/A'}\n  Summary: ${paper.abstract?.slice(0, 100) || 'No summary'}...\n\n`;
    });
    return output || 'No papers found.';
  } catch (error) {
    return `Scholar AI Error: ${error.message}`;
  }
}

// New Helper: Fetch SciSpace Paper Summary
async function fetchScispaceSummary(doi) {
  try {
    const response = await fetch(`${config.scispaceEndpoint}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKeys.scispace}`
      },
      body: JSON.stringify({ doi })
    });
    const data = await response.json();
    if (!data.title || !data.summary) {
      return 'Invalid response format from SciSpace.';
    }
    return `SciSpace Summary:\n  Title: ${data.title.slice(0, 70)}\n  DOI: ${doi}\n  Summary: ${data.summary.slice(0, 200)}...\n`;
  } catch (error) {
    return `SciSpace Error: ${error.message}`;
  }
}

// Command Definitions
const commands = {
  help: {
    description: "Show all available commands",
    execute: () => {
      const maxLen = Math.max(...Object.keys(commands).map(c => c.length));
      return "COMMANDS:\n" + Object.entries(commands)
        .map(([cmd, cmdObj]) => {
          const description = cmdObj.description || "No description available";
          return `  ${cmd.padEnd(maxLen)} - ${description}`;
        })
        .join('\n');
    }
  },

  // AI-Powered Commands
  ask: {
    description: "Ask any quantum optics question",
    execute: async (args) => args.length 
      ? handleAICommand(args.join(' '), "Provide detailed technical answer.")
      : "Please enter your question"
  },

  explain: {
    description: "Explain a quantum concept",
    execute: async (args) => args.length
      ? handleAICommand(`Explain: ${args.join(' ')}`, "Include mathematical formalism and practical applications.")
      : "Please specify a concept"
  },

  derive: {
    description: "Derive a quantum formula",
    execute: async (args) => args.length
      ? handleAICommand(`Derive: ${args.join(' ')}`, "Show step-by-step derivation with explanations.")
      : "Please specify a formula"
  },

  quiz: {
    description: "Generate practice questions",
    execute: async (args) => handleAICommand(
      `Create 3 multiple choice questions about ${args.join(' ') || "quantum optics"}`,
      "Format with A-D options. Include solutions at the end."
    )
  },

  // New Commands
  arxiv: {
    description: "Search arXiv for papers",
    execute: async (args) => args.length
      ? fetchArxivPapers(args.join(' '))
      : "Please specify a search query (e.g., 'quantum optics')"
  },

  scholar: {
    description: "Search Scholar AI for papers",
    execute: async (args) => args.length
      ? fetchScholarAIPapers(args.join(' '))
      : "Please specify a search query (e.g., 'quantum entanglement')"
  },

  scispace: {
    description: "Summarize a paper with SciSpace (provide DOI)",
    execute: async (args) => args.length
      ? fetchScispaceSummary(args.join(' '))
      : "Please provide a paper DOI (e.g., '10.1103/PhysRevLett.123.456789')"
  },

  // System Commands
  clear: {
    description: "Clear the terminal",
    execute: () => {
      document.querySelectorAll('.output').forEach(el => el.remove());
      return "";
    }
  },

  theme: {
    description: "Change color (green/amber/blue/white)",
    execute: (args) => {
      const color = args[0] in config.themeColors ? args[0] : 'green';
      document.documentElement.style.setProperty('--primary-color', config.themeColors[color]);
      return `Theme set to ${color}`;
    }
  }
};

// Terminal Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Setup Styles (add clickable DOI styling)
  const style = document.createElement('style');
  style.textContent = `
    :root { --primary-color: #00FF00; }
    body {
      background: #000;
      color: var(--primary-color);
      font-family: 'Courier New', monospace;
      padding: 20px;
      line-height: 1.4;
    }
    #terminal { max-width: 800px; margin: 0 auto; }
    .output { white-space: pre-wrap; margin: 10px 0; }
    .prompt { color: var(--primary-color); }
    #command-input {
      background: transparent;
      border: none;
      color: inherit;
      font-family: inherit;
      width: 80%;
      outline: none;
    }
    .clickable { cursor: pointer; text-decoration: underline; }
    .doi-link { color: #00BFFF; text-decoration: underline; }
  `;
  document.head.appendChild(style);

  // Welcome Message
  const welcome = `
  ██████  █████  ███    ██ ████████ ██████  
 ██      ██   ██ ████   ██    ██    ██   ██ 
 ██      ███████ ██ ██  ██    ██    ██████  
 ██      ██   ██ ██  ██ ██    ██    ██      
  ██████ ██   ██ ██   ████    ██    ██      
                                             
Type 'help' to begin your quantum optics journey
New: Search papers with 'arxiv', 'scholar', 'scispace'
  `;
  addOutput(welcome);
  document.getElementById('command-input').focus();
});

// Terminal Interaction
document.getElementById('command-input').addEventListener('keydown', async function(e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    this.value = '';
    
    if (!input) return;
    
    const [command, ...args] = input.split(' ');
    addOutput(`⟩⟩ ${input}`, true);
    
    if (commands[command]) {
      try {
        const result = await commands[command].execute(args);
        if (result) addOutput(result);
      } catch (error) {
        addOutput(`Error: ${error.message}`, false, true);
      }
    } else {
      addOutput(`Command not found. Type 'help' for options.`, false, true);
    }
    
    window.scrollTo(0, document.body.scrollHeight);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const input = this.value.trim();
    const matches = Object.keys(commands).filter(cmd => cmd.startsWith(input));
    if (matches.length === 1) {
      this.value = matches[0];
    } else if (matches.length > 1) {
      addOutput(`Matching commands: ${matches.join(', ')}`);
    }
  }
});

// Helper Functions
function addOutput(text, isInput = false, isError = false) {
  const div = document.createElement('div');
  div.className = `output ${isError ? 'error' : ''}`;
  
  // Handle LaTeX and DOIs
  const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/gi;
  const latexRegex = /\$\$(.*?)\$\$/g;
  let lastIndex = 0;
  let formattedText = '';

  // Process LaTeX and DOIs
  let match;
  while ((match = latexRegex.exec(text)) !== null) {
    const plainText = text.slice(lastIndex, match.index).replace(doiRegex, '<a class="doi-link" href="https://doi.org/$1">$1</a>');
    formattedText += plainText;
    if (typeof katex !== 'undefined') {
      try {
        const latexSpan = document.createElement('span');
        katex.render(match[1], latexSpan, { throwOnError: false });
        formattedText += latexSpan.outerHTML;
      } catch (error) {
        formattedText += `LaTeX Error: ${match[1]}`;
      }
    } else {
      formattedText += match[0]; // Fallback to raw LaTeX
    }
    lastIndex = latexRegex.lastIndex;
  }
  formattedText += text.slice(lastIndex).replace(doiRegex, '<a class="doi-link" href="https://doi.org/$1">$1</a>');
  
  if (isInput) {
    div.innerHTML = `<span class="prompt">⟩⟩</span> ${formattedText}`;
  } else {
    div.innerHTML = formattedText;
  }
  
  document.getElementById('terminal').appendChild(div);
}

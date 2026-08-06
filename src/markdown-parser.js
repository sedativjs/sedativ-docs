import '/ui/code-block.js'

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    /* 1. Default GitHub Light Token Palette */
    :root {
      --syntax-keyword: #cf222e;
      --syntax-function: #8250df;
      --syntax-string: #0a3069;
      --syntax-constant: #0550ae;
      --syntax-argument: #953800;
      --syntax-class: #953800;
      --syntax-comment: #6e7781;
      --syntax-tag: #116329;
    }

    /* 2. Overwrite with GitHub Dark when user prefers dark mode */
    @media (prefers-color-scheme: dark) {
      :root {
        --syntax-keyword: #ff7b72;
        --syntax-function: #d2a8ff;
        --syntax-string: #a5d6ff;
        --syntax-constant: #79c0ff;
        --syntax-argument: #ffa657;
        --syntax-class: #ffa657;
        --syntax-comment: #8b949e;
        --syntax-tag: #7ee787;
      }
    }

    /* 3. Apply the dynamic variables to your classes */
    .token-keyword  { color: var(--syntax-keyword); }
    .token-function { color: var(--syntax-function); }
    .token-string   { color: var(--syntax-string); }
    .token-constant { color: var(--syntax-constant); }
    .token-argument { color: var(--syntax-argument); }
    .token-class    { color: var(--syntax-class); font-weight: 500; }
    .token-comment  { color: var(--syntax-comment); font-style: italic; }
    .token-tag      { color: var(--syntax-tag); font-weight: 600; }

    .diff-delete { color: var(--color-red); margin: 0; }
    .diff-add { color: var(--color-blue); margin: 0; }
  `
  document.head.appendChild(style)
}

const escapeHtml = (text) => text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;")

const highlightJS = (innerCode) => {
  let rawCode = innerCode
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')

  let html = rawCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const syntaxRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|let)\b)|(\b[A-Z]\w*\b)|(\b(?:req|ref|res|next|ctx|err|error)\b)|(\b(?:true|false|null|undefined|\d+)\b)|(\b\w+)(?=\s*\()/g;

  return html.replace(syntaxRegex, (match, comment, string, keyword, className, argument, constant, method) => {
    if (comment)   return `<span class="token-comment">${comment}</span>`
    if (string) {
      const highlightedString = string
        .replace(/(&lt;\/?)([a-zA-Z0-9_-]+)([\s\S]*?)(\/?&gt;)/g, (m, open, tagName, body, close) => {
          const coloredTag = `${open}<span class="token-tag">${tagName}</span>`
          const coloredClose = `<span class="token-tag">${close}</span>`
          
          // Added literal single and double quotes to correctly capture entire attribute values
          const coloredBody = body.replace(/([a-zA-Z0-9_-]+)(=)(&quot;[\s\S]*?&quot;|&#039;[\s\S]*?&#039;|"[^"]*"|'[^']*'|[^\s&gt;]+)/g, (attrM, attrName, eq, attrVal) => {
            return `<span class="token-constant">${attrName}</span>${eq}<span class="token-function">${attrVal}</span>`
          })
          
          return coloredTag + coloredBody + coloredClose
        })
      return `<span class="token-string">${highlightedString}</span>`
    }
    if (keyword)   return `<span class="token-keyword">${keyword}</span>`
    if (className) return `<span class="token-class">${className}</span>`
    if (argument)  return `<span class="token-argument">${argument}</span>`
    if (constant)  return `<span class="token-constant">${constant}</span>`
    if (method)    return `<span class="token-function">${method}</span>`
    return match
  })
}

export default (markdown) => {
  const codeBlocks = []
  
  let placeholderMarkdown = markdown.replace(/```(javascript|js)?[\s\n]*([\s\S]*?)```/g, (match, lang, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`
    const cleanCode = code.trim()
    
    lang === 'javascript' || lang === 'js' 
      ? codeBlocks.push(`<code-block><pre class="custom-code-block"><code>${highlightJS(cleanCode)}</code></pre></code-block>`)
      : codeBlocks.push(`<code-block><pre><code>${escapeHtml(cleanCode)}</code></pre></code-block>`)

    return id
  })

  let html = placeholderMarkdown.replace(/^(#{1,6}) (.*?)$/gm, (_, hashes, txt) => {
    const lvl = hashes.length
    return `<h${lvl}>${txt}</h${lvl}>`
  })

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

  html = html.split(/\n\s*\n/).map(block => {
    block = block.trim()
    if (/^<(h[1-6]|pre)/.test(block) || block.startsWith('__CODE_BLOCK_')) return block
    
    if (block.startsWith('|')) {
      const lines = block.split('\n').map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
      const ths = lines[0].map(h => `<th>${h}</th>`).join('')
      const trs = lines.slice(2).map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
      return `<code-block><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></code-block>`
    }

    const lines = block.split('\n')
    const isStrictDiff = lines.some(line => {
      const trimmed = line.trim()
      return trimmed.startsWith('\\-') || trimmed.startsWith('\\+')
    })

    if (isStrictDiff) {
      return lines.map(line => {
        let cleanLine = line.trim().replace(/\\$/, '').trim()
        if (cleanLine.startsWith('\\-')) return `<p class="diff-delete">${cleanLine.slice(1)}</p>`
        if (cleanLine.startsWith('\\+')) return `<p class="diff-add">${cleanLine.slice(1)}</p>`
        return `<p>${cleanLine}</p>`
      }).join('\n')
    }

    return `<p>${block.replace(/\n/g, '<br>')}</p>`
  }).join('\n')

  codeBlocks.forEach((blockMarkup, index) => html = html.replace(`__CODE_BLOCK_${index}__`, () => blockMarkup))

  return html
}
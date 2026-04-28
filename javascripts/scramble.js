/**
 * Applies a progressive text decoding effect to a text node.
 */
function scrambleTextNode(textNode) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
    
    // Store original text
    if (!textNode.originalText) {
        textNode.originalText = textNode.nodeValue;
    }
    
    const originalText = textNode.originalText;
    
    // Skip empty or purely whitespace nodes
    if (!originalText.trim()) return;
    
    // Generate a random resolution order once per node
    if (!textNode.revealOrder) {
        const indices = Array.from({length: originalText.length}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const revealOrder = new Array(originalText.length);
        indices.forEach((charIndex, step) => {
            revealOrder[charIndex] = step;
        });
        textNode.revealOrder = revealOrder;
    }
    const revealOrder = textNode.revealOrder;
    
    let iteration = 0;
    let interval = null;
    
    clearInterval(interval);
    
    // Make the total duration independent of word length (e.g. ~20 frames total)
    const step = originalText.length / 5; 
    
    interval = setInterval(() => {
        let newText = "";
        const threshold = Math.floor(iteration);
        const charLen = characters.length;
        
        for (let i = 0; i < originalText.length; i++) {
            const char = originalText[i];
            if (char === " " || char === "\n" || char === "\t" || revealOrder[i] < threshold) {
                newText += char;
            } else {
                newText += characters[Math.floor(Math.random() * charLen)];
            }
        }
        
        textNode.nodeValue = newText;
        
        if (iteration >= originalText.length) {
            clearInterval(interval);
            textNode.nodeValue = originalText;
        }
        
        iteration += step; 
    }, 30);
}

/**
 * Recursively walks the DOM tree to find and scramble all text nodes.
 */
function walkDOM(node) {
    // Avoid scrambling scripts, styles, or SVG content
    if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "KBD"].includes(node.tagName)) return;
    
    if (node.nodeType === 3) { // Text node
        scrambleTextNode(node);
    } else if (node.nodeType === 1) { // Element node
        node.childNodes.forEach(walkDOM);
    }
}

// Support standard page load and MkDocs Material instant navigation
function initScramble() {
    // Target only headings and navigation links
    const targets = document.querySelectorAll("h1, h2, h3, h4, h5, h6, .md-nav__link, .md-tabs__link, .md-header__title");
    targets.forEach(target => walkDOM(target));
}

document.addEventListener("DOMContentLoaded", () => {
    initScramble();
    
    // Scramble search results dynamically as they are loaded by MkDocs Material
    const searchObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.tagName === "LI" && node.classList.contains("md-search-result__item")) {
                        walkDOM(node);
                    } else if (node.querySelectorAll) {
                        const items = node.querySelectorAll(".md-search-result__item");
                        items.forEach(item => walkDOM(item));
                    }
                }
            });
        });
    });
    
    // Attach observer to search container if available, otherwise body
    const searchContainer = document.querySelector(".md-search-result") || document.body;
    if (searchContainer) {
        searchObserver.observe(searchContainer, { childList: true, subtree: true });
    }
});

// If using Material for MkDocs with instant navigation
if (typeof document$ !== "undefined") {
    document$.subscribe(function() {
        // Small delay to ensure the DOM is swapped in Material before walking
        setTimeout(initScramble, 50);
    });
}

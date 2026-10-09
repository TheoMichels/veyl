import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';

function extractText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}

let extracted = "";

const markdown = `
* Gemini s'attaque aux tâches d'entreprise complexes : Google déploie des capacités agentiques permettant à Gemini de planifier, d'exécuter des workflows entre plusieurs outils d'entreprise et de déléguer des tâches à des sous-agents via des identités numériques dédiées.
`;

const App = () => {
  return React.createElement(ReactMarkdown, {
    components: {
      li: ({ node }) => {
        extracted = extractText(node);
        return React.createElement('li', null, "test");
      }
    }
  }, markdown);
};

renderToString(React.createElement(App));
console.log("Extracted:", JSON.stringify(extracted));

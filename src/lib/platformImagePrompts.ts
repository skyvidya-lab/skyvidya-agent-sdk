import type { PromptTemplate } from "./imagePromptTemplates";

// Platform-specific prompts for Skyvidya Agent SDK
export const platformLogoTemplates: PromptTemplate[] = [
  {
    id: 'skyvidya-ai-orchestration',
    label: 'AI Orchestration',
    prompt: 'Create a professional enterprise logo for "Skyvidya Agent SDK" - an AI agent orchestration platform. Design should include abstract neural network patterns, interconnected nodes, circuit elements. Use gradient colors: deep blue (#1c2951) to vibrant purple (#7c3aed) to tech green (#16a34a). Modern, sophisticated, trustworthy. Technology-forward aesthetic. White background. Include subtle geometric shapes suggesting connectivity and intelligence.',
    imageType: 'logo',
  },
  {
    id: 'skyvidya-minimal',
    label: 'Minimalista',
    prompt: 'Create a minimal, clean logo for Skyvidya Agent SDK platform. Abstract "S" lettermark with AI/tech elements. Use gradient from #1c2951 (deep blue) to #7c3aed (purple). Simple geometric shapes, professional, enterprise-grade. White background.',
    imageType: 'logo',
  },
  {
    id: 'skyvidya-shield',
    label: 'Escudo/Segurança',
    prompt: 'Create an enterprise logo featuring a shield combined with AI elements for Skyvidya Agent SDK. Represents security, governance, and validation. Gradient colors: #1c2951 to #7c3aed to #16a34a. Professional, trustworthy design. White background.',
    imageType: 'logo',
  },
  {
    id: 'skyvidya-hexagon',
    label: 'Hexágono Tech',
    prompt: 'Create a tech logo with hexagonal pattern representing Skyvidya Agent SDK ecosystem. Neural connections, data flow patterns. Gradient from #1c2951 (navy) through #7c3aed (purple) to #16a34a (green). Modern, sophisticated. White background.',
    imageType: 'logo',
  },
];

export const platformBackgroundTemplates: PromptTemplate[] = [
  {
    id: 'skyvidya-hero',
    label: 'Hero Principal',
    prompt: 'Create an enterprise-grade hero background for Skyvidya Agent SDK platform. Abstract neural network visualization with flowing data streams, glowing connection points. Gradient from #1c2951 (deep blue) at bottom to #7c3aed (purple) in middle to subtle #16a34a (green) highlights. Professional, high-tech aesthetic. 16:9 aspect ratio. Subtle geometric patterns, bokeh lights, depth of field.',
    imageType: 'background',
  },
  {
    id: 'skyvidya-dashboard',
    label: 'Dashboard Clean',
    prompt: 'Create a clean, professional background for Skyvidya dashboard. Subtle gradient from #1c2951 to darker variant with minimal geometric patterns. Abstract tech lines, very subtle. Professional, non-distracting. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'skyvidya-circuit',
    label: 'Circuito Digital',
    prompt: 'Create a digital circuit board background for Skyvidya platform. Microchip patterns, electronic pathways, glowing traces. Colors: #1c2951 (base), #7c3aed (highlights), #16a34a (accents). High-tech, enterprise aesthetic. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'skyvidya-data-flow',
    label: 'Fluxo de Dados',
    prompt: 'Create a data flow visualization background for Skyvidya Agent SDK. Abstract data particles, information streams, network topology. Gradient from #1c2951 through #7c3aed with #16a34a energy bursts. Dynamic, professional. 16:9 aspect ratio.',
    imageType: 'background',
  },
];

export const platformFaviconTemplates: PromptTemplate[] = [
  {
    id: 'skyvidya-favicon-s',
    label: 'Letra S',
    prompt: 'Create a simple favicon icon with letter "S" for Skyvidya. Modern, bold design. Gradient from #1c2951 to #7c3aed. Clean, recognizable at small sizes. Square format.',
    imageType: 'favicon',
  },
  {
    id: 'skyvidya-favicon-ai',
    label: 'AI Symbol',
    prompt: 'Create a simple AI brain or neural node favicon for Skyvidya. Minimalist design, recognizable at 32x32px. Colors: #7c3aed primary with #16a34a accent. Square format.',
    imageType: 'favicon',
  },
];

export type ImageType = 'logo' | 'background' | 'favicon' | 'hero';

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  imageType: ImageType;
}

export const logoTemplates: PromptTemplate[] = [
  {
    id: 'tech-minimal',
    label: 'Tech Minimalista',
    prompt: 'Create a minimal, modern tech company logo with clean geometric shapes, using a gradient of blue and purple colors. Professional, corporate style. White background. Simple and elegant design.',
    imageType: 'logo',
  },
  {
    id: 'ai-brain',
    label: 'IA/Cérebro',
    prompt: 'Create a modern AI brain logo with neural network patterns, circuit board elements, glowing connections. Blue and purple gradient colors. Technology-focused, futuristic style. White background.',
    imageType: 'logo',
  },
  {
    id: 'chat-bubble',
    label: 'Bolha de Chat',
    prompt: 'Create a sleek chat bubble logo with smooth rounded edges, representing communication and AI assistance. Modern gradient from blue to teal. Minimalist design on white background.',
    imageType: 'logo',
  },
  {
    id: 'healthcare',
    label: 'Saúde',
    prompt: 'Create a healthcare logo with medical cross symbol integrated with digital elements, representing digital health. Clean design with blue and green colors. Professional medical aesthetic. White background.',
    imageType: 'logo',
  },
  {
    id: 'government',
    label: 'Governo',
    prompt: 'Create a government/public service logo with institutional elements, shield or emblem style, official and trustworthy appearance. Navy blue and gold colors. Formal design. White background.',
    imageType: 'logo',
  },
  {
    id: 'education',
    label: 'Educação',
    prompt: 'Create an education logo with book, graduation cap, or knowledge-related symbols. Warm colors like orange and blue. Friendly, approachable design. White background.',
    imageType: 'logo',
  },
];

export const backgroundTemplates: PromptTemplate[] = [
  {
    id: 'gradient-abstract',
    label: 'Gradiente Abstrato',
    prompt: 'Create an abstract background with smooth flowing gradients from deep blue to purple, with subtle geometric patterns and light effects. Modern, professional, enterprise-grade design. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'neural-network',
    label: 'Rede Neural',
    prompt: 'Create a background showing a futuristic neural network with glowing nodes and connections, data flowing through circuits. Dark blue background with bright blue and purple lights. Technology aesthetic. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'cityscape-tech',
    label: 'Cidade Tech',
    prompt: 'Create a modern city skyline silhouette with digital overlay effects, holographic elements, representing smart city and technology. Blue and purple color scheme with gradient sky. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'medical-abstract',
    label: 'Médico Abstrato',
    prompt: 'Create a medical/healthcare themed background with abstract DNA strands, molecules, and soft medical icons. Calm blue and green gradients. Professional healthcare aesthetic. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'government-formal',
    label: 'Institucional',
    prompt: 'Create a formal institutional background with subtle patterns, architectural elements, representing government or public service. Navy blue and gold accents. Professional and trustworthy design. 16:9 aspect ratio.',
    imageType: 'background',
  },
  {
    id: 'education-bright',
    label: 'Educação Vibrante',
    prompt: 'Create an educational background with colorful book illustrations, learning symbols, bright and welcoming atmosphere. Orange, blue, and yellow colors. Friendly design for students. 16:9 aspect ratio.',
    imageType: 'background',
  },
];

export const heroTemplates: PromptTemplate[] = [
  {
    id: 'chat-assistant',
    label: 'Assistente de Chat',
    prompt: 'Create a friendly AI assistant illustration showing a robot or digital character with a welcoming pose, modern 3D style, soft gradients of blue and purple. Professional but approachable. Square format, centered composition.',
    imageType: 'hero',
  },
  {
    id: 'customer-service',
    label: 'Atendimento',
    prompt: 'Create an illustration of a customer service scene with digital elements, showing communication and support. Modern flat design style with blue and teal colors. Friendly and professional. Square format.',
    imageType: 'hero',
  },
  {
    id: 'abstract-tech',
    label: 'Tech Abstrato',
    prompt: 'Create an abstract technological illustration with flowing data streams, geometric shapes, and glowing elements. Modern, sophisticated design with blue and purple gradients. Square format, centered.',
    imageType: 'hero',
  },
  {
    id: 'innovation',
    label: 'Inovação',
    prompt: 'Create an innovation-themed illustration showing lightbulbs, creative elements, and futuristic technology. Bright, inspiring colors with blue and yellow. Modern illustration style. Square format.',
    imageType: 'hero',
  },
  {
    id: 'digital-workspace',
    label: 'Workspace Digital',
    prompt: 'Create a modern digital workspace illustration with floating screens, collaboration elements, and productivity symbols. Clean, professional design with blue and white colors. Square format, centered.',
    imageType: 'hero',
  },
];

export const getTemplatesByType = (type: ImageType): PromptTemplate[] => {
  switch (type) {
    case 'logo':
      return logoTemplates;
    case 'background':
      return backgroundTemplates;
    case 'hero':
      return heroTemplates;
    default:
      return [];
  }
};

import type { Speaker, Dialog, Voice, GlobalSettings } from './types';

export const VOICES: Voice[] = [
  { id: 'chirp3-custom', name: 'Instant Custom Voice', gender: 'female', description: 'Your Voice Clone (Requires GCP Token)' },
  // Female Voices
  { id: 'aoede', name: 'Aoede', gender: 'female', description: 'A smooth, melodic voice.' },
  { id: 'autonoe', name: 'Autonoe', gender: 'female', description: 'A clear, professional voice.' },
  { id: 'callirrhoe', name: 'Callirrhoe', gender: 'female', description: 'A warm and friendly tone.' },
  { id: 'despina', name: 'Despina', gender: 'female', description: 'A gentle and calming voice.' },
  { id: 'erinome', name: 'Erinome', gender: 'female', description: 'An expressive and lively voice.' },
  { id: 'kore', name: 'Kore', gender: 'female', description: 'Clear, professional, and steady.' },
  { id: 'laomedeia', name: 'Laomedeia', gender: 'female', description: 'A mature and graceful voice.' },
  { id: 'leda', name: 'Leda', gender: 'female', description: 'A bright and youthful voice.' },
  { id: 'pulcherrima', name: 'Pulcherrima', gender: 'female', description: 'An elegant and articulate voice.' },
  { id: 'vindemiatrix', name: 'Vindemiatrix', gender: 'female', description: 'A crisp, informative tone.' },
  { id: 'zephyr', name: 'Zephyr', gender: 'female', description: 'Friendly, conversational, and warm.' },

  // Male Voices
  { id: 'achernar', name: 'Achernar', gender: 'male', description: 'A deep and resonant voice.' },
  { id: 'achird', name: 'Achird', gender: 'male', description: 'A confident and clear voice.' },
  { id: 'algenib', name: 'Algenib', gender: 'male', description: 'A powerful and dramatic tone.' },
  { id: 'algieba', name: 'Algieba', gender: 'male', description: 'A strong and assertive voice.' },
  { id: 'alnilam', name: 'Alnilam', gender: 'male', description: 'A smooth, narrative voice.' },
  { id: 'charon', name: 'Charon', gender: 'male', description: 'Deep, resonant, and serious.' },
  { id: 'enceladus', name: 'Enceladus', gender: 'male', description: 'A bold and energetic voice.' },
  { id: 'fenrir', name: 'Fenrir', gender: 'male', description: 'Powerful, dramatic, and commanding.' },
  { id: 'gacrux', name: 'Gacrux', gender: 'male', description: 'A warm and reassuring tone.' },
  { id: 'iapetus', name: 'Iapetus', gender: 'male', description: 'An engaging and approachable voice.' },
  { id: 'orus', name: 'Orus', gender: 'male', description: 'A steady and serious voice.' },
  { id: 'puck', name: 'Puck', gender: 'male', description: 'Engaging, warm, and approachable.' },
  { id: 'rasalgethi', name: 'Rasalgethi', gender: 'male', description: 'A wise and mature voice.' },
  { id: 'sadachbia', name: 'Sadachbia', gender: 'male', description: 'A clear and articulate voice.' },
  { id: 'sadaltager', name: 'Sadaltager', gender: 'male', description: 'A friendly and conversational voice.' },
  { id: 'schedar', name: 'Schedar', gender: 'male', description: 'A strong and confident voice.' },
  { id: 'sulafat', name: 'Sulafat', gender: 'male', description: 'A smooth and calming voice.' },
  { id: 'umbriel', name: 'Umbriel', gender: 'male', description: 'A deep and mysterious voice.' },
  { id: 'zubenelgenubi', name: 'Zubenelgenubi', gender: 'male', description: 'A unique and memorable voice.' },
];


export const SPEAKER_COLORS = ['#00FFFF', '#FF00FF', '#FFD700', '#00FF7F', '#FF6347', '#BA55D3'];

export const STYLE_PRESETS = [
    'Cheerfully', 'Sadly', 'Whispering', 'Shouting', 
    'Sarcastically', 'Professionally', 'Fast-paced', 'Slowly',
    'Excitedly', 'Mysteriously', 'Angrily', 'Calmly'
];

export const DEFAULT_SETTINGS: GlobalSettings = {
    forceLineByLine: false,
    lineGap: 0,
};

export const INITIAL_SPEAKERS: Speaker[] = [
  {
    id: 'speaker-1',
    name: 'Joe',
    voice: 'puck',
    color: SPEAKER_COLORS[0],
    personality: 'A weary space cowboy'
  },
  {
    id: 'speaker-2',
    name: 'Jane',
    voice: 'kore',
    color: SPEAKER_COLORS[1],
    personality: 'A sharp and witty starship captain'
  },
];

export const INITIAL_DIALOGS: Dialog[] = [
  { id: 'dialog-1', speakerId: 'speaker-1', text: "How's it going today Jane?", style: 'casually' },
  { id: 'dialog-2', speakerId: 'speaker-2', text: 'Not too bad, how about you?', style: 'brightly' },
];
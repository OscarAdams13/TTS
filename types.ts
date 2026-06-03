export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
}

export interface Speaker {
  id: string;
  name: string;
  voice: string; // Voice ID
  color: string;
  personality?: string;
  customVoiceKey?: string; // Instant Custom Voice cloning key
}

export interface Dialog {
  id: string;
  speakerId: string;
  text: string;
  style?: string;
}

export interface GlobalSettings {
  forceLineByLine: boolean;
  lineGap: number; // in milliseconds
  gcpToken?: string; // Google Cloud token for Instant Custom Voice
  gcpProjectId?: string; // GCP Project ID (x-goog-user-project)
}
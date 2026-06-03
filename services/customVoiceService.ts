export async function generateVoiceCloningKey(
    gcpToken: string | undefined,
    projectId: string | undefined,
    referenceAudioB64: string,
    consentAudioB64: string
): Promise<string> {
    if (!gcpToken) {
        throw new Error("GCP Token is missing. Please set it in Settings.");
    }
    
    // We send base64 data to the API. Using ALAW or MULAW? Wait, the API requires the content to be base64-encoded.
    // However, JS MediaRecorder output depends on browser (often webm). 
    // The API doc says Supported audio_encoding values are LINEAR16, PCM, MP3, and M4A.
    // Wait! M4A or MP3 usually means we can't easily record it cross-browser natively without MediaRecorder using right codec.
    // Actually WebM audio from MediaRecorder might not be natively supported without transcoding. 
    // Wait, the API says "Supported encoding formats LINEAR16, PCM, MP3, M4A". WebM isn't listed.
    // If we use MediaRecorder in Safari it creates MP4 (M4A). In Chrome it creates WebM (Opus).
    // Let's assume we can provide standard webm and see if it works, or transcode using simple logic or accept file uploads!
    // But we are sending purely base64. Let's just pass `audioEncoding: 'LINEAR16'` if we get raw PCM, or omit it?
    // According to the docs: "audio_config": {"audio_encoding": "LINEAR16"}
    
    // We will assume the base64 string provided is raw base64.
    const url = "https://texttospeech.googleapis.com/v1beta1/voices:generateVoiceCloningKey";

    // It requires to NOT include the `data:audio/...;base64,` prefix in standard Cloud APIs.
    const stripPrefix = (str: string) => str.replace(/^data:.*?;base64,/, "");

    const requestBody = {
        "reference_audio": {
            "audio_config": {"audio_encoding": "LINEAR16"}, // We must ensure we record/upload LINEAR16 OR change this to the respective type
            "content": stripPrefix(referenceAudioB64),
        },
        "voice_talent_consent": {
            "audio_config": {"audio_encoding": "LINEAR16"},
            "content": stripPrefix(consentAudioB64),
        },
        "consent_script": "I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.",
        "language_code": "en-US",
    };

    const headers: Record<string, string> = {
        "Authorization": `Bearer ${gcpToken.trim()}`,
        "Content-Type": "application/json; charset=utf-8",
    };
    if (projectId) {
        headers["x-goog-user-project"] = projectId.trim();
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(`Failed to generate cloning key: ${errJson.error?.message || response.statusText}`);
    }

    const json = await response.json();
    return json.voiceCloningKey;
}

export async function synthesizeWithClonedVoice(
    gcpToken: string | undefined,
    projectId: string | undefined,
    voiceKey: string,
    text: string
): Promise<string> {
    if (!gcpToken) throw new Error("GCP Token is missing.");

    const url = "https://texttospeech.googleapis.com/v1beta1/text:synthesize";

    const requestBody = {
        "input": {
            "text": text
        },
        "voice": {
            "language_code": "en-US",
            "voice_clone": {
                "voice_cloning_key": voiceKey,
            }
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
        }
    };

    const headers: Record<string, string> = {
        "Authorization": `Bearer ${gcpToken.trim()}`,
        "Content-Type": "application/json; charset=utf-8"
    };
    if (projectId) {
        headers["x-goog-user-project"] = projectId.trim();
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(`Failed to synthesize with custom voice: ${errJson.error?.message || response.statusText}`);
    }

    const json = await response.json();
    return json.audioContent; // Base64 audio content
}

# **App Name**: Phonetic Probe Assist

## Core Features:

- Word List Gen: Minimal word list generator that chooses a minimal set of words to probe the necessary phonemes; this generator uses an LLM tool to optionally adapt to specific dialects, using few-shot learning when dialects are not well supported.
- Probe Admin: Intuitive UI to present words and input IPA transcriptions, marking errors (substitution, omission, etc.) and capturing specific error details. Transcription includes marking whether or not the transcription involved an error.
- Coverage Tracking: Real-time display of which phoneme-position pairs are complete or need more data; includes visual error summaries to streamline the assessment.
- Data Management: Secure data storage in Firebase Firestore with authentication for SLP user management, enabling session saving/resuming and client data privacy.
- Export: Export phonetic inventory and error data as PDF/CSV, ensuring compatibility with clinical documentation systems.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) to evoke calmness and reliability, ideal for a clinical tool.
- Background color: Very light gray (#F5F5F5) to ensure comfortable contrast and readability during prolonged use.
- Accent color: Teal (#008080) to draw attention to interactive elements and key information within the app.
- Body and headline font: 'PT Sans', a humanist sans-serif suitable for headlines or body text.
- Simple, clear icons to represent different error types and UI actions; use a consistent style for quick recognition.
- Tab-based navigation to separate 'Session', 'Coverage', and 'Export' functions; minimize visual clutter.
- Subtle transitions when marking errors or completing phoneme coverage, providing unobtrusive user feedback.
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("AVAILABLE MODELS:");
    data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
  } catch (err) {
    console.error(err);
  }
}
run();

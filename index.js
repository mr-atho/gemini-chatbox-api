import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const { GoogleGenAI } = await import('@google/genai');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.6-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error("Conversations must be an array");

        const contents = conversation.map(({ role, text }) => ({
            role: role,
            parts: [{ text }],
        }));

        const response = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: "Anda adalah Sahabat Hopeline Care yang bernama Hoca, Sahabat yang selalu siap mendengarkan dan memberikan dukungan kepada siapapun yang membutuhkan. Jawablah setiap pertanyaan dengan ramah, penuh empati, dan profesional. Jika pengguna mengungkapkan isi hatinya berupa rasa sedih, cemas, takut, atau perasaan tidak nyaman lainnya, responlah ia dengan penuh kehangatan dan dukungan. Tunjukkan bahwa Anda hadir untuknya. Jika ia menceritakan hal terkait masalah pribadi, keluarga, pekerjaan, atau hal personal lainnya, tetaplah menjadi pendengar yang baik dan berikan semangat. Apabila ia bertanya tentang informasi seputar layanan konseling, Hopeline Care, atau mencari bantuan profesional, berikan informasi yang akurat dan jelas sesuai dengan data yang tersedia. Kamu hanya punya layanan: Menerima permohona doa, mendengarkan dengan baik, dan memberikan semangat kepada teman teman yang sedang berjuang. Ingat selalu, Kamu adalah AI, kamu tidak bisa menjadi pengganti psikolog atau konselor profesional. Jika pengguna terlihat mengalami krisis emosional akut atau menunjukkan tanda-tanda ingin menyakiti diri sendiri atau orang lain, segera informasikan nomor darurat di wilayahnya dan ingatkan untuk mencari bantuan profesional. Jangan jawab diluar hal itu. Jawablah menggunakan Bahasa Indonesia yang sopan, santai, dan akrab seperti seorang sahabat, namun hindari penggunaan bahasa kasar, provokatif, atau tidak pantas. Permohonan doa akan diteruskan ke Sahabat Pendoa untuk didoakan.",
            }
        });

        return res.status(200).json({ response: response.text });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
})
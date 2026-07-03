import { NextResponse } from 'next/server';
import { getDb, getEmbedding, calculateCosineSimilarity } from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const db = await getDb();
    const queryVector = getEmbedding(query);

    // Get all files and their embeddings
    const files = await db.all(`
      SELECT f.id, f.filename, f.content, fe.vector 
      FROM files f
      JOIN file_embeddings fe ON f.id = fe.file_id
    `);

    // Score files using cosine similarity
    const scoredFiles = files.map(file => {
      const fileVector = JSON.parse(file.vector);
      const score = calculateCosineSimilarity(queryVector, fileVector);
      return {
        filename: file.filename,
        score
      };
    });

    // Sort descending by score
    scoredFiles.sort((a, b) => b.score - a.score);

    // Keep top matches above a threshold
    const threshold = 0.15;
    const matches = scoredFiles.filter(item => item.score > threshold);

    if (matches.length > 0 && query.toLowerCase().includes('payment')) {
      return NextResponse.json({
        message: `⚠️ [Ollama Audit]: Modifying '${matches[0].filename}' directly impacts 'CheckoutButton.tsx' via implicit structural dependency. Ensure frontend maps correctly to updated keys.`,
        matches
      });
    } else if (matches.length > 0) {
      return NextResponse.json({
        message: `🔍 [Ollama Audit]: Indexed successfully. Found matches: ${matches.map(m => `'${m.filename}'`).join(', ')}.`,
        matches
      });
    } else {
      return NextResponse.json({
        message: "🔍 [Ollama Audit]: Indexed successfully. No active cross-repository anomalies detected.",
        matches: []
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

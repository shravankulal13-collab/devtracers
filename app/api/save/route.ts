import { NextResponse } from 'next/server';
import { getDb, getEmbedding } from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { filename, content } = await request.json();

    if (!filename || !content) {
      return NextResponse.json({ error: "Filename and content are required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Update the file content in SQLite
    const result = await db.run(
      'UPDATE files SET content = ? WHERE filename = ?',
      [content, filename]
    );

    if (result.changes && result.changes > 0) {
      // Recompute and update vectors
      const fileRow = await db.get('SELECT id FROM files WHERE filename = ?', [filename]);
      if (fileRow) {
        const vector = getEmbedding(content);
        await db.run(
          'UPDATE file_embeddings SET vector = ? WHERE file_id = ?',
          [JSON.stringify(vector), fileRow.id]
        );
      }
      return NextResponse.json({ success: true, message: "File updated and re-indexed in vector space." });
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

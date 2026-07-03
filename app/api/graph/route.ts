import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage') || 'hours67';

  try {
    const db = await getDb();

    // Query active files and stage-specific dependencies
    const files = await db.all('SELECT filename, language, content FROM files');
    const dependencies = await db.all('SELECT * FROM dependencies WHERE stage = ?', [stage]);

    // Map files to React Flow Nodes layout
    let nodes: any[] = [];
    if (stage === 'initial') {
      nodes = [
        { id: '1', position: { x: 180, y: 150 }, data: { label: '📂 Workspace Initialized' }, style: { background: '#161b22', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' } }
      ];
    } else if (stage === 'hours12') {
      nodes = [
        { id: '1', position: { x: 80, y: 120 }, data: { label: '⚙️ backend-api (Repo)' }, style: { background: '#161b22', color: '#ff7b72', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' } },
        { id: '2', position: { x: 260, y: 120 }, data: { label: '⚛️ frontend-ui (Repo)' }, style: { background: '#161b22', color: '#3fa146', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' } }
      ];
    } else {
      // Map based on file records
      const nodeMap: Record<string, { label: string, color: string, border: string, x: number, y: number }> = {
        'services/payment-gateway.ts': { label: '💳 payment-gateway.ts', color: '#ff7b72', border: '#ff7b72', x: 180, y: 40 },
        'controllers/order-controller.js': { label: '📦 order-controller.js', color: '#c9d1d9', border: '#30363d', x: 40, y: 140 },
        'middleware/auth-middleware.ts': { label: '🎛️ auth-middleware.ts', color: '#c9d1d9', border: '#30363d', x: 320, y: 140 },
        'components/CheckoutButton.tsx': { label: '⚛️ CheckoutButton.tsx', color: '#3fa146', border: '#3fa146', x: 180, y: 250 },
        'components/UserProfile.jsx': { label: '📝 UserProfile.jsx', color: '#c9d1d9', border: '#30363d', x: 40, y: 250 }
      };

      nodes = Object.entries(nodeMap).map(([filename, cfg], index) => {
        const fileExists = files.some(f => f.filename === filename);
        if (!fileExists) return null;
        if (stage === 'hours35' && filename === 'components/UserProfile.jsx') return null;

        return {
          id: String(index + 1),
          position: { x: cfg.x, y: cfg.y },
          data: { label: cfg.label },
          style: {
            background: '#161b22',
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            cursor: 'pointer'
          }
        };
      }).filter(Boolean);
    }

    // Map dependencies to React Flow Edges
    const fileIdToIndex: Record<string, string> = {
      'services/payment-gateway.ts': '1',
      'controllers/order-controller.js': '2',
      'middleware/auth-middleware.ts': '3',
      'components/CheckoutButton.tsx': '4',
      'components/UserProfile.jsx': '5'
    };

    const edges = dependencies.map((dep, index) => {
      const sourceId = fileIdToIndex[dep.source_file];
      const targetId = fileIdToIndex[dep.target_file];
      if (!sourceId || !targetId) return null;

      return {
        id: `e-${index}`,
        source: sourceId,
        target: targetId,
        animated: dep.animated === 1,
        style: {
          stroke: dep.animated === 1 ? '#58a6ff' : '#30363d',
          strokeWidth: dep.animated === 1 ? 1.5 : 1
        }
      };
    }).filter(Boolean);

    return NextResponse.json({ nodes, edges, files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { withRoleAuth, handleApiError } from '../../../middleware';

// POST - Alternar status da empresa
export const POST = withRoleAuth(['admin'])(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const docRef = adminDb.collection('companies').doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const currentStatus = doc.data()?.status;
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';

    await docRef.update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Status da empresa alterado para ${newStatus} com sucesso`,
    });

  } catch (error) {
    return handleApiError(error);
  }
});

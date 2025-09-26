
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { withRoleAuth, handleApiError } from '../../middleware';

// GET - Obter empresa por ID
export const GET = withRoleAuth(['admin', 'operator', 'client'])(async (
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

    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT - Atualizar empresa
export const PUT = withRoleAuth(['admin'])(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const docRef = adminDb.collection('companies').doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE - Excluir empresa
export const DELETE = withRoleAuth(['admin'])(async (
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

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
});

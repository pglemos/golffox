
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { withAuth, handleApiError } from '../../middleware';

// GET - Obter perfil do usuário
export const GET = withAuth(async (request) => {
  try {
    const uid = request.user?.uid;
    if (!uid) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: userDoc.data() });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT - Atualizar perfil do usuário
export const PUT = withAuth(async (request) => {
  try {
    const uid = request.user?.uid;
    if (!uid) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'phone', 'cpf', 'avatar_url'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido fornecido para atualização' },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    await adminDb.collection('users').doc(uid).update(updateData);

    return NextResponse.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    return handleApiError(error);
  }
});

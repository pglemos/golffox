
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebaseAdmin';
import { withAuth, handleApiError } from '../../middleware';

export const POST = withAuth(async (request) => {
  try {
    const uid = request.user?.uid;
    if (!uid) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    await adminAuth.revokeRefreshTokens(uid);

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
});


import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { handleApiError, validateRequestBody } from '../../middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequestBody(body, ['email', 'password']);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${validation.missingFields?.join(', ')}` },
        { status: 400 }
      );
    }

    const { email, password } = body;

    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      
      // A API de login do Firebase não expõe um método para verificar a senha diretamente.
      // A verificação é feita no lado do cliente.
      // Para o back-end, criamos um token customizado e retornamos ao cliente para login.
      const customToken = await adminAuth.createCustomToken(userRecord.uid);

      const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();

      return NextResponse.json({
        message: 'Login realizado com sucesso',
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          name: userData?.name || '',
          role: userData?.role || 'passenger',
        },
        token: customToken,
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      return handleApiError(error);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

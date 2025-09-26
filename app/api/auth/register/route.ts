
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { handleApiError, validateRequestBody } from '../../middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequestBody(body, ['email', 'password', 'name', 'role']);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${validation.missingFields?.join(', ')}` },
        { status: 400 }
      );
    }

    const { email, password, name, role, company_id } = body;

    const allowedRoles = ['admin', 'operator', 'driver', 'passenger'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
    }

    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });

      const userData = {
        email,
        name,
        role,
        company_id: company_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await adminDb.collection('users').doc(userRecord.uid).set(userData);

      return NextResponse.json({
        message: 'Usuário registrado com sucesso',
        user: {
          id: userRecord.uid,
          email,
          name,
          role,
        },
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'E-mail já em uso' }, { status: 409 });
      }
      return handleApiError(error);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

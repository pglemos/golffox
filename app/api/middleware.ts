
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../lib/firebaseAdmin';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    role: string;
    company_id?: string;
    name?: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token de autorização não fornecido' };
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    const userData = userDoc.data();

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: userData?.name,
        role: userData?.role,
        company_id: userData?.company_id,
      },
    };
  } catch (error: any) {
    console.error('Erro na autenticação:', error);
    if (error.code === 'auth/id-token-expired') {
      return { success: false, error: 'Token expirado' };
    }
    return { success: false, error: 'Token inválido' };
  }
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    (request as AuthenticatedRequest).user = authResult.user;

    return handler(request as AuthenticatedRequest, context);
  };
}

export function withRoleAuth(allowedRoles: string[]) {
  return function (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context?: any) => {
      const authResult = await authenticateRequest(request);

      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      (request as AuthenticatedRequest).user = authResult.user;

      const userRole = authResult.user?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Acesso negado. Permissões insuficientes.' },
          { status: 403 }
        );
      }

      return handler(request as AuthenticatedRequest, context);
    };
  };
}

export function handleApiError(error: any): NextResponse {
  console.error('Erro na API:', error);

  if (error.code === 'permission-denied') {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  } 
  if (error.code === 'already-exists') {
    return NextResponse.json({ error: 'Dados duplicados.' }, { status: 409 });
  }

  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
}

export function validateRequestBody(body: any, requiredFields: string[]): {
  isValid: boolean;
  missingFields?: string[];
} {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

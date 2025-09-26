
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { withRoleAuth, handleApiError, validateRequestBody } from '../middleware';

// GET - Listar empresas
export const GET = withRoleAuth(['admin', 'operator'])(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let companiesQuery = adminDb.collection('companies');

    if (status) {
      companiesQuery = companiesQuery.where('status', '==', status);
    }

    const snapshot = await companiesQuery.get();
    let companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchTerm = search.toLowerCase();
      companies = companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm) ||
        (company.cnpj && company.cnpj.includes(searchTerm))
      );
    }

    const total = companies.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCompanies = companies.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedCompanies,
      pagination: { page, limit, total, totalPages },
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST - Criar empresa
export const POST = withRoleAuth(['admin'])(async (request) => {
  try {
    const body = await request.json();

    const validation = validateRequestBody(body, ['name', 'cnpj', 'contact', 'address_text']);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${validation.missingFields?.join(', ')}` },
        { status: 400 }
      );
    }

    const newCompany = {
      ...body,
      status: 'Ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('companies').add(newCompany);
    const company = { id: docRef.id, ...newCompany };

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Empresa criada com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});

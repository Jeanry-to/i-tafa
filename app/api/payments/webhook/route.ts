import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 1. Route GET : Permet de vérifier rapidement dans le navigateur que le Webhook est en ligne
export async function GET() {
  return NextResponse.json(
    { message: 'Le service Webhook de paiement est opérationnel. Envoyez une requête POST pour traiter un paiement.' },
    { status: 200 }
  );
}

// 2. Route POST : Reçoit et traite les callbacks de paiement Mobile Money
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { status, transactionReference, profileId, amount, phone } = body;

    // Détection du succès du paiement selon l'opérateur
    const isSuccess =
      status === 'completed' ||
      status === 'SUCCESS' ||
      status === '00' ||
      status === 'PAID';

    if (!isSuccess) {
      return NextResponse.json(
        { message: 'Transaction non validée ou ignorée' },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'L’identifiant client (profileId) est manquant dans la requête' },
        { status: 400 }
      );
    }

    // Mise à jour automatique du client dans Supabase
    const { data, error } = await supabase
      .from('clients')
      .update({
        status: 'actif',
        payment_ref: transactionReference || null,
        amount_paid: amount || 0,
        phone_number: phone || null,
        joined_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId)
      .select();

    if (error) {
      console.error('Erreur Supabase Webhook :', error.message);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour : ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Client activé avec succès',
        updatedClient: data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Erreur traitement Webhook :', err.message);
    return NextResponse.json(
      { error: 'Format de requête JSON invalide ou erreur serveur' },
      { status: 500 }
    );
  }
}
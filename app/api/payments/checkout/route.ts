import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { profileId, amount, method, currency = 'USD' } = await request.json();

    // Validation des données requises
    if (!profileId || !amount || !method) {
      return NextResponse.json(
        { error: 'Données manquantes (profileId, amount, method requis)' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookUrl = `${siteUrl}/api/payments/webhook`;

    // -------------------------------------------------------------
    // CAS 1 : Cryptomonnaie (via NOWPayments - USDT TRC20)
    // -------------------------------------------------------------
    if (method === 'crypto') {
      const response = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: currency.toLowerCase(),
          pay_currency: 'usdttrc20',
          order_id: profileId,
          ipn_callback_url: webhookUrl,
          success_url: `${siteUrl}/dashboard?payment=success`,
          cancel_url: `${siteUrl}/checkout?payment=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du paiement Crypto');
      }

      return NextResponse.json({ redirectUrl: data.invoice_url });
    }

    // -------------------------------------------------------------
    // CAS 2 : Mobile Money & Carte Bancaire (via CinetPay)
    // -------------------------------------------------------------
    if (method === 'mobile_money' || method === 'card') {
      const transactionId = `TX-${profileId}-${Date.now()}`;

      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: transactionId,
          amount: amount,
          currency: currency === 'USD' ? 'XOF' : currency,
          description: 'Abonnement service',
          notify_url: webhookUrl,
          return_url: `${siteUrl}/dashboard?payment=success`,
          channels: method === 'mobile_money' ? 'MOBILE_MONEY' : 'CREDIT_CARD',
          metadata: profileId,
        }),
      });

      const data = await response.json();

      if (data.code !== '201') {
        throw new Error(data.message || 'Erreur de génération de paiement CinetPay');
      }

      return NextResponse.json({ redirectUrl: data.data.payment_url });
    }

    return NextResponse.json(
      { error: 'Méthode de paiement non supportée' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erreur Checkout API :', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
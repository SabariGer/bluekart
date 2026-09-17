import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const PORT = 3000;

// Production detection: explicit NODE_ENV, bundled dist file, or non-tsx runner
const isProduction =
  process.env.NODE_ENV === 'production' ||
  (typeof __filename !== 'undefined' && __filename.includes('dist')) ||
  Boolean(process.argv[1] && process.argv[1].includes('dist'));

// Lazy Stripe initialization as per environment guidelines
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && key.startsWith('sk_')) {
      stripeClient = new Stripe(key);
    }
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BlueCart Retail API',
      timestamp: new Date().toISOString(),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL),
    });
  });

  // German & EU Payment Gateways Status
  app.get('/api/payment-gateways', (req, res) => {
    res.json({
      stripe: {
        configured: Boolean(process.env.STRIPE_SECRET_KEY),
        publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
        mode: process.env.STRIPE_SECRET_KEY ? 'live' : 'dummy_sandbox',
      },
      paypal: {
        configured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        clientId: process.env.PAYPAL_CLIENT_ID || 'sb-demo-german-retailer',
        mode: process.env.PAYPAL_CLIENT_ID ? (process.env.PAYPAL_MODE || 'sandbox') : 'dummy_sandbox',
      },
      klarna: {
        configured: Boolean(process.env.KLARNA_API_KEY && process.env.KLARNA_API_SECRET),
        mode: process.env.KLARNA_API_KEY ? 'playground' : 'dummy_sandbox',
        supportedMethods: ['invoice', 'sofort', 'slice_it'],
      },
      sepa: {
        configured: true, // SEPA mandate generation is always supported
        creditorId: 'DE98ZZZ09999999999',
        mode: 'active',
      },
      giropay: {
        configured: Boolean(process.env.GIROPAY_MERCHANT_ID),
        mode: process.env.GIROPAY_MERCHANT_ID ? 'live' : 'dummy_sandbox',
      },
      applePay: {
        configured: true,
        mode: 'dummy_sandbox',
      },
      bankTransfer: {
        configured: true,
        bankName: 'Berliner Volksbank eG',
        iban: 'DE27 1009 0000 1234 5678 90',
        bic: 'BEVODEBBXXX',
        mode: 'active',
      },
      cashOnDelivery: {
        configured: true,
        carrier: 'DHL Paket GmbH (Nachnahme Service)',
        feeEur: 2.50,
        mode: 'active',
      },
      wero: {
        configured: true,
        network: 'European Payments Initiative (EPI) / Deutsche Kreditwirtschaft',
        mode: 'active',
      },
    });
  });

  // Stripe config endpoint
  app.get('/api/stripe/config', (req, res) => {
    res.json({
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    });
  });

  // Create Stripe payment intent
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'eur', orderId, customerEmail } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required (in cents)' });
      }

      const stripe = getStripe();
      if (stripe) {
        // Real Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount),
          currency: currency.toLowerCase(),
          receipt_email: customerEmail,
          metadata: {
            orderId: orderId || 'order_' + Date.now(),
            store: 'BlueCart Retail Germany',
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          mode: 'live_stripe',
        });
      }

      // Simulated Stripe sandbox response for test / preview mode
      const simulatedId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const simulatedSecret = `${simulatedId}_secret_${Math.random().toString(36).substring(2, 12)}`;

      return res.json({
        clientSecret: simulatedSecret,
        paymentIntentId: simulatedId,
        mode: 'simulated_test',
        message: 'Stripe simulated test transaction (No secret key set in .env). Test card accepted.',
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message || 'Payment intent creation failed' });
    }
  });

  // PayPal Create Order
  app.post('/api/paypal/create-order', async (req, res) => {
    try {
      const { amount, currency = 'EUR', orderId, customerEmail } = req.body;
      const paypalClientId = process.env.PAYPAL_CLIENT_ID;
      const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;

      if (paypalClientId && paypalSecret) {
        // In live production, exchange credentials for bearer token and call PayPal v2/checkout/orders
        // For now, return structured PayPal object ready for webhook / approval
      }

      // Dummy sandbox PayPal order
      const paypalOrderId = `PAYID-DE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return res.json({
        id: paypalOrderId,
        status: 'CREATED',
        mode: paypalClientId ? 'sandbox' : 'dummy_sandbox',
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
            rel: 'approve',
            method: 'GET',
          },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'PayPal order initiation failed' });
    }
  });

  // PayPal Capture Order
  app.post('/api/paypal/capture-order', async (req, res) => {
    try {
      const { orderId } = req.body;
      return res.json({
        id: orderId || `PAYID-DE-CAPTURED-${Date.now()}`,
        status: 'COMPLETED',
        payer: {
          payer_id: `PAYER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        },
        mode: 'dummy_sandbox',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'PayPal capture failed' });
    }
  });

  // Klarna Create Session (Rechnung / Sofort / Ratenkauf)
  app.post('/api/klarna/create-session', async (req, res) => {
    try {
      const { amount, currency = 'EUR', purchaseType = 'invoice', customerEmail } = req.body;
      const klarnaKey = process.env.KLARNA_API_KEY;

      const sessionId = `klarna_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const clientToken = `kl_token_${Math.random().toString(36).substring(2, 16)}`;

      return res.json({
        session_id: sessionId,
        client_token: clientToken,
        purchase_type: purchaseType, // 'invoice' | 'sofort' | 'slice_it'
        status: 'authorized',
        mode: klarnaKey ? 'playground' : 'dummy_sandbox',
        payment_method_categories: [
          { identifier: 'pay_later', name: 'Klarna. Rechnung (30 Tage)' },
          { identifier: 'pay_now', name: 'Klarna. Sofortüberweisung' },
          { identifier: 'pay_over_time', name: 'Klarna. Ratenkauf' },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Klarna session failed' });
    }
  });

  // SEPA-Lastschrift Mandate Authorization
  app.post('/api/sepa/authorize-mandate', (req, res) => {
    try {
      const { iban, bic, accountHolder, customerEmail } = req.body;

      if (!iban || iban.replace(/\s+/g, '').length < 15) {
        return res.status(400).json({ error: 'Ungültige IBAN. Bitte korrekte IBAN eingeben.' });
      }

      const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
      const mandateRef = `BC-SEPA-${Date.now().toString().slice(-8)}`;

      return res.json({
        mandate_reference: mandateRef,
        creditor_id: 'DE98ZZZ09999999999',
        status: 'authorized',
        account_holder: accountHolder || 'Inhaber',
        masked_iban: `${cleanIban.slice(0, 4)} **** **** **** ${cleanIban.slice(-4)}`,
        mode: 'active',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'SEPA Mandat Erstellung fehlgeschlagen' });
    }
  });

  // Giropay / Wero Direct Bank Transfer
  app.post('/api/giropay/initiate', (req, res) => {
    try {
      const { bankName, customerEmail, amount } = req.body;
      const transactionId = `GIRO-DE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      return res.json({
        transaction_id: transactionId,
        bank: bankName || 'Sparkasse',
        status: 'authorized',
        mode: process.env.GIROPAY_MERCHANT_ID ? 'live' : 'dummy_sandbox',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Giropay Initiierung fehlgeschlagen' });
    }
  });

  // Vorkasse / SEPA Bank Transfer with EPC QR Code (GiroCode)
  app.post('/api/bank-transfer/create-reference', (req, res) => {
    try {
      const { amount, orderNumber, customerEmail } = req.body;
      const ref = orderNumber || `BC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const iban = 'DE27 1009 0000 1234 5678 90';
      const bic = 'BEVODEBBXXX';
      const bankName = 'Berliner Volksbank eG';
      const recipient = 'BlueCart Retail GmbH';

      // EPC QR-Code standard representation
      const epcQrString = `BCD\n002\n1\nSCT\n${bic}\n${recipient}\n${iban.replace(/\s+/g, '')}\nEUR${amount || '0.00'}\n\n${ref}\n`;

      return res.json({
        status: 'pending_transfer',
        orderNumber: ref,
        bankName,
        iban,
        bic,
        recipient,
        transferReference: ref,
        epcQrString,
        paymentDeadlineDays: 14,
        mode: 'active',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Vorkasse Erstellung fehlgeschlagen' });
    }
  });

  // Nachnahme (Cash on Delivery via DHL)
  app.post('/api/cash-on-delivery/initiate', (req, res) => {
    try {
      const { orderNumber, totalAmount, customerEmail } = req.body;
      const codTracking = `DHL-NN-DE-${Date.now().toString().slice(-8)}`;

      return res.json({
        status: 'authorized_cod',
        carrier: 'DHL Paket GmbH (Nachnahme Service)',
        trackingNumber: codTracking,
        codFeeEur: 2.50,
        amountToPayAtDoor: totalAmount,
        instructions: 'Der Betrag wird bei Paketübergabe an der Haustür in bar oder per EC-Karte / girocard bezahlt.',
        mode: 'active',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Nachnahme Initiierung fehlgeschlagen' });
    }
  });

  // Wero (European Payments Initiative / EPI)
  app.post('/api/wero/initiate', (req, res) => {
    try {
      const { amount, phone, customerEmail } = req.body;
      const weroTxId = `WERO-EPI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      return res.json({
        status: 'authorized',
        transaction_id: weroTxId,
        network: 'Wero (EPI European Instant Payment)',
        phone: phone || '+49 170 1234567',
        mode: 'dummy_sandbox',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Wero Initiierung fehlgeschlagen' });
    }
  });

  // Confirm / capture webhook or simulate instant success
  app.post('/api/confirm-payment', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const stripe = getStripe();

      if (stripe && paymentIntentId && !paymentIntentId.startsWith('pi_test_')) {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return res.json({ status: intent.status, paid: intent.status === 'succeeded' });
      }

      // Instant approval for demo/simulated payments
      return res.json({ status: 'succeeded', paid: true, isSimulated: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite development middleware or static production serving
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('Failed to initialize Vite development server:', viteErr);
    }
  } else {
    const candidateDirs = [
      typeof __dirname !== 'undefined' && path.basename(__dirname) === 'dist' ? __dirname : '',
      path.join(process.cwd(), 'dist'),
      typeof __dirname !== 'undefined' ? path.join(__dirname, 'dist') : '',
      typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'dist') : '',
    ].filter(Boolean);

    const distPath =
      candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) ||
      path.join(process.cwd(), 'dist');

    console.log(`[Production] Serving static build from: ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!doctype html><html lang="de"><head><meta charset="utf-8"/><title>BlueCart Store</title></head><body><div id="root">BlueCart Store Loading...</div></body></html>');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`BlueCart Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

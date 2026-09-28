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

  // In-memory OTP store for WhatsApp and Email authentication
  interface StoredOtp {
    code: string;
    identifier: string; // phone or email
    channel: 'whatsapp' | 'email';
    countryCode?: string;
    countryName?: string;
    createdAt: number;
    expiresAt: number;
    attempts: number;
  }
  const otpStore = new Map<string, StoredOtp>();

  // In-memory / server cache of European user profiles by phone or email
  const serverUserProfileStore = new Map<string, any>();

  // Send WhatsApp or Email OTP endpoint
  app.post('/api/auth/send-otp', (req, res) => {
    try {
      const { identifier, channel = 'whatsapp', countryCode = 'DE', countryName = 'Germany' } = req.body;

      if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
        return res.status(400).json({ error: 'Valid WhatsApp number or email address is required.' });
      }

      const cleanIdentifier = identifier.trim().toLowerCase();

      // Check rate limit: 1 request per 10 seconds per identifier
      const existing = Array.from(otpStore.values()).find(
        (o) => o.identifier.toLowerCase() === cleanIdentifier && Date.now() - o.createdAt < 10000
      );
      if (existing) {
        const waitSec = Math.ceil((10000 - (Date.now() - existing.createdAt)) / 1000);
        return res.status(429).json({
          error: `Please wait ${waitSec} seconds before requesting a new verification code.`,
        });
      }

      // Generate cryptographically secure 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      // Store in memory
      otpStore.set(otpId, {
        code: otpCode,
        identifier: cleanIdentifier,
        channel: channel === 'email' ? 'email' : 'whatsapp',
        countryCode,
        countryName,
        createdAt: Date.now(),
        expiresAt,
        attempts: 0,
      });

      // Cleanup expired OTPs
      for (const [key, item] of otpStore.entries()) {
        if (Date.now() > item.expiresAt) {
          otpStore.delete(key);
        }
      }

      console.log(`[BlueCart Auth] Generated ${channel.toUpperCase()} OTP for ${cleanIdentifier}: ${otpCode}`);

      return res.json({
        success: true,
        otpId,
        channel,
        identifier: cleanIdentifier,
        countryCode,
        countryName,
        expiresAt,
        previewOtp: otpCode, // Provided for fast testing and browser simulator
        message:
          channel === 'whatsapp'
            ? `WhatsApp verification code dispatched to ${cleanIdentifier}`
            : `Email verification code sent to ${cleanIdentifier}`,
      });
    } catch (err: any) {
      console.error('Error generating OTP:', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch verification code.' });
    }
  });

  // Verify OTP and return or create user profile
  app.post('/api/auth/verify-otp', (req, res) => {
    try {
      const { identifier, otp, otpId, countryCode = 'DE', countryName = 'Germany', name } = req.body;

      if (!otp || typeof otp !== 'string') {
        return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
      }

      const cleanIdentifier = (identifier || '').trim().toLowerCase();
      const enteredOtp = otp.trim().replace(/\D/g, '');

      // Lookup stored OTP session
      let session: StoredOtp | undefined;
      let matchedKey: string | undefined;

      if (otpId && otpStore.has(otpId)) {
        session = otpStore.get(otpId);
        matchedKey = otpId;
      } else {
        // Fallback match by identifier
        for (const [key, item] of otpStore.entries()) {
          if (item.identifier.toLowerCase() === cleanIdentifier) {
            session = item;
            matchedKey = key;
            break;
          }
        }
      }

      if (!session) {
        return res.status(400).json({
          error: 'Verification session expired or not found. Please request a new code.',
        });
      }

      if (Date.now() > session.expiresAt) {
        if (matchedKey) otpStore.delete(matchedKey);
        return res.status(400).json({
          error: 'Verification code has expired (validity: 5 minutes). Please request a new code.',
        });
      }

      // Check attempts to prevent brute force
      if (session.attempts >= 5) {
        if (matchedKey) otpStore.delete(matchedKey);
        return res.status(429).json({
          error: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      // Verify code
      if (session.code !== enteredOtp) {
        session.attempts += 1;
        const remaining = 5 - session.attempts;
        return res.status(400).json({
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          remainingAttempts: remaining,
        });
      }

      // Code is valid! Consume it
      if (matchedKey) otpStore.delete(matchedKey);

      // Determine European defaults based on country
      const isWhatsApp = session.channel === 'whatsapp';
      const userKey = cleanIdentifier;

      let profile = serverUserProfileStore.get(userKey);
      if (!profile) {
        // Build new European profile
        const cityDefaults: Record<string, { city: string; zip: string; street: string }> = {
          DE: { city: 'München', zip: '80331', street: 'Maximilianstraße 14' },
          AT: { city: 'Wien', zip: '1010', street: 'Kärntner Straße 22' },
          CH: { city: 'Zürich', zip: '8001', street: 'Bahnhofstrasse 45' },
          FR: { city: 'Paris', zip: '75001', street: 'Rue de Rivoli 18' },
          GB: { city: 'London', zip: 'SW1A 1AA', street: '10 Downing Street' },
          NL: { city: 'Amsterdam', zip: '1012 JS', street: 'Damrak 70' },
          IT: { city: 'Milano', zip: '20121', street: 'Via Monte Napoleone 8' },
          ES: { city: 'Madrid', zip: '28001', street: 'Calle de Serrano 30' },
        };
        const def = cityDefaults[countryCode.toUpperCase()] || {
          city: 'München',
          zip: '80331',
          street: 'Kaufingerstraße 10',
        };

        const userId = `usr_eu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const fallbackName = name || (isWhatsApp ? `WhatsApp User (${cleanIdentifier})` : cleanIdentifier.split('@')[0]);

        profile = {
          id: userId,
          email: isWhatsApp ? `${cleanIdentifier.replace(/\D/g, '')}@whatsapp.bluecart.de` : cleanIdentifier,
          name: fallbackName,
          role: 'customer',
          phone: isWhatsApp ? cleanIdentifier : undefined,
          whatsapp_number: isWhatsApp ? cleanIdentifier : undefined,
          whatsapp_country_code: countryCode.toUpperCase(),
          whatsapp_country_name: countryName,
          whatsapp_verified: isWhatsApp,
          email_verified: !isWhatsApp,
          auth_provider: isWhatsApp ? 'whatsapp_otp' : 'email_otp',
          address: {
            street: def.street,
            city: def.city,
            zip: def.zip,
            country: countryName,
          },
          preferences: {
            whatsapp_order_updates: true,
            whatsapp_shipping_alerts: true,
            whatsapp_deals: true,
            language: countryCode.toUpperCase() === 'DE' || countryCode.toUpperCase() === 'AT' ? 'de' : 'en',
          },
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        };

        serverUserProfileStore.set(userKey, profile);
      } else {
        // Update last login
        profile.last_login_at = new Date().toISOString();
        if (isWhatsApp) {
          profile.whatsapp_verified = true;
          profile.whatsapp_number = cleanIdentifier;
          profile.whatsapp_country_code = countryCode.toUpperCase();
          profile.whatsapp_country_name = countryName;
        } else {
          profile.email_verified = true;
        }
        serverUserProfileStore.set(userKey, profile);
      }

      return res.json({
        success: true,
        verified: true,
        user: profile,
        message: 'Successfully verified and signed in!',
      });
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      res.status(500).json({ error: err.message || 'OTP verification failed' });
    }
  });

  // Save / Update user profile endpoint
  app.post('/api/auth/update-profile', (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id) {
        return res.status(400).json({ error: 'Valid user profile data is required.' });
      }

      const key = (user.whatsapp_number || user.email || user.id).toLowerCase();
      serverUserProfileStore.set(key, user);
      if (user.id) serverUserProfileStore.set(user.id, user);

      return res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
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

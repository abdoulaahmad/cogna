process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing entries (in order to avoid duplicate constraints)
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cogna.store';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  
  await prisma.user.create({
    data: {
      fullName: 'Abdullahi A. Ahmad',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin user created: ${adminEmail} (Password: ${adminPassword})`);

  // 2. Create Developer User
  const devPasswordHash = await bcrypt.hash('password123', 12);
  await prisma.user.create({
    data: {
      fullName: 'Jane Doe',
      email: 'developer@cogna.store',
      passwordHash: devPasswordHash,
      role: 'DEVELOPER',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Developer user created: developer@cogna.store (Password: password123)');

  // 3. Create Reseller Provider
  const provider = await prisma.provider.create({
    data: {
      name: 'Akunding Reseller API',
      baseUrl: 'https://akunding.shop/api/v1',
      apiKey: 'sk_live_dummy_akunding_api_key_xxxxxxxxxxxxxxxx',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Provider created: Akunding Reseller API');

  // 4. Create Categories
  const categoryNLP = await prisma.category.create({
    data: {
      name: 'Text & NLPs',
      slug: 'natural-language',
      description: 'Chat & translation APIs',
    },
  });

  const categoryCV = await prisma.category.create({
    data: {
      name: 'Computer Vision',
      slug: 'computer-vision',
      description: 'Image generation & analysis',
    },
  });

  const categoryVoice = await prisma.category.create({
    data: {
      name: 'Voice & Audio',
      slug: 'voice-audio',
      description: 'TTS & speech tools',
    },
  });
  console.log('✅ Categories created');

  // 5. Create Products (Subscriptions)
  // ChatGPT Plus
  await prisma.product.create({
    data: {
      name: 'ChatGPT Plus',
      slug: 'chatgpt-plus',
      description: 'Access GPT-4o, DALL·E 3, and advanced reasoning tools.',
      price: 20.00,
      currency: 'USD',
      deliveryTime: 'Instant',
      active: true,
      paymentGateway: 'PAYSTACK',
      providerId: provider.id,
      providerProductId: 'sub-gpt',
      categoryId: categoryNLP.id,
    },
  });

  // Google Gemini
  await prisma.product.create({
    data: {
      name: 'Google Gemini',
      slug: 'google-gemini',
      description: 'Advanced AI from Google with 1.5 Pro and latest features.',
      price: 19.99,
      currency: 'USD',
      deliveryTime: 'Instant',
      active: true,
      paymentGateway: 'MONNIFY',
      providerId: provider.id,
      providerProductId: 'sub-gemini',
      categoryId: categoryCV.id,
    },
  });

  // Claude Pro
  await prisma.product.create({
    data: {
      name: 'Claude Pro',
      slug: 'claude-pro',
      description: "Anthropic's Claude 3 Opus for complex tasks and coding.",
      price: 20.00,
      currency: 'USD',
      deliveryTime: 'Instant',
      active: true,
      paymentGateway: 'PAYSTACK',
      providerId: provider.id,
      providerProductId: 'sub-claude',
      categoryId: categoryNLP.id,
    },
  });

  // CapCut Pro
  await prisma.product.create({
    data: {
      name: 'CapCut Pro',
      slug: 'capcut-pro',
      description: 'AI-powered video editing made for creators and professionals.',
      price: 9.99,
      currency: 'USD',
      deliveryTime: 'Instant',
      active: true,
      paymentGateway: 'MONNIFY',
      providerId: provider.id,
      providerProductId: 'sub-capcut',
      categoryId: categoryVoice.id,
    },
  });

  console.log('✅ Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

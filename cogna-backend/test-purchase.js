"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_service_1 = require("./src/services/wallet.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() { try {
    const user = await prisma.user.findFirst();
    const product = await prisma.product.findFirst();
    if (!user || !product) {
        console.log('No user or product found');
        return;
    }
    await prisma.wallet.upsert({ where: { userId: user.id }, update: { availableBalance: 1000000 }, create: { userId: user.id, availableBalance: 1000000 } });
    console.log('Testing purchase...');
    const result = await wallet_service_1.WalletService.purchase({ userId: user.id, productId: product.id, customerEmail: user.email, idempotencyKey: 'test_idempotency_key_' + Date.now() });
    console.log('Purchase successful!', result);
}
catch (err) {
    console.error('Purchase failed with error:', err);
}
finally {
    await prisma.;
    $disconnect;
    ();
} }
test();

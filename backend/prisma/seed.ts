import { PrismaClient } from '@prisma/client';
import { analyzePaymentRecovery } from '../src/services/recoveryEngine.js';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Clearing existing records...');
  await prisma.activityLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.recoveryAttempt.deleteMany();
  await prisma.recoveryOpportunity.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();

  console.log('[Seed] Creating merchant...');
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Razorpay Demo Merchant (TechFlow India)',
      email: 'merchant@techflow.in',
    },
  });

  console.log('[Seed] Creating 60 customers...');
  const customerDefinitions = [
    // --- 15 HIGH_VALUE Customers ---
    { name: 'Aarav Sharma', email: 'aarav.sharma@nexuscorp.in', phone: '+91 98201 11223', segment: 'HIGH_VALUE', ltv: 340000, success: 18, fail: 2 },
    { name: 'Pooja Malhotra', email: 'pooja.m@cloudscale.io', phone: '+91 98112 22334', segment: 'HIGH_VALUE', ltv: 215000, success: 12, fail: 1 },
    { name: 'Vikramaditya Singhania', email: 'v.singhania@apexcapital.com', phone: '+91 99303 33445', segment: 'HIGH_VALUE', ltv: 480000, success: 24, fail: 3 },
    { name: 'Ananya Iyer', email: 'ananya.iyer@pixelcraft.design', phone: '+91 97404 44556', segment: 'HIGH_VALUE', ltv: 165000, success: 9, fail: 1 },
    { name: 'Siddharth Mehta', email: 'smehta@quanticom.com', phone: '+91 98215 55667', segment: 'HIGH_VALUE', ltv: 290000, success: 15, fail: 2 },
    { name: 'Neha Deshmukh', email: 'neha.d@fintechforward.in', phone: '+91 98926 66778', segment: 'HIGH_VALUE', ltv: 195000, success: 11, fail: 1 },
    { name: 'Rajesh Subramanian', email: 'r.subbu@chennaitechs.com', phone: '+91 94447 77889', segment: 'HIGH_VALUE', ltv: 310000, success: 16, fail: 2 },
    { name: 'Meera Nambiar', email: 'meera@nambiarmedia.com', phone: '+91 98458 88990', segment: 'HIGH_VALUE', ltv: 140000, success: 8, fail: 1 },
    { name: 'Aditya Birla-Kapur', email: 'aditya.k@kapurholding.in', phone: '+91 98209 99001', segment: 'HIGH_VALUE', ltv: 520000, success: 28, fail: 2 },
    { name: 'Ritu Ganguly', email: 'ritu.g@kolkatasoft.org', phone: '+91 98301 23456', segment: 'HIGH_VALUE', ltv: 175000, success: 10, fail: 2 },
    { name: 'Kunal Kapoor', email: 'kunal@hyperlogistics.in', phone: '+91 98102 34567', segment: 'HIGH_VALUE', ltv: 230000, success: 13, fail: 2 },
    { name: 'Divya Agarwal', email: 'divya@agarwaljewels.com', phone: '+91 99203 45678', segment: 'HIGH_VALUE', ltv: 410000, success: 21, fail: 3 },
    { name: 'Pranav Reddy', email: 'pranav.r@hyderabadhealth.in', phone: '+91 98494 56789', segment: 'HIGH_VALUE', ltv: 280000, success: 14, fail: 1 },
    { name: 'Sneha Chawla', email: 'sneha@chawlaexport.com', phone: '+91 98115 67890', segment: 'HIGH_VALUE', ltv: 365000, success: 19, fail: 2 },
    { name: 'Gautam Singhal', email: 'gautam@singhalinfra.in', phone: '+91 98226 78901', segment: 'HIGH_VALUE', ltv: 185000, success: 10, fail: 1 },

    // --- 30 REGULAR Customers ---
    { name: 'Rohan Verma', email: 'rohan.v@techie.dev', phone: '+91 98717 89012', segment: 'REGULAR', ltv: 48000, success: 5, fail: 2 },
    { name: 'Kavita Nair', email: 'kavita.nair@greenleaf.in', phone: '+91 98459 90123', segment: 'REGULAR', ltv: 36000, success: 4, fail: 1 },
    { name: 'Devendra Joshi', email: 'dev.joshi@punesolutions.com', phone: '+91 98901 01234', segment: 'REGULAR', ltv: 62000, success: 6, fail: 2 },
    { name: 'Tanvi Shah', email: 'tanvi.shah@mumbaimarketing.in', phone: '+91 98202 12345', segment: 'REGULAR', ltv: 27000, success: 3, fail: 1 },
    { name: 'Akash Gupta', email: 'akash.gupta@delhicart.com', phone: '+91 98113 23456', segment: 'REGULAR', ltv: 41000, success: 4, fail: 1 },
    { name: 'Ishita Roy', email: 'ishita.roy@bengalarts.org', phone: '+91 98314 34567', segment: 'REGULAR', ltv: 19000, success: 2, fail: 1 },
    { name: 'Manish Pandey', email: 'manish.p@lucknowtech.in', phone: '+91 94155 45678', segment: 'REGULAR', ltv: 33000, success: 3, fail: 1 },
    { name: 'Swati Kulkarni', email: 'swati.k@nagpurbiz.com', phone: '+91 98236 56789', segment: 'REGULAR', ltv: 54000, success: 5, fail: 2 },
    { name: 'Naveen Kumar', email: 'naveen.k@blrmobility.co', phone: '+91 99457 67890', segment: 'REGULAR', ltv: 22000, success: 2, fail: 1 },
    { name: 'Preeti Bhatia', email: 'preeti.b@chandigarhwear.in', phone: '+91 98148 78901', segment: 'REGULAR', ltv: 45000, success: 4, fail: 1 },
    { name: 'Sameer Sen', email: 'sameer.sen@sensystems.in', phone: '+91 98309 89012', segment: 'REGULAR', ltv: 38000, success: 4, fail: 2 },
    { name: 'Deepa Hegde', email: 'deepa.hegde@mangalorefresh.com', phone: '+91 94811 90123', segment: 'REGULAR', ltv: 29000, success: 3, fail: 1 },
    { name: 'Karthik Raja', email: 'karthik.raja@coimbatoredrives.in', phone: '+91 94422 01234', segment: 'REGULAR', ltv: 68000, success: 7, fail: 2 },
    { name: 'Pallavi Rao', email: 'pallavi.rao@vizaglogix.com', phone: '+91 98483 12345', segment: 'REGULAR', ltv: 18000, success: 2, fail: 1 },
    { name: 'Arjun Das', email: 'arjun.das@assamcrafts.in', phone: '+91 94354 23456', segment: 'REGULAR', ltv: 25000, success: 3, fail: 1 },
    { name: 'Radhika Pillai', email: 'radhika.p@keralaretreat.com', phone: '+91 94475 34567', segment: 'REGULAR', ltv: 49000, success: 5, fail: 1 },
    { name: 'Harish Bajaj', email: 'harish.bajaj@indoreauto.in', phone: '+91 98266 45678', segment: 'REGULAR', ltv: 57000, success: 6, fail: 2 },
    { name: 'Shalini Saxena', email: 'shalini@bhopalcreative.org', phone: '+91 98277 56789', segment: 'REGULAR', ltv: 31000, success: 3, fail: 1 },
    { name: 'Gaurav Gill', email: 'gaurav.gill@punjabgrain.in', phone: '+91 98158 67890', segment: 'REGULAR', ltv: 43000, success: 4, fail: 1 },
    { name: 'Bhavna Dave', email: 'bhavna.d@ahmedabadtex.com', phone: '+91 98259 78901', segment: 'REGULAR', ltv: 65000, success: 6, fail: 2 },
    { name: 'Yashwardhan Roy', email: 'yash.roy@patnatech.co', phone: '+91 94311 89012', segment: 'REGULAR', ltv: 16000, success: 2, fail: 1 },
    { name: 'Ankita Ghosh', email: 'ankita.ghosh@siliguriagro.in', phone: '+91 98322 90123', segment: 'REGULAR', ltv: 28000, success: 3, fail: 1 },
    { name: 'Vishal Tiwari', email: 'vishal.tiwari@varanasipure.com', phone: '+91 94503 01234', segment: 'REGULAR', ltv: 35000, success: 3, fail: 1 },
    { name: 'Shruti Mathur', email: 'shruti.mathur@jaipurgems.in', phone: '+91 98294 12345', segment: 'REGULAR', ltv: 51000, success: 5, fail: 1 },
    { name: 'Omkar Shinde', email: 'omkar.shinde@nasikwine.co', phone: '+91 98225 23456', segment: 'REGULAR', ltv: 24000, success: 2, fail: 1 },
    { name: 'Latika Borkar', email: 'latika.b@goahospitality.in', phone: '+91 98236 34567', segment: 'REGULAR', ltv: 47000, success: 4, fail: 2 },
    { name: 'Rupesh Sahoo', email: 'rupesh.sahoo@bhubaneswarent.com', phone: '+91 94377 45678', segment: 'REGULAR', ltv: 39000, success: 4, fail: 1 },
    { name: 'Suman Dutta', email: 'suman.dutta@durgapursteel.in', phone: '+91 94348 56789', segment: 'REGULAR', ltv: 26000, success: 2, fail: 1 },
    { name: 'Chirag Parekh', email: 'chirag.p@suratdiamonds.biz', phone: '+91 98249 67890', segment: 'REGULAR', ltv: 71000, success: 7, fail: 2 },
    { name: 'Monika Sehgal', email: 'monika.sehgal@jammuherbs.in', phone: '+91 94191 78901', segment: 'REGULAR', ltv: 32000, success: 3, fail: 1 },

    // --- 15 NEW Customers ---
    { name: 'Tushar Jadhav', email: 'tushar.j@outlook.com', phone: '+91 98221 89012', segment: 'NEW', ltv: 3500, success: 1, fail: 1 },
    { name: 'Nidhi Singhal', email: 'nidhi.singhal@gmail.com', phone: '+91 98112 90123', segment: 'NEW', ltv: 1200, success: 0, fail: 1 },
    { name: 'Varun Sethi', email: 'varun.sethi@yahoo.com', phone: '+91 98723 01234', segment: 'NEW', ltv: 5400, success: 1, fail: 1 },
    { name: 'Kritika Menon', email: 'kritika.m@rediffmail.com', phone: '+91 98464 12345', segment: 'NEW', ltv: 0, success: 0, fail: 1 },
    { name: 'Abhishek Bagchi', email: 'abhi.bagchi@hotmail.com', phone: '+91 98315 23456', segment: 'NEW', ltv: 4200, success: 1, fail: 1 },
    { name: 'Sanyukta Rane', email: 'sanyukta.r@gmail.com', phone: '+91 98206 34567', segment: 'NEW', ltv: 850, success: 0, fail: 1 },
    { name: 'Karan Virani', email: 'karan.v@icloud.com', phone: '+91 98257 45678', segment: 'NEW', ltv: 7600, success: 1, fail: 1 },
    { name: 'Nandita Basu', email: 'nandita.basu@gmail.com', phone: '+91 98308 56789', segment: 'NEW', ltv: 2100, success: 0, fail: 1 },
    { name: 'Jatin Bajaj', email: 'jatin.b@live.com', phone: '+91 98109 67890', segment: 'NEW', ltv: 6800, success: 1, fail: 1 },
    { name: 'Esha Mukherjee', email: 'esha.m@gmail.com', phone: '+91 98310 78901', segment: 'NEW', ltv: 1500, success: 0, fail: 1 },
    { name: 'Nikhil Chauhan', email: 'nikhil.c@gmail.com', phone: '+91 98181 89012', segment: 'NEW', ltv: 4900, success: 1, fail: 1 },
    { name: 'Siddhi Samant', email: 'siddhi.s@yahoo.com', phone: '+91 98212 90123', segment: 'NEW', ltv: 0, success: 0, fail: 1 },
    { name: 'Tarun Madan', email: 'tarun.m@gmail.com', phone: '+91 98113 01234', segment: 'NEW', ltv: 3100, success: 0, fail: 1 },
    { name: 'Rhea Kurien', email: 'rhea.kurien@gmail.com', phone: '+91 98454 12345', segment: 'NEW', ltv: 6200, success: 1, fail: 1 },
    { name: 'Mohit Agarwal', email: 'mohit.ag@outlook.com', phone: '+91 98295 23456', segment: 'NEW', ltv: 950, success: 0, fail: 1 },
  ];

  const createdCustomers: any[] = [];
  for (const c of customerDefinitions) {
    const cust = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        customerSegment: c.segment,
        lifetimeValue: c.ltv,
        successfulPayments: c.success,
        failedPayments: c.fail,
      },
    });
    createdCustomers.push(cust);
  }
  console.log(`[Seed] Created ${createdCustomers.length} customers.`);

  // --- 130 Payments with Realistic Failure Scenarios ---
  console.log('[Seed] Creating 130 payments...');

  // Prominent showcase payments:
  const showcasePayments = [
    {
      customerIndex: 0, // Aarav Sharma (HIGH_VALUE)
      orderId: 'order_rec_enterprise_99',
      amount: 149999,
      status: 'FAILED',
      paymentMethod: 'UPI',
      failureCode: 'PSP_TIMEOUT',
      failureReason: 'UPI_TIMEOUT',
      retryCount: 0,
      hoursAgo: 0.5,
    },
    {
      customerIndex: 1, // Pooja Malhotra (HIGH_VALUE)
      orderId: 'order_rec_cloud_84',
      amount: 84500,
      status: 'FAILED',
      paymentMethod: 'CARD',
      failureCode: 'GATEWAY_DISCONNECTED',
      failureReason: 'NETWORK_ERROR',
      retryCount: 0,
      hoursAgo: 1.2,
    },
    {
      customerIndex: 2, // Vikramaditya Singhania (HIGH_VALUE)
      orderId: 'order_rec_hw_62',
      amount: 62000,
      status: 'FAILED',
      paymentMethod: 'CARD',
      failureCode: 'ISSUER_DECLINE_05',
      failureReason: 'BANK_DECLINED',
      retryCount: 1,
      hoursAgo: 2.5,
    },
    {
      customerIndex: 3, // Ananya Iyer (HIGH_VALUE)
      orderId: 'order_rec_design_38',
      amount: 38900,
      status: 'FAILED',
      paymentMethod: 'CARD',
      failureCode: 'EXPIRED_CARD_54',
      failureReason: 'CARD_EXPIRED',
      retryCount: 0,
      hoursAgo: 4.0,
    },
    {
      customerIndex: 15, // Rohan Verma (REGULAR)
      orderId: 'order_rec_dev_45',
      amount: 45000,
      status: 'FAILED',
      paymentMethod: 'UPI',
      failureCode: 'INSUFFICIENT_FUNDS_51',
      failureReason: 'INSUFFICIENT_FUNDS',
      retryCount: 0,
      hoursAgo: 1.8,
    },
    {
      customerIndex: 16, // Kavita Nair (REGULAR)
      orderId: 'order_rec_corp_24',
      amount: 24999,
      status: 'PENDING',
      paymentMethod: 'UPI',
      failureCode: 'CUSTOMER_SESSION_TIMEOUT',
      failureReason: 'PAYMENT_SESSION_EXPIRED',
      retryCount: 0,
      hoursAgo: 0.8,
    },
    {
      customerIndex: 17, // Devendra Joshi (REGULAR)
      orderId: 'order_rec_conf_18',
      amount: 18500,
      status: 'FAILED',
      paymentMethod: 'UPI',
      failureCode: 'TXN_LIMIT_EXCEEDED_61',
      failureReason: 'LIMIT_EXCEEDED',
      retryCount: 1,
      hoursAgo: 3.2,
    },
    {
      customerIndex: 4, // Siddharth Mehta (HIGH_VALUE)
      orderId: 'order_rec_server_92',
      amount: 92000,
      status: 'FAILED',
      paymentMethod: 'NETBANKING',
      failureCode: 'BANK_TIMEOUT_U19',
      failureReason: 'NETWORK_ERROR',
      retryCount: 0,
      hoursAgo: 0.4,
    },
    {
      customerIndex: 18, // Tanvi Shah (REGULAR)
      orderId: 'order_rec_agency_29',
      amount: 29500,
      status: 'FAILED',
      paymentMethod: 'CARD',
      failureCode: 'INVALID_AUTH_CVV',
      failureReason: 'INCORRECT_DETAILS',
      retryCount: 0,
      hoursAgo: 2.0,
    },
    {
      customerIndex: 11, // Divya Agarwal (HIGH_VALUE)
      orderId: 'order_rec_gem_110',
      amount: 110000,
      status: 'FAILED',
      paymentMethod: 'UPI',
      failureCode: 'UPI_NPCI_UNAVAILABLE',
      failureReason: 'UPI_TIMEOUT',
      retryCount: 0,
      hoursAgo: 0.9,
    },
  ];

  // Helper arrays for generated payments
  const failureReasons = [
    'UPI_TIMEOUT',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR',
    'CARD_EXPIRED',
    'INCORRECT_DETAILS',
    'BANK_DECLINED',
    'LIMIT_EXCEEDED',
    'PAYMENT_SESSION_EXPIRED',
    'UNKNOWN',
  ];
  const paymentMethods = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'EMI'];

  const createdPayments: any[] = [];

  // Seed showcase payments
  for (const sp of showcasePayments) {
    const cust = createdCustomers[sp.customerIndex];
    const createdAt = new Date(Date.now() - sp.hoursAgo * 60 * 60 * 1000);
    const payment = await prisma.payment.create({
      data: {
        orderId: sp.orderId,
        customerId: cust.id,
        merchantId: merchant.id,
        amount: sp.amount,
        currency: 'INR',
        status: sp.status,
        paymentMethod: sp.paymentMethod,
        failureCode: sp.failureCode,
        failureReason: sp.failureReason,
        retryCount: sp.retryCount,
        lastRetryAt: sp.retryCount > 0 ? new Date(createdAt.getTime() + 10 * 60 * 1000) : null,
        recoveredAmount: 0,
        createdAt,
        updatedAt: createdAt,
      },
    });
    createdPayments.push({ payment, customer: cust });
  }

  // Seed remaining payments to reach 130 total
  const remainingCount = 130 - showcasePayments.length;
  for (let i = 1; i <= remainingCount; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const hoursAgo = (i * 1.8) % (24 * 7); // Distributed across last 7 days
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Distribution: 35% SUCCESS, 50% FAILED, 12% PENDING, 3% REFUNDED
    let status = 'FAILED';
    if (i % 10 === 0 || i % 10 === 1 || i % 10 === 2) {
      status = 'SUCCESS';
    } else if (i % 10 === 7) {
      status = 'PENDING';
    } else if (i === 50) {
      status = 'REFUNDED';
    }

    const method = paymentMethods[i % paymentMethods.length];
    const failureReason = status === 'FAILED' || status === 'PENDING'
      ? failureReasons[i % failureReasons.length]
      : null;

    // Amounts based on customer segment
    let baseAmount = 1500;
    if (cust.customerSegment === 'HIGH_VALUE') {
      baseAmount = 25000 + (i * 3700) % 75000;
    } else if (cust.customerSegment === 'REGULAR') {
      baseAmount = 4000 + (i * 1200) % 22000;
    } else {
      baseAmount = 799 + (i * 450) % 4500;
    }

    const retryCount = status === 'FAILED' && i % 4 === 0 ? 1 : (status === 'FAILED' && i % 12 === 0 ? 2 : 0);

    const payment = await prisma.payment.create({
      data: {
        orderId: `order_rzp_${1000 + i}`,
        customerId: cust.id,
        merchantId: merchant.id,
        amount: Math.round(baseAmount),
        currency: 'INR',
        status,
        paymentMethod: method,
        failureCode: failureReason ? `ERR_${failureReason}_${i}` : null,
        failureReason,
        retryCount,
        lastRetryAt: retryCount > 0 ? new Date(createdAt.getTime() + 15 * 60 * 1000) : null,
        recoveredAmount: status === 'SUCCESS' ? baseAmount : 0,
        createdAt,
        updatedAt: createdAt,
      },
    });
    createdPayments.push({ payment, customer: cust });
  }

  console.log(`[Seed] Created ${createdPayments.length} payments.`);

  // --- Seed RecoveryOpportunities for Failed & Pending Payments ---
  console.log('[Seed] Generating RecoveryOpportunities for failed and pending payments...');
  let oppCount = 0;
  for (const { payment, customer } of createdPayments) {
    if (payment.status === 'FAILED' || payment.status === 'PENDING') {
      const analysis = analyzePaymentRecovery({
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          failureReason: payment.failureReason,
          retryCount: payment.retryCount,
          createdAt: payment.createdAt,
        },
        customer: {
          id: customer.id,
          name: customer.name,
          lifetimeValue: customer.lifetimeValue,
          successfulPayments: customer.successfulPayments,
          failedPayments: customer.failedPayments,
          customerSegment: customer.customerSegment,
        },
      });

      await prisma.recoveryOpportunity.create({
        data: {
          paymentId: payment.id,
          recoveryProbability: analysis.recoveryProbability,
          priorityScore: analysis.priorityScore,
          recommendedAction: analysis.recommendedAction,
          recommendedChannel: analysis.recommendedChannel,
          recommendedDelayMinutes: analysis.recommendedDelayMinutes,
          reason: analysis.reason,
          status: 'OPEN',
        },
      });
      oppCount++;

      // Create an activity log for high priority items
      if (analysis.priorityScore >= 70) {
        await prisma.activityLog.create({
          data: {
            action: 'OPPORTUNITY_IDENTIFIED',
            entityType: 'RecoveryOpportunity',
            entityId: payment.id,
            description: `High-priority recovery identified for ₹${payment.amount.toLocaleString()} (${analysis.priorityScore}/100 pts) via ${analysis.recommendedChannel}`,
            createdAt: new Date(payment.createdAt),
          },
        });
      }
    }
  }

  console.log(`[Seed] Created ${oppCount} RecoveryOpportunities.`);

  // Create initial activity logs
  await prisma.activityLog.create({
    data: {
      action: 'SYSTEM_INITIALIZED',
      entityType: 'System',
      entityId: merchant.id,
      description: 'RecoverAI core data engine and deterministic scoring service initialized.',
    },
  });

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

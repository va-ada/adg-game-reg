// Run: node scripts/persistence.test.mjs  (fake database; touches nothing real)
import assert from 'assert/strict';
import mongoose from 'mongoose';
import { hydrate, flush, markDirty } from '../backend/src/store/persistence.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓', m); };

// ---- fake Atlas ----
const dbData = {}; let writes = []; let failNext = false;
const coll = name => ({
  find: () => ({ toArray: async () => structuredClone(dbData[name] || []) }),
  findOne: async q => (dbData[name] || []).find(d => d._id === q._id) || null,
  replaceOne: async (f, doc) => { dbData[name] = (dbData[name] || []).filter(d => d._id !== f._id).concat(structuredClone(doc)); },
  bulkWrite: async ops => {
    if (failNext) { failNext = false; throw new Error('network blip'); }
    for (const o of ops) {
      const doc = o.replaceOne.replacement;
      writes.push({ name, id: doc._id, bytes: JSON.stringify(doc).length });
      dbData[name] = (dbData[name] || []).filter(d => d._id !== doc._id).concat(structuredClone(doc));
    }
  }
});
Object.defineProperty(mongoose.connection, 'readyState', { get: () => 1, configurable: true });
Object.defineProperty(mongoose.connection, 'db', { get: () => ({ collection: coll }), configurable: true });

// Realistic shape: some students carry a ~860 KB inline ID card, like the live data did.
const bigImage = 'data:image/jpeg;base64,' + 'A'.repeat(860 * 1024);
dbData.students = Array.from({ length: 30 }, (_, i) => ({ _id: `stu_${i}`, fullName: `S${i}`, idCardUrl: i < 10 ? bigImage : 'https://drive.google.com/x' }));
dbData.payments = [{ _id: 'pay_1', registrationId: 'R1', status: 'PENDING', entries: [{ _id: 'e1', status: 'SUBMITTED', amount: 250, transactionReference: '123456789012' }] }];
dbData.payments.push({ _id: 'pay_legacy', registrationId: 'R0', status: 'PAID', amount: 5, transactionReference: '606060606060' }); // pre-ledger record
dbData.registrations = [{ _id: 'reg_1', registrationId: 'R1', status: 'PAYMENT_VERIFICATION' }];

const store = { registrationCounter: 100, syncRegistrationCounter() {}, games: [], admins: [] };
for (const k of ['teams','teamMembers','documents','tickets','invoices','auditLogs']) store[k] = [];
await hydrate(store);
ok(store.students.length === 30 && store.payments.length === 2, 'hydrate loads the data');

writes = []; await flush(store, { force: true });
ok(writes.every(w => w.id === 'pay_legacy') && writes.length === 1, 'first flush writes only the migrated legacy payment, not the 30 students');
const fullBytes = JSON.stringify([...store.students, ...store.payments, ...store.registrations]).length;

writes = []; await flush(store, { force: true });
ok(writes.length === 0, 'nothing changed -> nothing sent');

// Approving a payment: a nested field changes on one doc.
store.payments[0].entries[0].status = 'VERIFIED'; store.payments[0].status = 'PAID';
store.registrations[0].status = 'CONFIRMED';
writes = []; markDirty(); await flush(store);
ok(writes.length === 2 && writes.some(w => w.id === 'pay_1') && writes.some(w => w.id === 'reg_1'), 'approval writes exactly the payment + registration');
ok(dbData.payments.find(d => d._id === 'pay_1').entries[0].status === 'VERIFIED', 'nested change reached the database');
const approvalBytes = writes.reduce((a, w) => a + w.bytes, 0);
console.log(`    bytes per save: before ~${(fullBytes/1048576).toFixed(1)} MB (whole set), now ${approvalBytes} B`);
ok(approvalBytes < 2000, 'a save is now bytes, not megabytes');

// New registration: new docs are written, including one big ID card.
store.students.push({ _id: 'stu_new', fullName: 'New', idCardUrl: bigImage });
store.registrations.push({ _id: 'reg_2', registrationId: 'R2', status: 'PAYMENT_PENDING' });
writes = []; markDirty(); await flush(store);
ok(writes.length === 2 && writes.some(w => w.id === 'stu_new') && writes.some(w => w.id === 'reg_2'), 'new docs written once');
writes = []; markDirty(); await flush(store);
ok(writes.length === 0, '...and not again');

// A failed write must be retried, not forgotten.
store.registrations[1].status = 'PAYMENT_VERIFICATION';
failNext = true; markDirty();
const res1 = await flush(store);
ok(res1 === false && dbData.registrations.find(d => d._id === 'reg_2').status === 'PAYMENT_PENDING', 'failed write reports failure, DB unchanged');
writes = []; await flush(store);
ok(writes.some(w => w.id === 'reg_2') && dbData.registrations.find(d => d._id === 'reg_2').status === 'PAYMENT_VERIFICATION', 'next flush retries and lands it');

// Restart: a fresh hydrate from the DB has everything.
const store2 = { registrationCounter: 0, syncRegistrationCounter() {} };
await hydrate(store2);
ok(store2.students.length === 31 && store2.registrations.find(r => r._id === 'reg_1').status === 'CONFIRMED', 'restart reloads every change');

console.log(`\n${n} checks passed`);
process.exit(0);

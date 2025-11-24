import { DataSource, Equal } from "typeorm";
import { Brand } from "./entities.js";
import { randomUUID } from "crypto";

const orm = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URI,
    synchronize: true,
    logging: true,
    entities: [Brand],
    // cache: true NOTE: Enable to fail
});

await orm.initialize();

// Test timestamp: using a specific date for comparison
const testDate = new Date('2024-11-23T10:30:00.123Z');
console.log('Original test date:', testDate.toISOString());

// Insert a record with both timestamp types
let insertedId: string = randomUUID();
await orm.createEntityManager().transaction(async (transaction) => {
    const brand = new Brand();
    brand.timestamptz = testDate;
    brand.timestampWithTimezone = testDate;
    const result = await transaction.save(Brand, brand);
    insertedId = result.id;
    console.log('\n✅ Inserted Brand with id:', insertedId);
});

// Test 1: First query (should hit database and populate cache)
console.log('\n--- Test 1: First Query (Cache Miss) ---');
const firstQuery = await orm.getRepository(Brand).findOne({
    where: { id: insertedId },
    // cache: true NOTE: Enable to fail
});

if (!firstQuery) {
    throw new Error("Brand not found");
}

console.log('timestamptz:', firstQuery.timestamptz.toISOString());
console.log('timestampWithTimezone:', firstQuery.timestampWithTimezone.toISOString());

// Test 2: Second query (should hit cache)
console.log('\n--- Test 2: Second Query (Cache Hit) ---');
const secondQuery = await orm.getRepository(Brand).findOne({
    where: { id: insertedId },
    // cache: true NOTE: Enable to fail
});

if (!secondQuery) {
    throw new Error("Brand not found");
}

console.log('timestamptz:', secondQuery.timestamptz.toISOString());
console.log('timestampWithTimezone:', secondQuery.timestampWithTimezone.toISOString());

// Test 3: Verify persistence/hydration - both columns should be Date objects
console.log('\n--- Test 3: Verify Persistence/Hydration ---');
console.log('timestamptz is Date:', secondQuery.timestamptz instanceof Date);
console.log('timestampWithTimezone is Date:', secondQuery.timestampWithTimezone instanceof Date);
console.log('timestamptz time matches original:', secondQuery.timestamptz.getTime() === testDate.getTime());
console.log('timestampWithTimezone time matches original:', secondQuery.timestampWithTimezone.getTime() === testDate.getTime());

// Test 4: Compare both column types - should be identical
console.log('\n--- Test 4: Compare Column Types ---');
console.log('ISO strings are identical:',
    secondQuery.timestamptz.toISOString() === secondQuery.timestampWithTimezone.toISOString());
console.log('Timestamps are identical:',
    secondQuery.timestamptz.getTime() === secondQuery.timestampWithTimezone.getTime());
console.log('Objects are equal:',
    JSON.stringify(secondQuery.timestamptz) === JSON.stringify(secondQuery.timestampWithTimezone));

// Test 5: Third query without cache to verify database persistence
console.log('\n--- Test 5: Query Without Cache ---');
const noCacheQuery = await orm.getRepository(Brand).findOne({
    where: { id: insertedId },
    cache: false
});

if (!noCacheQuery) {
    throw new Error("Brand not found");
}

console.log('timestamptz (no cache):', noCacheQuery.timestamptz.toISOString());
console.log('timestampWithTimezone (no cache):', noCacheQuery.timestampWithTimezone.toISOString());
console.log('Matches cached result:',
    noCacheQuery.timestamptz.getTime() === secondQuery.timestamptz.getTime());

console.log("\n✅ All tests completed!")
await orm.destroy();
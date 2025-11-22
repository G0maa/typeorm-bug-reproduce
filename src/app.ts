import { DataSource, Equal } from "typeorm";
import { Brand, BrandProperty } from "./entities.js";

const orm = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "rootpassword",
    database: "testdb",
    synchronize: true,
    // logging: true,
    entities: [Brand, BrandProperty],
});

await orm.initialize();

/**
 * After the transaction is committed, the brand and brand property are inserted into the database correctly.
 * Brand has id 1 and brand property has id 1 with foreign key brandId set to 1.
 *
 * Database after transaction is committed:
 * Brand
 * | id |
 * | 1  |
 *
 * BrandProperty
 * | id | brandId |
 * | 1  | 1       |
 */

await orm.createEntityManager().transaction(async (transaction) => {
    const brand = new Brand();
    await transaction.insert(Brand, brand);

    const brandProperty = new BrandProperty();
    brandProperty.brand = brand;
    await transaction.insert(BrandProperty, brandProperty);
});

/**
 * To prove that automated cascading will NULL the foreign key of the brand property we simply read the brand and save the brand.
 * Expected result: Only brand should be affected by updated without cascading to the brand property.
 * Actual result: Brand property is also updated (cascade) with foreign key brandId set to NULL.
 *
 * Database after transaction is committed:
 * Brand
 * | id |
 * | 1  |
 *
 * BrandProperty
 * | id | brandId |
 * | 1  | NULL    |
 *
 * Note: If we define { nullable: false } to our ManyToOne relation at BrandProperty->brand,
 * the database will throw an error when trying to save the brand, caused by the updated foreign key brandId of BrandProperty.
 */
await orm.createEntityManager().transaction(async (transaction) => {
    const brand = await transaction.findOne(Brand, {
        where: { id: Equal("1") },
        relations: { properties: true },
    });

    if (!brand) {
        throw new Error("Brand not found");
    }

    // Save will trigger cascade and setting foreign key brandId of BrandProperty to NULL.
    await transaction.save(Brand, brand);
});

console.log("END!")
await orm.destroy();
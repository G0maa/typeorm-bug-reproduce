import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Brand {
    @PrimaryGeneratedColumn({ type: "bigint" })
    // @PrimaryGeneratedColumn({ type: "int" }) // Using int will not cascade update when saving the brand.
    public id: string;

    @OneToMany(
        () => BrandProperty,
        (property) => property.brand,
        // intentionally no cascade here
    )
    public properties: BrandProperty[];
}

@Entity()
export class BrandProperty {
    @PrimaryGeneratedColumn({ type: "bigint" })
    // @PrimaryGeneratedColumn({ type: "int" }) // Using int will not cascade update when saving the brand.
    public id: string;

    @ManyToOne(() => Brand, (brand) => brand.properties, {
        // nullable: false, // Results in error when saving the brand, caused by the updated foreign key brandId of BrandProperty to NULL.
        // nullable: true, // DEFAULT: Results in unintended NULL foreign key brandId when saving the brand.
    })
    public brand: Brand;
}
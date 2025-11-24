import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column('timestamptz')
    timestamptz: Date;

    @Column('timestamp with time zone')
    timestampWithTimezone: Date;
}

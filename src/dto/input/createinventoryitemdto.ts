import { Length, IsNotEmpty, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateInventoryItemDTO {
    @IsNotEmpty({
        message: 'name is required'
    })
    @MaxLength(30, {
        message: 'name should not exceed 30 characters'
    })
    name: string;

    @IsOptional()
    @MaxLength(150, {
        message: 'description should not exceed 150 characters'
    })
    description: string;

    @MinLength(1, {
        message: 'quantity should not be less than 1'
    })
    quantity: number;

    @IsNotEmpty({
        message: 'category is required'
    })
    @Length(3, 150, {
        message: 'category should be between 3 and 150 characters'
    })
    category: string;

    @IsOptional()
    properties: [{ id?: string, value?: string }];

    @IsOptional()
    image: string;


    constructor(name?: string, description?: string, quantity?: number, category?: string, properties?: [{ id?: string, value?: string }], image?: string) {
        this.name = name;
        this.description = description;
        this.quantity = quantity;
        this.category = category;
        this.properties = properties;
        this.image = image;
    }
}
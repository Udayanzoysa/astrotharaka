import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list() {
    return this.productsService.listActive();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }
}

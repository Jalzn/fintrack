import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { parseInput } from '@/shared/infrastructure';
import { CurrentUser } from '@/shared/infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '@/shared/infrastructure/auth/jwt.guard';
import type {
  CategoryDTO,
  CreateCategoryUseCase,
  DeleteCategoryUseCase,
  GetCategoryByIdUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '@/transactions/application';
import {
  CreateCategoryInputSchema,
  DeleteCategoryInputSchema,
  GetCategoryByIdInputSchema,
  ListCategoriesInputSchema,
  UpdateCategoryInputSchema,
} from '@/transactions/application';
import {
  CREATE_CATEGORY_UC,
  DELETE_CATEGORY_UC,
  GET_CATEGORY_BY_ID_UC,
  LIST_CATEGORIES_UC,
  UPDATE_CATEGORY_UC,
} from '../tokens';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject(CREATE_CATEGORY_UC) private readonly createCategory: CreateCategoryUseCase,
    @Inject(UPDATE_CATEGORY_UC) private readonly updateCategory: UpdateCategoryUseCase,
    @Inject(GET_CATEGORY_BY_ID_UC) private readonly getCategoryById: GetCategoryByIdUseCase,
    @Inject(LIST_CATEGORIES_UC) private readonly listCategories: ListCategoriesUseCase,
    @Inject(DELETE_CATEGORY_UC) private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Post()
  async create(@Body() body: unknown, @CurrentUser() userId: string): Promise<CategoryDTO> {
    return this.createCategory.execute(
      parseInput(CreateCategoryInputSchema, { ...(body as object), userId }),
    );
  }

  @Get()
  async list(@Query() query: unknown, @CurrentUser() userId: string): Promise<CategoryDTO[]> {
    return this.listCategories.execute(
      parseInput(ListCategoriesInputSchema, { ...(query as object), userId }),
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() userId: string,
  ): Promise<CategoryDTO> {
    return this.updateCategory.execute(
      parseInput(UpdateCategoryInputSchema, { ...(body as object), id, userId }),
    );
  }

  @Get(':id')
  async findOne(@Param() params: unknown, @CurrentUser() userId: string): Promise<CategoryDTO> {
    return this.getCategoryById.execute(
      parseInput(GetCategoryByIdInputSchema, { ...(params as object), userId }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: unknown, @CurrentUser() userId: string): Promise<void> {
    await this.deleteCategory.execute(
      parseInput(DeleteCategoryInputSchema, { ...(params as object), userId }),
    );
  }
}

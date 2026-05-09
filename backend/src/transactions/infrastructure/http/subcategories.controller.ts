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
  CreateSubcategoryUseCase,
  DeleteSubcategoryUseCase,
  GetSubcategoryByIdUseCase,
  ListSubcategoriesUseCase,
  SubcategoryDTO,
  UpdateSubcategoryUseCase,
} from '@/transactions/application';
import {
  CreateSubcategoryInputSchema,
  DeleteSubcategoryInputSchema,
  GetSubcategoryByIdInputSchema,
  ListSubcategoriesInputSchema,
  UpdateSubcategoryInputSchema,
} from '@/transactions/application';
import {
  CREATE_SUBCATEGORY_UC,
  DELETE_SUBCATEGORY_UC,
  GET_SUBCATEGORY_BY_ID_UC,
  LIST_SUBCATEGORIES_UC,
  UPDATE_SUBCATEGORY_UC,
} from '../tokens';

@UseGuards(JwtAuthGuard)
@Controller('subcategories')
export class SubcategoriesController {
  constructor(
    @Inject(CREATE_SUBCATEGORY_UC) private readonly createSubcategory: CreateSubcategoryUseCase,
    @Inject(UPDATE_SUBCATEGORY_UC) private readonly updateSubcategory: UpdateSubcategoryUseCase,
    @Inject(GET_SUBCATEGORY_BY_ID_UC)
    private readonly getSubcategoryById: GetSubcategoryByIdUseCase,
    @Inject(LIST_SUBCATEGORIES_UC) private readonly listSubcategories: ListSubcategoriesUseCase,
    @Inject(DELETE_SUBCATEGORY_UC) private readonly deleteSubcategory: DeleteSubcategoryUseCase,
  ) {}

  @Post()
  async create(@Body() body: unknown, @CurrentUser() userId: string): Promise<SubcategoryDTO> {
    return this.createSubcategory.execute(
      parseInput(CreateSubcategoryInputSchema, { ...(body as object), userId }),
    );
  }

  @Get()
  async list(@Query() query: unknown, @CurrentUser() userId: string): Promise<SubcategoryDTO[]> {
    return this.listSubcategories.execute(
      parseInput(ListSubcategoriesInputSchema, { ...(query as object), userId }),
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() userId: string,
  ): Promise<SubcategoryDTO> {
    return this.updateSubcategory.execute(
      parseInput(UpdateSubcategoryInputSchema, { ...(body as object), id, userId }),
    );
  }

  @Get(':id')
  async findOne(@Param() params: unknown, @CurrentUser() userId: string): Promise<SubcategoryDTO> {
    return this.getSubcategoryById.execute(
      parseInput(GetSubcategoryByIdInputSchema, { ...(params as object), userId }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: unknown, @CurrentUser() userId: string): Promise<void> {
    await this.deleteSubcategory.execute(
      parseInput(DeleteSubcategoryInputSchema, { ...(params as object), userId }),
    );
  }
}

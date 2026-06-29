import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './projects.schema';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const project = await this.projectModel.create({
      ...createProjectDto,
      createdBy: userId,
    });

    this.logger.log(`Project created: ${project._id.toString()}`);

    return project;
  }

  findAll() {
    return this.projectModel.find().populate('createdBy', 'email');
  }

  async findById(projectId: string) {
    const project = await this.projectModel
      .findById(new Types.ObjectId(projectId))
      .populate('createdBy', 'email');

    if (!project) {
      return null;
    }

    return project;
  }
}

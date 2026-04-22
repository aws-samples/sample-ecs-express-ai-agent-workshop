import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'GIT_SHA is not set' })
  @HttpCode(200)
  getHealth(): { status: string; gitSha: string } {
    const health = this.appService.getHealth();
    if (!health.gitSha) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        gitSha: null,
        reason: 'GIT_SHA environment variable is not set',
      });
    }
    return health;
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@AllowAnonymous()
@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API metadata and key endpoints' })
  @ApiOkResponse({
    description: 'API root metadata.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'SmartDine API v1.0' },
        endpoints: {
          type: 'array',
          items: { type: 'string' },
        },
        websocket: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  getRoot() {
    return this.appService.getRoot();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({
    description: 'Health status payload.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}

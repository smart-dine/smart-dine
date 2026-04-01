import { Injectable, Version } from '@nestjs/common';

@Injectable()
export class AppService {
  @Version('1')
  getRoot() {
    return {
      message: 'SmartDine API v1.0',
      endpoints: [
        'GET /api/v1/health - Check API health status',
        'ALL /api/auth - Authentication endpoints',
      ],
    };
  }

  @Version('1')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

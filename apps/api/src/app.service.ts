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
        'GET /api/v1/restaurants - Public restaurant discovery',
        'POST /api/v1/restaurants/:restaurantId/reservations - Create reservation (auth)',
        'POST /api/v1/restaurants/:restaurantId/orders - Create order (staff)',
        'GET /api/v1/my/restaurants - Staff and owner restaurant list',
        'GET /api/v1/admin/* - Site administration endpoints',
      ],
      websocket: [
        'namespace: /kiosk',
        'events: kiosk.join, order.created, order.status.updated, order.completed',
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

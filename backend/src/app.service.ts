import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'N3RVE Onboarding Platform API';
  }
}
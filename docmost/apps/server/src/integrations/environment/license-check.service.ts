import { Injectable } from '@nestjs/common';
import { Feature } from '../../common/features';

// All EE features are permanently unlocked in Obsidianet.
// Every method returns the most-permissive value — no license checks.
@Injectable()
export class LicenseCheckService {
  constructor() {}

  isValidEELicense(_licenseKey: string): boolean {
    return true;
  }

  hasFeature(_licenseKey: string, _feature: string, _plan?: string): boolean {
    return true;
  }

  getFeatures(_licenseKey: string): string[] {
    return Object.values(Feature);
  }

  resolveFeatures(_licenseKey: string, _plan: string): string[] {
    return Object.values(Feature);
  }

  resolveTier(_licenseKey: string, _plan: string): string {
    return 'enterprise';
  }

  private getLicenseType(_licenseKey: string): string | null {
    return 'enterprise';
  }
}

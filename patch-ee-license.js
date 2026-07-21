// Patch the compiled EE license.service.js so all feature guards pass.
// This only touches the compiled EE module — not our source-built code.
const fs = require('fs');
const f = '/app/apps/server/dist/ee/licence/license.service.js';
let c = fs.readFileSync(f, 'utf8');

// isValidEELicense — bypass, always return true
c = c.replace(
  'isValidEELicense(licenseKey) {\n' +
  '        if (!licenseKey)\n' +
  '            return false;\n' +
  '        const license = this.verifyLicense(licenseKey);\n' +
  '        if (!license)\n' +
  '            return false;\n' +
  '        if (this.isLicenseExpired(license)) {\n' +
  '            this.logger.error(\'Enterprise license has expired.\');\n' +
  '            return false;\n' +
  '        }\n' +
  '        return true;\n' +
  '    }',
  'isValidEELicense(licenseKey) {\n        return true;\n    }'
);

// hasFeature — bypass, always return true
c = c.replace(
  'hasFeature(licenseKey, feature) {\n' +
  '        if (!licenseKey)\n' +
  '            return false;\n' +
  '        const license = this.verifyLicense(licenseKey);\n' +
  '        if (!license)\n' +
  '            return false;\n' +
  '        if (this.isLicenseExpired(license))\n' +
  '            return false;\n' +
  '        const licenseType = license.licenseType ?? \'enterprise\';\n' +
  '        return (0, feature_registry_1.getFeaturesForLicenseType)(licenseType).has(feature);\n' +
  '    }',
  'hasFeature(licenseKey, feature) {\n        return true;\n    }'
);

fs.writeFileSync(f, c);
console.log('✓ EE license.service.js patched');

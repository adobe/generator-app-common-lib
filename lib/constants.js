/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

module.exports = {
  isLoopingPrompts: false,
  actionsDirname: 'actions',
  dotenvFilename: '.env',
  manifestPackagePlaceholder: '__APP_PACKAGE__',
  sdkCodes: {
    analytics: 'AdobeAnalyticsSDK',
    assetCompute: 'AssetComputeSDK',
    campaign: 'CampaignSDK',
    customerProfile: 'McDataServicesSdk',
    target: 'AdobeTargetSDK'
  },
  ciDirName: '.github',
  commonDependencyVersions: {
    '@adobe/aio-sdk': '^6'
  },
  appConfigFile: 'app.config.yaml',
  runtimeManifestKey: 'runtimeManifest',
  nodeEngines: '>=18',
  defaultRuntimeKind: 'nodejs:22'
}

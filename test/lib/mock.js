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

const selectedProvidersToEventMetadata = {
  'provider-metadata-1': {
    provider: {
      id: 'provider-id-1',
      label: 'provider-label-1',
      description: 'provider-desc-1',
      provider_metadata: 'provider-metadata-1',
      eventmetadata: [{
        name: 'event-metadata-1',
        value: 'event-metadata-1',
        description: 'event-metadata-desc-1'
      }, {
        name: 'event-metadata-2',
        value: 'event-metadata-2',
        description: 'event-metadata-desc-2'
      }]
    },
    eventmetadata: ['event-metadata-1', 'event-metadata-2']
  },
  'provider-metadata-2': {
    provider: {
      id: 'provider-id-2',
      label: 'provider-label-2',
      description: 'provider-desc-2',
      provider_metadata: 'provider-metadata-2',
      eventMetadata: [{
        name: 'event-metadata-3',
        value: 'event-metadata-3',
        description: 'event-metadata-desc-3'
      }]
    },
    eventmetadata: ['event-metadata-3']
  }
}

const projectConfig = {
  id: 'project-id',
  name: 'project-name',
  title: 'project-title',
  description: 'project-description',
  org: {
    id: 'org-id',
    name: 'org-name',
    ims_org_id: 'imsOrgId@AdobeOrg'
  }
}

const testRegistration = {
  description: 'test-description',
  events_of_interest: [
    {
      event_codes: [
        'event-metadata-1',
        'event-metadata-2'
      ],
      provider_metadata: 'provider-metadata-1'
    },
    {
      event_codes: [
        'event-metadata-3'
      ],
      provider_metadata: 'provider-metadata-2'
    }
  ],
  runtime_action: 'dx-excshell-1/test-action-name'
}

const existingTestRegistration = {
  description: 'test-description-existing',
  events_of_interest: [
    {
      event_codes: [
        'event-metadata-4',
        'event-metadata-5'
      ],
      provider_metadata: 'provider-metadata-3'
    }
  ],
  runtime_action: 'dx-excshell-1/test-action-name-existing'
}

const eventsManifestDetails = {
  registrations: {
    'test-name': testRegistration
  }
}

const eventDetailsInput = {
  regName: 'test-name',
  regDesc: 'test-description',
  selectedProvidersToEventMetadata,
  runtimeActionName: 'test-action-name'
}

const providerMetadataList = [
  {
    id: 'provider-metadata-1',
    group: 'provider-metadata-group-1',
    label: 'provider-metadata-label-1',
    description: 'provider-metadata-desc-1',
    has_multiple_providers: true
  },
  {
    id: 'provider-metadata-2',
    group: 'provider-metadata-group-2',
    label: 'provider-metadata-label-2',
    description: 'provider-metadata-desc-2',
    has_multiple_providers: false
  },
  {
    id: 'provider-metadata-3',
    group: 'provider-metadata-group-3',
    label: 'provider-metadata-label-3',
    description: 'provider-metadata-desc-3',
    has_multiple_providers: false
  }
]

const embeddedProviderMetadata = {
  _embedded: {
    providermetadata: providerMetadataList
  }
}

const runtimeManifestWithAvailableNonWebActions = {
  packages: {
    somepackage: {
      actions: {
        actionValidForEvents: {
          function: 'fake.js',
          web: 'no',
          annotations: {
            'require-adobe-auth': false
          }
        },
        actionInvalidForEvents: {
          function: 'fake.js',
          web: 'yes',
          annotations: {
            'require-adobe-auth': true
          }
        }
      }
    }
  }
}

const runtimeManifestWithWebActions = {
  packages: {
    somepackage: {
      actions: {
        actionxyz: { function: 'fake.js' }
      }
    }
  }
}

const data = {
  selectedProvidersToEventMetadata,
  projectConfig,
  testRegistration,
  existingTestRegistration,
  eventsManifestDetails,
  eventDetailsInput,
  embeddedProviderMetadata,
  providerMetadataList,
  runtimeManifestWithWebActions,
  runtimeManifestWithAvailableNonWebActions
}

module.exports = {
  data
}

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

const eventsSdk = require('@adobe/aio-lib-events')
const mockData = require('../mock')
const { promptForEventsOfInterest, getProviderMetadataToProvidersExistingMap } = require('../../../lib/events/EventsOfInterestHelper')
const { selectEventMetadataForProvider, selectProviderForProviderMetadata } = require('../../../lib/events/ProviderHelper')
const EventsGenerator = require('../../../lib/EventsGenerator')
jest.mock('yeoman-generator')
jest.mock('../../../lib/EventsGenerator')
jest.mock('@adobe/aio-lib-events')
jest.mock('../../../lib/events/ProviderHelper', () => ({
  selectEventMetadataForProvider: jest.fn(),
  selectProviderForProviderMetadata: jest.fn()
}))

jest.mock('../../../lib/events/ProviderMetadataHelper', () => ({
  getEntitledProviderMetadataForOrg: jest.fn().mockResolvedValue(mockData.data.providerMetadataList),
  getProviderMetadata: jest.fn().mockResolvedValue(['provider-metadata-1', 'provider-metadata-2'])
}))

const getTestProvider = (index, numberOfEvents) => {
  const eventMetadatas = []
  for (let number = 1; number <= numberOfEvents; number++) {
    eventMetadatas.push({
      description: 'event-metadata-' + number,
      label: 'event-metadata-label-' + number,
      event_code: 'event-code-' + number
    })
  }
  return {
    id: 'provider-id-' + index,
    label: 'provider-label-' + index,
    description: 'provider-description-' + index,
    provider_metadata: 'provider-metadata-' + index,
    _embedded: { eventmetadata: eventMetadatas }
  }
}

const mockEventsSdkInstance = {
  getAllProviders: jest.fn().mockResolvedValue({
    _embedded: {
      providers: [
        getTestProvider(1, 2),
        getTestProvider(2, 1)
      ]
    }
  })
}

const getTestSelectedProvider = (index, numberOfEvents) => {
  const eventMetadatas = []
  for (let number = 1; number <= numberOfEvents; number++) {
    eventMetadatas.push({
      description: 'event-metadata-' + number,
      label: 'event-metadata-label-' + number,
      event_code: 'event-code-' + number
    })
  }
  return {
    id: 'provider-id-' + index,
    label: 'provider-label-' + index,
    description: 'provider-description-' + index,
    provider_metadata: 'provider-metadata-' + index,
    eventmetadata: eventMetadatas
  }
}

const aioEventsMappingEnvVariableDotEnv = 'provider-metadata-1:provider-id-1,provider-metadata-2:provider-id-2'

beforeEach(() => {
  eventsSdk.init.mockResolvedValue(mockEventsSdkInstance)
})

describe('test prompt for events of interest', () => {
  let eventsGenerator
  let eventsClient
  beforeEach(async () => {
    EventsGenerator.prototype.projectConfig = mockData.data.projectConfig
    eventsClient = await eventsSdk.init('orgid', 'api-key', 'token')
    eventsGenerator = new EventsGenerator()
    selectEventMetadataForProvider
      .mockReturnValueOnce(['event-code-1', 'event-code-2'])
      .mockReturnValueOnce(['event-code-1'])
    selectProviderForProviderMetadata
      .mockReturnValueOnce(getTestSelectedProvider(1, 2))
      .mockReturnValueOnce(getTestSelectedProvider(2, 1))
  })

  test('successfully fetch providers to event metadata map', async () => {
    const eventsOfInterest = await promptForEventsOfInterest(eventsClient, eventsGenerator)
    expect(eventsOfInterest['provider-metadata-1']).toBeTruthy()
    expect(eventsOfInterest['provider-metadata-2']).toBeTruthy()
    expect(eventsOfInterest['provider-metadata-1'].provider.id).toContain('provider-id-1')
    expect(eventsOfInterest['provider-metadata-2'].provider.id).toContain('provider-id-2')
    expect(eventsOfInterest['provider-metadata-1'].eventmetadata.length).toBe(2)
    expect(eventsOfInterest['provider-metadata-2'].eventmetadata.length).toBe(1)
  })

  test('get provider metadata to providers existing map', () => {
    const providerMetadataToProviderMapFromDotEnv = getProviderMetadataToProvidersExistingMap(aioEventsMappingEnvVariableDotEnv)
    expect(providerMetadataToProviderMapFromDotEnv).toBeTruthy()
    expect(providerMetadataToProviderMapFromDotEnv['provider-metadata-1']).toContain('provider-id-1')
    expect(providerMetadataToProviderMapFromDotEnv['provider-metadata-2']).toContain('provider-id-2')
    expect(Object.keys(providerMetadataToProviderMapFromDotEnv)).toHaveLength(2)
  })

  test('get provider metadata to providers existing empty map', () => {
    const providerMetadataToProviderMapFromDotEnv = getProviderMetadataToProvidersExistingMap(undefined)
    expect(providerMetadataToProviderMapFromDotEnv).toBeTruthy()
    expect(Object.keys(providerMetadataToProviderMapFromDotEnv)).toHaveLength(0)
  })
})

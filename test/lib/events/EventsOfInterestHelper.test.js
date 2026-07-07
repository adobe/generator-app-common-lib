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

import { data } from '../mock.js'
import { promptForEventsOfInterest, getProviderMetadataToProvidersExistingMap } from '../../../lib/events/EventsOfInterestHelper.js'

vi.mock('yeoman-generator')
vi.mock('../../../lib/EventsGenerator.js', () => {
  const EventsGenerator = vi.fn()
  EventsGenerator.prototype.prompt = vi.fn()
  return { default: EventsGenerator }
})
vi.mock('@adobe/aio-lib-events')

vi.mock('../../../lib/events/ProviderHelper.js', () => ({
  selectEventMetadataForProvider: vi.fn(),
  selectProviderForProviderMetadata: vi.fn(),
  getAllEntitledProvidersForOrg: vi.fn()
}))

vi.mock('../../../lib/events/ProviderMetadataHelper.js', () => ({
  getEntitledProviderMetadataForOrg: vi.fn(),
  getProviderMetadata: vi.fn().mockResolvedValue(['provider-metadata-1', 'provider-metadata-2'])
}))

import eventsSdk from '@adobe/aio-lib-events'
import EventsGenerator from '../../../lib/EventsGenerator.js'
import { getAllEntitledProvidersForOrg, selectEventMetadataForProvider, selectProviderForProviderMetadata } from '../../../lib/events/ProviderHelper.js'
import { getEntitledProviderMetadataForOrg, getProviderMetadata } from '../../../lib/events/ProviderMetadataHelper.js'

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

describe('test prompt for events of interest', () => {
  let eventsGenerator
  let eventsClient
  beforeEach(async () => {
    EventsGenerator.prototype.projectConfig = data.projectConfig
    eventsClient = await eventsSdk.init('orgid', 'api-key', 'token')
    eventsGenerator = new EventsGenerator()
    selectEventMetadataForProvider
      .mockReturnValueOnce(['event-code-1', 'event-code-2'])
      .mockReturnValueOnce(['event-code-1'])
    selectProviderForProviderMetadata
      .mockReturnValueOnce(getTestSelectedProvider(1, 2))
      .mockReturnValueOnce(getTestSelectedProvider(2, 1))
    getAllEntitledProvidersForOrg.mockReturnValue([
      getTestProvider(1, 2),
      getTestProvider(2, 1),
      getTestProvider(3, 0)
    ])
    vi.mocked(getEntitledProviderMetadataForOrg).mockResolvedValue(data.providerMetadataList)
  })

  test('successfully fetch providers to event metadata map', async () => {
    const eventsOfInterest = await promptForEventsOfInterest(eventsClient, eventsGenerator)
    expect(getProviderMetadata).toHaveBeenCalledWith(eventsGenerator, [{
      description: 'provider-metadata-desc-1',
      group: 'provider-metadata-group-1',
      has_multiple_providers: true,
      id: 'provider-metadata-1',
      label: 'provider-metadata-label-1'
    }, {
      description: 'provider-metadata-desc-2',
      group: 'provider-metadata-group-2',
      has_multiple_providers: false,
      id: 'provider-metadata-2',
      label: 'provider-metadata-label-2'
    }], undefined)
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

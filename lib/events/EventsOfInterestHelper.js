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

const { selectEventMetadataForProvider, selectProviderForProviderMetadata } = require('./ProviderHelper')
const { getEntitledProviderMetadataForOrg, getProviderMetadata } = require('./ProviderMetadataHelper')

async function promptForEventsOfInterest (eventsClient, obj, options) {
  const providerMetadataList = await getEntitledProviderMetadataForOrg(eventsClient)
  // get all providers filtered by the selected provider metadata ids
  const providerMetadataIds = await getProviderMetadata(obj, providerMetadataList, options)
  // get a map of provider_metadata_id -> providers
  const providerMetadataToProvidersMap = await getProviderMetadataToProvidersMap(obj.projectConfig.org.id, eventsClient, providerMetadataIds)
  // get the existing map of provider_metadata_id -> provider_id from the .env file
  const selectedProvidersToEventMetadata = new Map()
  for (const providerMetadataId of providerMetadataIds) {
    const providerSelected = await selectProviderForProviderMetadata(
      providerMetadataToProvidersMap, providerMetadataId, obj)
    const eventMetadataChoices = []
    const eventMetadataSelected = await selectEventMetadataForProvider(
      providerSelected, eventMetadataChoices, obj)
    selectedProvidersToEventMetadata[providerSelected.provider_metadata] = {
      provider: providerSelected,
      eventmetadata: eventMetadataSelected
    }
  }
  return selectedProvidersToEventMetadata
}

/** @private */
async function getProviderMetadataToProvidersMap (consumerId, eventsClient, providerMetadataIds) {
  const providersHalModel = await eventsClient.getAllProviders(consumerId, {
    fetchEventMetadata: true,
    filterBy: {
      providerMetadataIds
    }
  })
  const providers = providersHalModel._embedded.providers
  const providerMetadataToProvidersMap = providers.reduce((providerMetadataToProvidersMap, provider) => {
    providerMetadataToProvidersMap[provider.provider_metadata] = providerMetadataToProvidersMap[provider.provider_metadata] || []
    providerMetadataToProvidersMap[provider.provider_metadata].push({
      id: provider.id,
      label: provider.label,
      description: provider.description,
      provider_metadata: provider.provider_metadata,
      eventmetadata: provider._embedded.eventmetadata
    })
    return providerMetadataToProvidersMap
  }, [])
  return providerMetadataToProvidersMap
}

function getProviderMetadataToProvidersExistingMap (providerMetadataToProviderMappingDotEnv) {
  if (providerMetadataToProviderMappingDotEnv) {
    const entries = providerMetadataToProviderMappingDotEnv.split(',')
    const providerMetadataToProviderIdMappingExistingMap = {}
    for (let i = 0; i < entries.length; i++) {
      const tokens = entries[i].split(':')
      providerMetadataToProviderIdMappingExistingMap[tokens[0].trim()] = tokens[1].trim()
    }
    return providerMetadataToProviderIdMappingExistingMap
  }
  return {}
}

module.exports = {
  promptForEventsOfInterest,
  getProviderMetadataToProvidersExistingMap
}

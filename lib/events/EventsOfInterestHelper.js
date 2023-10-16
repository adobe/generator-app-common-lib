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

const { getAllEntitledProvidersForOrg, selectEventMetadataForProvider, selectProviderForProviderMetadata } = require('./ProviderHelper')
const { getEntitledProviderMetadataForOrg, getProviderMetadata } = require('./ProviderMetadataHelper')

async function promptForEventsOfInterest (eventsClient, obj, options) {
  // get all entitled provider metadata for the org
  const providerMetadataList = await getEntitledProviderMetadataForOrg(eventsClient)
  // get all entitled providers for the org
  const allProvidersForOrgList = await getAllEntitledProvidersForOrg(eventsClient, obj.projectConfig.org.id)
  // get a map of provider_metadata_id -> List of providers with valid event metadata
  const providerMetadataToProvidersMap = getProviderMetadataToProvidersMap(obj.projectConfig.org.id, eventsClient, allProvidersForOrgList)
  // filter provider metadata that do not have associated providers
  const filteredProviderMetadataList = filterProviderMetadataWithInvalidProviders(providerMetadataList,
    providerMetadataToProvidersMap)
  // get user selected provider metadata ids
  const providerMetadataIds = await getProviderMetadata(obj, filteredProviderMetadataList, options)

  // get user selected providers and associated event metadata
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

/** @private
 * Filter provider metadata that do not have any providers
 */
function filterProviderMetadataWithInvalidProviders (providerMetadataList, providerMetadataToProvidersMap) {
  const filteredProviderMetadataList = []
  for (const providerMetadata of providerMetadataList) {
    const providerMetadataId = providerMetadata.id
    if (providerMetadataToProvidersMap[providerMetadataId]?.length > 0) {
      filteredProviderMetadataList.push(providerMetadata)
    }
  }
  return filteredProviderMetadataList
}

/** @private */
function getProviderMetadataToProvidersMap (consumerId, eventsClient, allProvidersForOrgList) {
  const providerMetadataToProvidersMap = {}
  for (const provider of allProvidersForOrgList) {
    if (provider._embedded?.eventmetadata?.length > 0) {
      providerMetadataToProvidersMap[provider.provider_metadata] = providerMetadataToProvidersMap[provider.provider_metadata] || []
      providerMetadataToProvidersMap[provider.provider_metadata].push({
        id: provider.id,
        label: provider.label,
        description: provider.description,
        provider_metadata: provider.provider_metadata,
        eventmetadata: provider._embedded.eventmetadata
      })
    }
  }
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

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

async function getEntitledProviderMetadataForOrg (eventsClient) {
  const providerMetadataHalModel = await eventsClient.getProviderMetadata()
  return providerMetadataHalModel._embedded.providermetadata
}

async function getProviderMetadata (obj, providerMetadataList, options) {
  const providerMetadataChoices = []
  for (const providerMetadata of providerMetadataList) {
    if (options && options.providerMetadataId) {
      if (providerMetadata.id === options.providerMetadataId) {
        providerMetadataChoices.push({
          name: providerMetadata.label,
          description: providerMetadata.description,
          value: providerMetadata.id
        })
      }
    } else {
      providerMetadataChoices.push({
        name: providerMetadata.label,
        description: providerMetadata.description,
        value: providerMetadata.id
      })
    }
  }
  if (options && options.providerMetadataId && providerMetadataChoices.length === 0) {
    throw new Error('You are not entitled to provider metadata: ' + options.providerMetadataId)
  } else if (providerMetadataChoices.length === 0) {
    throw new Error('You are not entitled to any provider metadata')
  }
  const { providerMetadataIds } = await obj.prompt({
    type: 'checkbox',
    name: 'providerMetadataIds',
    message: 'Choose from the following provider families ( provider metadata )',
    choices: providerMetadataChoices,
    pageSize: 5,
    validate: (options) => {
      if (!options.length) {
        return 'Choose at least one of the above, use space to choose the option'
      }
      return true
    }
  })
  return providerMetadataIds
}

module.exports = {
  getEntitledProviderMetadataForOrg,
  getProviderMetadata
}

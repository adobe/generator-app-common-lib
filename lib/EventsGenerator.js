/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const utils = require('./utils')
const eventsSdk = require('@adobe/aio-lib-events')
const config = require('@adobe/aio-lib-core-config')
const { getToken } = require('@adobe/aio-lib-ims')
const { CLI } = require('@adobe/aio-lib-ims/src/context')

const process = require('process')
const ActionGenerator = require('./ActionGenerator')
const { promptForEventsOfInterest } = require('./events/EventsOfInterestHelper')

class EventsGenerator extends ActionGenerator {
  constructor (args, opts) {
    super(args, opts)
    this.option('skip-prompt', { default: false }) // prompt to ask action name
    // required
    this.option('config-path',
      { type: String, description: 'relative path to the config yaml file' })
    this.option('full-key-to-events-manifest', {
      type: String,
      description: 'key in config path that resolves to events manifest e.g. "application.events"',
      default: ''
    })
    if (!(this.options['config-path'])) {
      this.env.error(
          `One or more options are missing for this generator. \nUsage:\n${this.optionsHelp()}`)
    }

    this.configPath = this.destinationPath(this.options['config-path'])
    this.fullKeyToRuntimeManifest = this.options['full-key-to-manifest']
    this.actionFolder = this.options['action-folder'] // todo ensure this is relative to root
    this.fullKeyToEventsManifest = this.options['full-key-to-events-manifest']
    this.projectConfig = config.get('project')
  }

  async initEventsClient () {
    if (!this.projectConfig) {
      this.error(`Incomplete .aio configuration, please import a valid Adobe Developer Console configuration via \`${this.config.bin} app use\` first.`)
    }
    const orgCode = this.projectConfig.org.ims_org_id
    const accessToken = await getToken(CLI)
    const X_API_KEY = process.env.SERVICE_API_KEY
    const eventsClient = await eventsSdk.init(orgCode, X_API_KEY, accessToken)
    return eventsClient
  }

  async promptForEventsDetails (defaultValues) {
    const eventsClient = await this.initEventsClient()
    const runtimeActionName = await this.promptForActionName('showcases how to access an external API', 'generic')
    let regName = defaultValues.regName
    let regDesc = defaultValues.regDesc
    if (!this.options['skip-prompt']) {
      const basicDetails = await this.prompt([
        {
          type: 'input',
          name: 'regName',
          message: 'We are about to create a new Event registration.\nHow would you like to name this registration?',
          default: regName,
          when: !this.options['skip-prompt']
        },
        {
          type: 'input',
          name: 'regDesc',
          message: 'What is this registration being created for?',
          default: regDesc,
          when: !this.options['skip-prompt']
        }])
      regName = basicDetails.regName
      regDesc = basicDetails.regDesc
      const selectedProvidersToEventMetadata = await promptForEventsOfInterest(eventsClient, this)
      return { regName, regDesc, selectedProvidersToEventMetadata, runtimeActionName }
    }
  }

  /**
   * Adds a new event registration to the project
   *
   * @param {string} eventDetails
   * @param {object} [options={}]
   * @param {object} [options.dotenvStub]
   * @param {string} options.dotenvStub.label
   * @param {Array<string>} options.dotenvStub.vars
   * @param {object} [options.dependencies]
   * @param {object} [options.devDependencies]
   * @memberof EventsGenerator
   */
  addEvents (eventDetails, options = {}) {
    // NOTE: it's important to load a fresh manifest now, as we do want to include the
    // latest written data
    const events = this.loadEventsManifest(this.configPath, this.fullKeyToEventsManifest)

    this.setEventsManifestDetails(eventDetails, events)
    this.writeEventsManifest(this.configPath, this.fullKeyToEventsManifest, events)
  }

  /** @private */
  loadEventsManifest (configPath, fullKeyToEventsManifest) {
    const config = utils.readYAMLConfig(this, configPath)
    let events = fullKeyToEventsManifest.split('.').reduce((obj, k) => obj && obj[k], config) || {}
    console.log('Events manifest before init: ', events)
    if (!events.registrations) {
      events = {
          registrations: {}
      }
    }
    console.log('Events manifest after init: ', events)
    console.log(events)
    return events
  }

  /** @private */
  writeEventsManifest (configPath, fullKeyToEventsManifest, events) {
    utils.writeKeyYAMLConfig(this, configPath, fullKeyToEventsManifest, events)
  }

  /** @private */
  setEventsManifestDetails (regDetails, events) {
    const eventsOfInterest = []
    for (const provider of Object.keys(regDetails.selectedProvidersToEventMetadata)) {
      console.log('provider metadata: ', provider)
      eventsOfInterest.push({
        provider_metadata: provider,
        event_codes: regDetails.selectedProvidersToEventMetadata[provider].eventMetadata
      })
    }

    events.registrations[regDetails.regName] = {
      description: regDetails.regDesc,
      events_of_interest: eventsOfInterest,
      runtime_action: regDetails.runtimeActionName
    }

    return events
  }
}

module.exports = EventsGenerator
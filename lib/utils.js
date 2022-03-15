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

const path = require('path')
const yaml = require('js-yaml')
const { EOL } = require('os')
const { appConfigFile, dotenvFilename } = require('./constants')

function atLeastOne (input) {
  if (input.length === 0) {
    return 'please choose at least one option'
  }
  return true
}

/* app generator specific utilities */

// NOTE: supports setting multilayer keys like 'a.b.c=value'
function writeKeyAppConfig (generator, key, value) {
  const appConfigPath = generator.destinationPath(appConfigFile)
  writeKeyYAMLConfig(generator, appConfigPath, key, value)
}

// NOTE: supports setting multilayer keys like 'a.b.c=value'
function writeKeyYAMLConfig (generator, configPath, key, value) {
  const config = readYAMLConfig(generator, configPath)
  writeMultiLayerKeyInObject(config, key, value)
  writeYAMLConfig(generator, configPath, config)
}

function writeMultiLayerKeyInObject (obj, key, value) {
  const interKeys = key.split('.')
  interKeys.slice(0, -1).forEach(k => {
    if (!obj[k]) {
      obj[k] = {}
    }
    obj = obj[k]
  })
  // last interKey => write value
  const last = interKeys.slice(-1)
  // assumes obj[last] is same type of value
  if (Array.isArray(value)) {
    obj[last] = [...obj[last], ...value]
  } else if (typeof value === 'object') {
    obj[last] = { ...obj[last], ...value }
  } else {
    obj[last] = value
  }
}

function readYAMLConfig (generator, configPath) {
  if (!generator.fs.exists(configPath)) {
    return {}
  }
  return yaml.load(generator.fs.read(configPath))
}

function writeYAMLConfig (generator, configPath, config) {
  generator.fs.write(configPath, yaml.dump(config))
}

function guessProjectName (generator) {
  const packagejsonPath = generator.destinationPath('package.json')
  return (generator.fs.exists(packagejsonPath) && generator.fs.readJSON('package.json').name) || path.basename(process.cwd())
}

function readPackageJson (generator) {
  const packagejsonPath = generator.destinationPath('package.json')
  return generator.fs.readJSON(packagejsonPath) || {}
}

function writePackageJson (generator, content) {
  const packagejsonPath = generator.destinationPath('package.json')
  return generator.fs.writeJSON(packagejsonPath, content || {})
}

function addDependencies (generator, deps, dev = false) {
  const content = readPackageJson(generator)
  const key = dev ? 'devDependencies' : 'dependencies'
  content[key] = { ...content[key], ...deps }
  writePackageJson(generator, content)
}

function addPkgScript (generator, scripts) {
  const content = readPackageJson(generator)
  content.scripts = { ...content.scripts, ...scripts }
  writePackageJson(generator, content)
}

function appendStubVarsToDotenv (generator, label, vars) {
  const content = `## ${label}${EOL}${vars.map(v => `#${v}=`).join(EOL)}${EOL}`
  const file = generator.destinationPath(dotenvFilename)

  const prevContent = (generator.fs.exists(file) || '') && generator.fs.read(file)
  if (prevContent.includes(label)) {
    // if already there do nothing
    return
  }
  generator.fs.append(file, content)
}

module.exports = {
  atLeastOne,
  guessProjectName,
  addDependencies,
  addPkgScript,
  readPackageJson,
  writePackageJson,
  readYAMLConfig,
  writeYAMLConfig,
  writeKeyAppConfig,
  writeKeyYAMLConfig,
  appendStubVarsToDotenv,
  writeMultiLayerKeyInObject
}

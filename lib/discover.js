// discover.js

const fs = require('fs')
const path = require('path')
const camelCase = require('lodash.camelcase')

const getFolderListing = (filePath) => {
  return fs
    .readdirSync(filePath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort()
}

function walkFolder (filePath) {
  return fs
    .readdirSync(filePath, { withFileTypes: true })
    .map(dirEnt => {
      const item = dirEnt.name
      const itemPath = path.join(filePath, dirEnt.name)
      if (dirEnt.isDirectory()) {
        return {
          name: item,
          children: walkFolder(itemPath)
        }
      } else {
        return {
          name: item
        }
      }
    })
    .sort((a, b) => {
      /* istanbul ignore next */
      if (a.name < b.name) { return -1 }
      /* istanbul ignore next */
      if (a.name > b.name) { return 1 }
      /* istanbul ignore next */
      return 0 // equal
    })
}

/**
 * Dynamic templates' discovery by folder convention
 * @param {string} templatesPath path to scan for templates.
 * @returns {Object}
 */
module.exports = (templatesPath) => {
  return getFolderListing(templatesPath)
    .reduce((tm, categoryCollection) => {
      let cc = {}
      const categoryCollectionPath = path.join(templatesPath, categoryCollection)
      if (categoryCollection === 'resource') {
        cc = walkFolder(categoryCollectionPath)
      } else {
        getFolderListing(categoryCollectionPath)
          .forEach(categoryTemplate => {
            const categoryTemplatePath = path.join(categoryCollectionPath, categoryTemplate)
            cc[camelCase(categoryTemplate)] = require(categoryTemplatePath) // load the template
          })
      }
      tm[camelCase(categoryCollection)] = cc
      return tm
    }, {})
}

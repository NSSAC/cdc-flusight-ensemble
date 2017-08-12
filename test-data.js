// Test data files for inconsistencies

const chai = require('chai')
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const Papa = require('papaparse')
const mmwr = require('mmwr-week')
const moment = require('moment')

chai.should()

const whitelisted_directories = [
  '.git',
  'plots',
  'scripts',
  'templates',
  'flusight-deploy',
  'node_modules'
]

// Metadata tests
describe('metadata.txt', function () {
  let modelDirs = fs.readdirSync('./').filter(function (item) {
    return (fs.statSync(item).isDirectory() && whitelisted_directories.indexOf(item) === -1)
  })

  describe('should be present', function () {
    modelDirs.forEach(function (modelDir) {
      it(modelDir, function () {
        fs.existsSync(path.join(modelDir, 'metadata.txt')).should.be.true
      })
    })
  })

  let metadataFiles = fs.readdirSync('./').filter(function (item) {
    return (fs.statSync(item).isDirectory() && whitelisted_directories.indexOf(item) === -1)
  }).map(function (modelDir) {
    return path.join(modelDir, 'metadata.txt')
  })

  describe('should be yaml readable', function () {
    metadataFiles.forEach(function (metaFile) {
      it(metaFile, function (done) {
        try {
          yaml.safeLoad(fs.readFileSync(metaFile, 'utf8'))
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  it('team-model abbreviations should be unique', function (done) {
    let abbreviations = metadataFiles.map(function (metaFile) {
      let meta = yaml.safeLoad(fs.readFileSync(metaFile, 'utf8'))
      return meta.team_name + '-' + meta.model_abbr
    })

    // Count number of times the names are present
    let counts = abbreviations.reduce(function (acc, y) {
      if (acc[y]) {
        acc[y] += 1
      } else {
        acc[y] = 1
      }
      return acc
    }, {})

    for (let name in counts) {
      if (counts[name] > 1) {
        done(new Error(`Non unique model abbreviation found for ${name}`))
      }
    }
  })

  describe('should have team_name withing 10 chars', function () {
    metadataFiles.forEach(function (metaFile) {
      it(metaFile, function () {
        let meta = yaml.safeLoad(fs.readFileSync(metaFile, 'utf8'))
        meta.team_name.length.should.be.below(11)
      })
    })
  })

  describe('should have model_abbr within 15 chars', function () {
    metadataFiles.forEach(function (metaFile) {
      it(metaFile, function () {
        let meta = yaml.safeLoad(fs.readFileSync(metaFile, 'utf8'))
        meta.model_abbr.length.should.be.below(16)
      })
    })
  })
})

// CSV tests
describe('CSV', function () {
  let modelDirs = fs.readdirSync('./').filter(function (item) {
    return (fs.statSync(item).isDirectory() && whitelisted_directories.indexOf(item) === -1)
  })

  let csvFiles = modelDirs.map(function (modelDir) {
    return fs.readdirSync(modelDir).filter(function (item) {
      return item.endsWith('csv')
    }).map(csv => path.join(modelDir, csv))
  }).reduce(function (acc, item) {
    return acc.concat(item)
  }, [])


  let currentMoment = moment()
  describe('should have valid week number', function () {
    csvFiles.forEach(function (csvFile) {
      it(csvFile, function () {
        let splits = path.basename(csvFile).split('-')
        let week = parseInt(splits[0].slice(2))
        let year = parseInt(splits[1])
        let mdate = new mmwr.MMWRDate(year, week)
        currentMoment.isAfter(mdate.toMomentDate()).should.be.true
      })
    })
  })
})

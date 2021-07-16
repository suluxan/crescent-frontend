const R = require('ramda')
const RA = require('ramda-adjunct')
const A = require('axios')
const fs = require('fs')
var rimraf = require("rimraf");
const axios = A.create({
  baseURL: `http://localhost:${process.env.EXPRESS_PORT}`,
  timeout: 10000,
});

const execSync = require('child_process').execSync;
const { async } = require('ramda-adjunct');

// Cleans the temp dirs created by a run
async function cleanTempDir(wesID, wesAPI, response=null) {
  try {
    let mount = "/var/lib/toil/"
    if (response == null)
      response = await wesAPI.getRunData(wesID);
    let start = response.run_log.stderr.indexOf(mount)
    let end = response.run_log.stderr.indexOf("/", start + mount.length)
    let dir = response.run_log.stderr.substring(start, end)
    console.log("Removing " + dir)
    rimraf.sync(dir);
    
  }
  catch (err){
    console.log("Unable to clean for " + wesID + " because of " + err)
  }
}

const resolvers = {
  Query: {
    allRuns: async (parent, variables, {Runs}) => {
      return await Runs.find({})
    },
    runs: async (parent, {projectID}, {Runs}) => {
      const runs = await Runs.find({projectID})
      return runs
    },
    run: async (parent, {runID}, {Runs}) => {
      const run = await Runs.findOne({runID})
      // console.log(run)
      return run
    },
  },
  Mutation: {
    createUnsubmittedRun: async (parent, {name, description, projectID, userID, datasetIDs}, {Runs, Minio, ToolSteps}) => {
      try {
        const isSingleDataset = R.compose(R.equals(1), R.length)(datasetIDs)

        const defaultReferenceDatasetIDs = isSingleDataset ? {referenceDatasetIDs: datasetIDs} : {} //if single dataset run then default to that one dataset
        const run = await Runs.create({name, description, projectID, createdBy: userID, datasetIDs, ... defaultReferenceDatasetIDs})
        const {runID} = run

        // Add default parameters
        const defaultParameters = R.compose(
          R.evolve({
            // Copy default quality control parameters for each dataset
            quality: R.compose(
              R.zipObj(datasetIDs),
              R.repeat(R.__, R.length(datasetIDs))
            )
          }),
          R.map(
            R.compose(
              R.mergeAll,
              R.map(({parameter, input: {defaultValue}}) => ({[parameter]: defaultValue}))
            )
          ),
          R.groupBy(R.prop('step')),
          R.filter(R.prop(isSingleDataset ? 'singleDataset' : 'multiDataset'))
        )(await ToolSteps.find({}))

        console.log(defaultParameters)
        run.parameters = defaultParameters
        await run.save()
        // Make bucket for run
        await Minio.client.makeBucket(`run-${runID}`)
        return run
      } catch (err) {
        console.log(err)
      }
    },

    updateRunParameterValue: async (
      parent,
      {runID, step, parameter, value},
      {Runs}
    ) => {
      try {
        const run = await Runs.findOne({runID})
        // For non-QC parameters
        const {parameters} = run
        let newParameters
        if (R.equals(step, 'quality')) {
          const {value: newValue, datasetID} = value
          newParameters = R.assocPath([step, datasetID, parameter], newValue, parameters)
        } else {
          newParameters = R.assocPath([step, parameter], value, parameters)
        }
        // console.log(newParameters)
        run.parameters = newParameters
        await run.save()
        // console.log(run.runID, run.name, run.parameters)
        return run
      } catch (err) {
        console.log(err)
      }
    },

    bulkUpdateRunParameterValues: async (
      parent,
      {runID, parameters},
      {Runs}
    ) => {
      try {
        const run = await Runs.findOne({runID})
        run.parameters = parameters
        await run.save()
        return run
      } catch (err) {
        console.log('bulkUpdateRunQCParameterValues', err)
      }
    },

    // Determine how many datasets this run uses and submit
    // appropriate CWL job to Express (should be replaced by WES)
    submitRun: async (parent, {runID}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        const {name, datasetIDs} = run
        // console.log('Submitting run', runID, datasetIDs)
        // run.params = params
        run.status = 'submitted'
        await run.save()
        const lengthIsOne = R.compose(R.equals(1), R.length)
        if (lengthIsOne(datasetIDs)) {
          await axios.post(
            `/express/runs/submit`,
            {},
            // axios params 
            {params: {name, runID}}
          )
        } else {
          await axios.post(
            `/express/runs/submitMerged`,
            {},
            // DatasetIDs can be parsed from the params object quality control field
            {params: {name, runID}}
          )
        }
        return run
      } catch(error) {
        console.log(error)
      }
    },

    deleteRun: async(parent, {runID}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        await Runs.deleteOne({runID})
        return run
      } catch(error) {
        console.error(error)
      }
    },
    cancelRun: async(parent, {runID}, {Docker, Runs}) => {
      try {
        const containerID = await Docker.getContainerId(runID);
        if (R.isNil(containerID)) {
          return null
        } else {
          await Docker.killContainer(containerID);
          await Runs.updateOne({runID}, {$set: {"status": 'failed'}})
          return "failed"
        }
      } catch (error) {
        console.log(error)
      }
    },
    uploadRunMetadata: async (parent, {runID, metadata}, {Runs, Minio}) => {
      try {
        const run = await Runs.findOne({runID})
        if (RA.isNotNil(run)) {
          const bucketName = `run-${runID}`
          await Minio.putUploadIntoBucket(bucketName, metadata, 'SEURAT/CRESCENT_CLOUD/frontend_metadata/metadata.tsv')  
        
          const m = await metadata
          run.uploadNames.metadata = m.filename
          await run.save()        

          return run
        }
      } catch(error) {
        console.log(error)
      }
    },

    uploadRunGeneset: async (parent, {runID, geneset}, {Runs, Minio}) => {
      try {
        const run = await Runs.findOne({runID})
        if (RA.isNotNil(run)) {
          const bucketName = `run-${runID}`
          await Minio.putUploadIntoBucket(bucketName, geneset, 'GSVA/GSVA_INPUTS/geneset.gmt')      

          // const g = await geneset
          // run.uploadNames.gsva = g.filename
          // await run.save()

          return run
        }
      } catch(error) {
        console.log(error)
      }
    },

    updateRunReferenceDatasets: async (parent, {runID, datasetIDs}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        run.referenceDatasetIDs = datasetIDs
        await run.save()
        return run
      } catch(error) {
        console.log(error)
      }
    },

    // edit run description
    updateRunDescription: async (parent, {runID, newDescription}, {Runs}) => {
      const run = await Runs.findOne({runID})
      run.description = newDescription
      await run.save()
      return run
    },

    // edit run name
    updateRunName: async (parent, {runID, newName}, {Runs}) => {
      const run = await Runs.findOne({runID})
      run.name = newName
      await run.save()
      return run
    },
    
    savePlotQuery: async (parent, {runID, input}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        run.savedPlotQueries = [...run.savedPlotQueries, R.omit(['plotQueryID'], input)]
        await run.save()
        return run
      } catch (err) {
        console.log(err)
      }
    },

    updateSavedPlotQuery: async (parent, {runID, input}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        const plotQueryIndex = R.findIndex(R.propEq('id', input.plotQueryID))(run.savedPlotQueries);
        const fieldsToChange = R.compose(
          R.reduce((obj, field) => {
            obj[`savedPlotQueries.${plotQueryIndex}.${field}`] = input[field]
            return obj
          }, {}),
          R.keys(R.__),
          R.omit(['plotQueryID'])
        )(input)
        await Runs.updateOne({runID}, {$set: fieldsToChange})
        return run
      } catch (err) {
        console.log(err)
      }
    },

    removeSavedPlotQuery: async (parent, {runID, plotQueryID}, {Runs}) => {
      try {
        const run = await Runs.findOne({runID})
        run.savedPlotQueries = R.filter(query => !R.equals(query.id, plotQueryID), run.savedPlotQueries)
        await run.save()
        return run
      } catch (err) {
        console.log(err)
      }
    },
  },
  Run: {
    createdBy: async({createdBy}, variables, {Users}) => {
      const user = await Users.findOne({userID: createdBy})
      return user
    },
    // Subfield resolvers
    project: async ({projectID}, variables, {Projects}) => {
      // Find project that run belongs to
      const project = await Projects.findOne({projectID})
      return project
    },

    datasets: async({datasetIDs}, variables, {Datasets}) => {
      try {
        return await Datasets.find({datasetID: {$in: datasetIDs}})
      } catch(error) {
        console.log(error)
      }
    },
    referenceDatasets: async ({referenceDatasetIDs}, variables, {Datasets}) => {
      try {
        return await Datasets.find({datasetID: {$in: referenceDatasetIDs}})
      } catch(error) {
        console.log(error)
      }
    },

    logs: async({runID}, variables, {Docker}) => {
      try {
        let containerID = await Docker.getContainerId(runID);
        if (containerID == null)
          return null;
        return await Docker.getLogs(containerID);
      } catch (error) {
        console.log(error)
      }
    },

    hasResults: async ({runID}, variables, {Minio}) => {
      try {
        const runBucketObjects = await Minio.bucketObjectsList(`run-${runID}`)
        const hasResultsDir = R.any(R.propEq('prefix', 'SEURAT/'))
        return hasResultsDir(runBucketObjects)
      } catch (error) {
        console.log(error)
      }
    },

    status: async({wesID, status}, variables, {Runs, dataSources, Docker}) => {
      
      
      // If it has not been submitted yet
      if (wesID == null)
        return status;
      
      // Make request to wes and figure out status
      let ret = status;
      // Assuming run status can never change from completed or failed, we don't need to ask wes
      if (status != 'completed' && status != 'failed') {
        try {
          response = await dataSources.wesAPI.getStatus(wesID);
        }
        catch (error){
          console.log("Error geting status of " + wesID + " from wes");
          return ret;
        }
        // Translate WES status to Run status
        if (response.state == "COMPLETE") {
          ret = "completed";
        } else if (response.state == "EXECUTOR_ERROR") {
          ret = "failed";
        } else if (response.state == "RUNNING") {
          ret = "submitted";
        }
        // Update status in mongo to conform with status from wes, unless the run is already completed
        await Runs.updateOne({"wesID": wesID}, {$set: {"status": ret}}, function(err, res) {
          if (err)
            console.log(err);
        });
      }

      return ret;
    },
    completedOn: async({wesID, runID, completedOn, submittedOn}, variables, {Runs, Minio, dataSources}) => {
      // If we have already found completedOn, we don't want to recalculate it
      if (completedOn != null){
        return completedOn;
      }
      // If the run has not been submitted yet
      if (wesID == null){
        return completedOn;
      }

      // Otherwise we now find completedOn and upload log file:

      // Default value for completedOn, if you see a running time that is increasing on frontend, it is because this was never changed below
      let completionDate = null;
      try {
        response = await dataSources.wesAPI.getRunData(wesID);
      }
      catch (error){
        console.log("Error getting response from wes")
        return completedOn;
      }
      // Check if run failed or succeded, in which case there should be a log
      if (response.state == 'EXECUTOR_ERROR'){
        // Put log file in minio and check completedOn from mtime of log file
        // response = await dataSources.wesAPI.getRunData(wesID);
        // Send response.data.run_log.stderr to minio via buffer
        console.log("Sending runLog for " + runID + " to minio");
        Minio.client.putObject("run-" + runID, 'failedRunLog-' + runID + '.txt', response.run_log.stderr);

        // Now update completedOn by checking lastModified date of failed log file
        let logFilePrefix = "failed_file:---" + response.request.workflow_attachment.substring(8).split('/').join('-');
        
        try {
          // We check for multiple failed log files in case retryCount for jobs is set to > 1
          let logFiles = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix));
          // Try to get mtime of failed log file
          let latestLogDate = null;
        
          // Find the latest log file and record it's last modified date
          logFiles.forEach(element => {
            const logFileStats = fs.statSync("wes/logs/" + element);
            if (logFileStats.mtime > latestLogDate)
              latestLogDate = logFileStats.mtime;
          })
          // If no log files were found on fail, set time to time of refresh
          completionDate = latestLogDate != null ? latestLogDate : Date.now();
        } catch (error) {
          console.log("Issue finding failed log file for run " + runID);
        }

        await cleanTempDir(wesID, dataSources.wesAPI, response)

      }
      else if (response.state == "COMPLETE"){
        
        // Put log file in minio and update completedOn
        try {
          response = await dataSources.wesAPI.getRunData(wesID);
        }
        catch (error) {
          console.log("Error getting response from wes")
          return completedOn;
        }
        // Find log file and send it to minio
        // Parse response to find name of log file in wes/logs
        let logFilePrefix = "file:---" + response.request.workflow_attachment.substring(8).split('/').join('-');
        // let logFile = "wes/logs/" + fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix)).filter(fn => fn.toLowerCase().includes('seurat'))[0];
        console.log("Sending runLog for run " + runID + " to minio");
        let usefulLogFiles = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix)).filter(fn => { return !fn.includes('clean') && !fn.includes('extract') && !fn.includes('upload') });

        usefulLogFiles.forEach(file => {
          let removePrefix = file.replace(logFilePrefix, '')
          let name = removePrefix.substring(0, removePrefix.indexOf('.'))
          // Send to minio
          Minio.client.fPutObject("run-" + runID, 'runLog-' + name + "-" + runID + '.txt', "wes/logs/" + file);
        })

        // Sum running times of each job and add to submittedOn
        let files = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix));
        
        let totalSeconds = parseFloat('0');
        files.forEach(element => {
          // Sum the timing information from these files by spawning processes that tail the last line
          let line = execSync('tail -1 wes/logs/' + element, {encoding: 'utf-8'});
          line = line.toString().split(' ');
          totalSeconds += parseFloat(line[line.length - 2]);
        });
        // Now do date math with submittedOn
        completionDate = new Date(submittedOn.getTime() + totalSeconds*1000);

        await cleanTempDir(wesID, dataSources.wesAPI, response)
      }
      else {
        // If status is not completed or failed, there is no need for a completedOn date or log file
        return null;
      }

      // If logfile space is an issue, the log files can be deleted here
      
      // Finally upload date to mongo and return it
      Runs.updateOne({"wesID": wesID}, {$set: {"completedOn": completionDate}}, function(err, res) {
        if (err)
          console.log(err);
      });
      
      return completionDate;
    },
  },
  SecondaryRun: {
    status: async ({wesID, status}, variables, {Runs, dataSources}) => {
      try {
        // If it has not been submitted yet
        if (wesID == null)
          return status;
        
        // Make request to wes and figure out status
        let ret = status;
        // Assuming run status can never change from completed or failed, we don't need to ask wes
        // if (status != 'completed' && status != 'failed') {
          try {
            response = await dataSources.wesAPI.getStatus(wesID);
          }
          catch (error){
            console.log("Error geting status of " + wesID + " from wes");
            return ret;
          }
          // Translate WES status to Run status
          if (response.state == "COMPLETE") {
            ret = "completed";
          } else if (response.state == "EXECUTOR_ERROR") {
            ret = "failed";
          } else if (response.state == "RUNNING") {
            ret = "submitted";
          }
          // Update status in mongo to conform with status from wes, unless the run is already completed
          
          // fix 
          await Runs.updateOne({"secondaryRuns.wesID": wesID}, {$set: {"secondaryRuns.$.status": ret}}, function(err, res) {
          // await Runs.updateOne({"wesID": wesID}, {$set: {"status": ret}}, function(err, res) {
            if (err)
              console.log(err);
          });
        // }
        return ret;
      } catch (error) {
        console.log(error)
      }
    },
    logs: async({runID}, variables, {Docker}) => {
      try {
        let containerID = await Docker.getContainerId(runID);
        if (containerID == null)
          return null;
        return await Docker.getLogs(containerID);
      } catch (error) {
        console.log(error)
      }
    },
    completedOn: async({wesID, completedOn, submittedOn}, variables, {Runs, Minio, dataSources}) => {
      // If we have already found completedOn, we don't want to recalculate it
      if (completedOn != null){
        return completedOn;
      }
      // If the run has not been submitted yet
      if (wesID == null){
        return completedOn;
      }

      const run = await Runs.findOne({"secondaryRuns.wesID": wesID})
      const runID = run.runID  

      // Otherwise we now find completedOn and upload log file:

      // Default value for completedOn, if you see a running time that is increasing on frontend, it is because this was never changed below
      let completionDate = null;
      try {
        response = await dataSources.wesAPI.getRunData(wesID);
      }
      catch (error){
        console.log("Error getting response from wes")
        return completedOn;
      }
      // Check if run failed or succeded, in which case there should be a log
      if (response.state == 'EXECUTOR_ERROR'){
        // Put log file in minio and check completedOn from mtime of log file
        // response = await dataSources.wesAPI.getRunData(wesID);
        // Send response.data.run_log.stderr to minio via buffer
        console.log("Sending runLog for " + wesID + " to minio");
        Minio.client.putObject("run-" + runID, 'failedAnnotationRunLog-' + wesID + '.txt', response.run_log.stderr);

        // Now update completedOn by checking lastModified date of failed log file
        let logFilePrefix = "failed_file:---" + response.request.workflow_attachment.substring(8).split('/').join('-');
        
        try {
          // We check for multiple failed log files in case retryCount for jobs is set to > 1
          let logFiles = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix));
          // Try to get mtime of failed log file
          let latestLogDate = null;
        
          // Find the latest log file and record it's last modified date
          logFiles.forEach(element => {
            const logFileStats = fs.statSync("wes/logs/" + element);
            if (logFileStats.mtime > latestLogDate)
              latestLogDate = logFileStats.mtime;
          })
          // If no log files were found on fail, set time to time of refresh
          completionDate = latestLogDate != null ? latestLogDate : Date.now();
        } catch (error) {
          console.log("Issue finding failed log file for run " + wesID);
        }

        await cleanTempDir(wesID, dataSources.wesAPI, response)

      }
      else if (response.state == "COMPLETE"){
        
        // Put log file in minio and update completedOn
        try {
          response = await dataSources.wesAPI.getRunData(wesID);
        }
        catch (error) {
          console.log("Error getting response from wes")
          return completedOn;
        }
        // Find log file and send it to minio
        // Parse response to find name of log file in wes/logs
        let logFilePrefix = "file:---" + response.request.workflow_attachment.substring(8).split('/').join('-');
        // let logFile = "wes/logs/" + fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix)).filter(fn => fn.toLowerCase().includes('seurat'))[0];
        console.log("Sending runLog for run " + wesID + " to minio");
        let usefulLogFiles = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix)).filter(fn => { return !fn.includes('clean') && !fn.includes('extract') && !fn.includes('upload') });

        usefulLogFiles.forEach(file => {
          let removePrefix = file.replace(logFilePrefix, '')
          let name = removePrefix.substring(0, removePrefix.indexOf('.'))
          // Send to minio
          Minio.client.fPutObject("run-" + runID, 'annotationRunLog-' + name + "-" + wesID + '.txt', "wes/logs/" + file);
        })

        // Sum running times of each job and add to submittedOn
        let files = fs.readdirSync('wes/logs').filter(fn => fn.startsWith(logFilePrefix));
        
        let totalSeconds = parseFloat('0');
        files.forEach(element => {
          // Sum the timing information from these files by spawning processes that tail the last line
          let line = execSync('tail -1 wes/logs/' + element, {encoding: 'utf-8'});
          line = line.toString().split(' ');
          totalSeconds += parseFloat(line[line.length - 2]);
        });
        // Now do date math with submittedOn
        completionDate = new Date(submittedOn.getTime() + totalSeconds*1000);

        await cleanTempDir(wesID, dataSources.wesAPI, response)
      }
      else {
        // If status is not completed or failed, there is no need for a completedOn date or log file
        return null;
      }

      // If logfile space is an issue, the log files can be deleted here
      
      // Finally upload date to mongo and return it
      Runs.updateOne({"secondaryRuns.wesID": wesID}, {$set: {"secondaryRuns.$.completedOn": completionDate}}, function(err, res) {
        if (err)
          console.log(err);
      });
      
      return completionDate;
    },
  }
}

module.exports = resolvers
exports.Formatter = function(opts) {
  return {
    logStreams: {'general': ''},
    previousLogData: '',
    currentBucket: 'general',
    bucketNameRegex: opts.log_bucket_re

    receive: function(data) {
      if (!this._hasContinuedOutput(this.previousLogData)) {
        this.currentBucket = this._getBucketName(data);
      }
      this.previousLogData = data.toString();

      if (this.logStreams[this.currentBucket] === undefined) {
        this.logStreams[this.currentBucket] = '';
      }

      //this.baton.log.debug('Bucket Key: ' + this.currentBucket);
      //this.baton.log.debug('String: ' + data);
      this.logStreams[this.currentBucket] += data;
    },

    result: function() {
      var resultString;

      for (var bucket in this.logStreams) {
        if (this.logStreams.hasOwnProperty(bucket)) {
          //this.baton.log.debug('BUCKET: ' + bucket + '\nHAS DATA: ' + this.logStreams[bucket]);
          resultString += '\n\nBUCKET (' + bucket + ')\n';
          resultString += this.logStreams[bucket];
        }
      }

      return resultString;
    },

    _getBucketName: function(data, spawnOpts) {
      var defaultBucket, bucketName;

      bucketName = this.bucketNameRegex.exec(data);
      defaultBucket = 'general';

      if (bucketName === null) {
        return defaultBucket;
      }

      return bucketName[0];
    },

    _findLastIndex: function(logData, bucketName, lastIndex) {
      var index;

      index = logData.indexOf(bucketName, lastIndex);
      if (index === -1) {
        return lastIndex;
      }

      return this._findLastIndex(logData, bucketName, index + bucketName.length);
    },

    _hasContinuedOutput: function(logData) {
      var indexOfContinuedOutput, hasOutputAppended, bucketLength, checkFor;

      checkFor = this.currentBucket_ + ' out';
      bucketLength = checkFor.length;

      indexOfContinuedOutput = this._findLastIndex(logData, checkFor, 0);
      hasOutputAppended = logData.length > indexOfContinuedOutput + 5;
      return indexOfContinuedOutput !== -1 && !hasOutputAppended;
    }
  };
};

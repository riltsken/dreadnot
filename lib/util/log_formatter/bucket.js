exports.Formatter = function(opts) {
  return {
    logStreams: {'general': ''},
    previousLogData: '',
    currentBucket: 'general',
    previouslyHadContinuedOutput: false,
    bucketNameRegex: opts.logBucketRegex,
    continuedOutputHint: opts.continuedOutputHint || null,

    receive: function(data) {
      this.currentBucket = this._getBucketName(data, this.currentBucket) || 'general';
      this.previousLogData = data.toString();

      if (this.logStreams[this.currentBucket] === undefined) {
        this.logStreams[this.currentBucket] = '';
      }

      this.logStreams[this.currentBucket] += data;
    },

    result: function() {
      var resultString;

      resultString = '';
      for (var bucket in this.logStreams) {
        if (this.logStreams.hasOwnProperty(bucket)) {
          resultString += '\n\nBUCKET (' + bucket + ')\n';
          resultString += this.logStreams[bucket];
        }
      }

      return resultString;
    },

    _getBucketName: function(data, currentBucket) {
      var bucketName;

      bucketName = this.bucketNameRegex.exec(data);

      if (bucketName === null) {
        if (this.previouslyHadContinuedOutput || this._hasContinuedOutput(this.previousLogData)) {
          this.previouslyHadContinuedOutput = true;
          return currentBucket;
        }

        this.previouslyHadContinuedOutput = false;
        return null;
      }

      this.previouslyHadContinuedOutput = false;
      return bucketName[0]
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
      var indexOfContinuedOutput, currentLogIsFine, bucketLength, checkFor;

      checkFor = this.currentBucket + this.continuedOutputHint;
      bucketLength = checkFor.length;

      indexOfContinuedOutput = this._findLastIndex(logData, this.continuedOutputHint, -1);
      currentLogIsFine = logData.length > indexOfContinuedOutput + 1;
      return indexOfContinuedOutput !== -1 && !currentLogIsFine;
    }
  };
};

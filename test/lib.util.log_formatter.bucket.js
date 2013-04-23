var chai = require('chai')
  , Bucket = require('../lib/util/log_formatter/bucket');

describe('Bucket log formatter', function() {

  describe('with normal usage', function () {
    var formatter;

    beforeEach(function() {
      formatter = Bucket.Formatter({'logBucketRegex': /123:/});
    });

    it('outputs strings into different buckets based on a regex', function() {
      var expectedResult;

      formatter.receive('123: oh hello');
      formatter.receive('234: this is a different bucket');
      formatter.receive('123: back to the original');

      expectedResult = '\n\nBUCKET (general)\n234: this is a different bucket\n\nBUCKET (123:)\n123: oh hello123: back to the original';

      chai.expect(formatter.result()).to.equal(expectedResult);
    });
  });

  describe('when log output is continued across many lines', function () {
    var formatter;

    beforeEach(function() {
      formatter = Bucket.Formatter({'logBucketRegex': /\d{3}:/, 'continuedOutputHint': 'moreoutput:'});
    });

    it('can use a hint to sort into the right bucket', function() {
      var expectedResult;

      formatter.receive('123: oh hello moreoutput:');
      formatter.receive(' more output for previous bucket');
      formatter.receive('234: this is a different bucket');
      formatter.receive('123: back to the original');

      expectedResult = '\n\nBUCKET (general)\n\n\nBUCKET (123:)\n123: oh hello moreoutput: more output for previous bucket123: back to the original\n\nBUCKET (234:)\n234: this is a different bucket';

      chai.expect(formatter.result()).to.equal(expectedResult);
    });

    it('can use a hint to sort into the right bucket for multiple lines', function() {
      var expectedResult;

      formatter.receive('123: oh hello moreoutput:');
      formatter.receive(' more output for previous bucket');
      formatter.receive(' extra');
      formatter.receive('234: this is a different bucket');
      formatter.receive('123: back to the original');

      expectedResult = '\n\nBUCKET (general)\n\n\nBUCKET (123:)\n123: oh hello moreoutput: more output for previous bucket extra123: back to the original\n\nBUCKET (234:)\n234: this is a different bucket';

      chai.expect(formatter.result()).to.equal(expectedResult);
    });
  });
});

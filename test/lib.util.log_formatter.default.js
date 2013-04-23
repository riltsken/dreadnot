var chai = require('chai')
  , Default = require('../lib/util/log_formatter/default');

describe('default log formatter', function() {
  var formatter;

  before(function() {
    formatter = Default.Formatter();
  });

  it('appends the data to a single string', function() {
    formatter.receive('one');
    formatter.receive('two');
    formatter.receive('three');

    chai.expect(formatter.result()).to.equal('onetwothree');
  });
});

exports.Formatter = function() {
  return {
    resultString: '',

    receive: function(data) {
      this.resultString += data;
    },

    result: function() {
      return this.resultString;
    }
  };
};

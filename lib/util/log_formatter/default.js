exports.Formatter = function() {
  return {
    resultString: '',

    receive: function(data) {
      resultString += data;
    },

    result: function() {
      return resultString;
    }
  };
};

const { getInMemoryMode, createModelWrapper } = require('../config/inMemoryStore');

const getModel = (modelName, mongooseModel) => {
  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      if (getInMemoryMode()) {
        const inMemModel = createModelWrapper(modelName);
        if (prop in inMemModel) {
          return inMemModel[prop];
        }
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });
};

module.exports = getModel;
